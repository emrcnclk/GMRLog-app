import type { OAuthStartResponse, SessionCredentialResponse } from '@gmrlog/types';
import { oauthStartSchema } from '@gmrlog/validators';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Inject,
  Param,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ENV } from '../../infrastructure/config/config.module';
import type { BackendEnv } from '../../infrastructure/config/env.schema';
import { RateLimitClass } from '../../infrastructure/http/rate-limit.interceptor';
import { ApiZodBody } from '../../infrastructure/openapi/swagger.decorators';
import { SessionsService } from '../sessions.service';

import { OAuthCallbackDto, OAuthStartDto } from './dto/oauth.dto';
import { OAuthStateStore } from './oauth-state.store';
import { OAuthService } from './oauth.service';
import type { OAuthIdentity } from './oauth.types';
import { codeChallengeFromVerifier, generateCodeVerifier, generateState } from './pkce';
import { GoogleOAuthError, GoogleOAuthProvider } from './providers/google.provider';

const SUPPORTED_PROVIDER = 'google';

/**
 * Google sign-in surface (OAUTH.md §2, §7 step 3). `/start` and `/callback`
 * are the only two routes — the client drives `expo-auth-session` between
 * them; the backend never hands the client a provider token (§2: "the client
 * never sees a client secret or a provider access token — everything
 * crosses the backend").
 */
@ApiTags('oauth')
@Controller('auth/oauth')
export class OAuthController {
  constructor(
    private readonly google: GoogleOAuthProvider,
    private readonly stateStore: OAuthStateStore,
    private readonly oauthService: OAuthService,
    private readonly sessions: SessionsService,
    @Inject(ENV) private readonly env: BackendEnv,
  ) {}

  @Post(':provider/start')
  @RateLimitClass('auth')
  @ApiZodBody(oauthStartSchema)
  async start(
    @Param('provider') provider: string,
    @Body() body: OAuthStartDto,
  ): Promise<OAuthStartResponse> {
    this.assertSupportedProvider(provider);
    if (!this.google.isEnabled()) {
      throw new ServiceUnavailableException({
        code: 'OAUTH_PROVIDER_UNAVAILABLE',
        message: 'Google sign-in is not configured',
      });
    }
    if (!this.env.GOOGLE_OAUTH_ALLOWED_REDIRECT_URIS.includes(body.redirectUri)) {
      throw new BadRequestException('redirectUri is not registered for this environment');
    }

    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = codeChallengeFromVerifier(codeVerifier);

    await this.stateStore.put(
      state,
      {
        provider,
        codeVerifier,
        redirectUri: body.redirectUri,
        createdAt: Date.now(),
      },
      this.env.OAUTH_STATE_TTL_SECONDS,
    );

    const authorizeUrl = this.google.buildAuthorizeUrl({
      state,
      codeChallenge,
      redirectUri: body.redirectUri,
    });

    return { authorizeUrl, state };
  }

  @Post(':provider/callback')
  @RateLimitClass('auth')
  async callback(
    @Param('provider') provider: string,
    @Body() body: OAuthCallbackDto,
  ): Promise<SessionCredentialResponse> {
    this.assertSupportedProvider(provider);

    // Single-use: `consume` is a Redis GETDEL, so a replayed `state` (a
    // captured/resubmitted callback body) misses on every attempt after the
    // first, and an unknown or expired `state` misses identically — the
    // caller can't distinguish "replayed" from "never existed" from "timed
    // out", which is the point (OAUTH.md §4: "That sign-in expired. Try again.").
    const record = await this.stateStore.consume(body.state);
    if (record?.provider !== provider) {
      throw new UnauthorizedException({
        code: 'OAUTH_STATE_INVALID',
        message: 'That sign-in expired. Try again.',
      });
    }

    let identity: OAuthIdentity;
    try {
      identity = await this.google.exchangeAndFetchIdentity({
        code: body.code,
        codeVerifier: record.codeVerifier,
        redirectUri: record.redirectUri,
      });
    } catch (error) {
      if (error instanceof GoogleOAuthError) {
        throw new ServiceUnavailableException({
          code: 'OAUTH_PROVIDER_UNAVAILABLE',
          message: 'Google is not responding. Try again, or use email.',
        });
      }
      throw error;
    }

    // Controller-level verified-email gate (OAUTH.md §3 rule 3), independent
    // of 4.2's own gate inside `OAuthService`: an unverified email is treated
    // as absent *before* it reaches the matching rules at all, rather than
    // trusting that the service will ignore it correctly. Belt and suspenders
    // on the one branch where "trust the caller" is an account-takeover bug.
    const trustedIdentity: OAuthIdentity = identity.emailVerified
      ? identity
      : { ...identity, email: null, emailVerified: false };

    const result = await this.oauthService.resolveLogin(trustedIdentity);
    switch (result.outcome) {
      case 'signed_in':
      case 'linked':
      case 'created':
        return this.sessions.issueCredentialPair(result.user.id);
      case 'rejected':
        if (result.reason === 'unverified_email_conflict') {
          throw new ConflictException({
            code: 'OAUTH_EMAIL_CONFLICT',
            message:
              'This email is already registered. Sign in with your password, then connect Google from Settings.',
            hasPassword: result.hasPassword,
          });
        }
        throw new UnauthorizedException({
          code: 'OAUTH_ACCOUNT_UNAVAILABLE',
          message: 'This account is no longer available.',
        });
    }
  }

  private assertSupportedProvider(provider: string): asserts provider is typeof SUPPORTED_PROVIDER {
    if (provider !== SUPPORTED_PROVIDER) {
      throw new BadRequestException(`Unsupported OAuth provider: ${provider}`);
    }
  }
}
