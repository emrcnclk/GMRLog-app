import type {
  OAuthProviderKind,
  OAuthStartResponse,
  SessionCredentialResponse,
} from '@gmrlog/types';
import { oauthStartSchema } from '@gmrlog/validators';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Inject,
  NotFoundException,
  Param,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ENV } from '../../infrastructure/config/config.module';
import type { BackendEnv } from '../../infrastructure/config/env.schema';
import { RateLimitClass } from '../../infrastructure/http/rate-limit.interceptor';
import { ApiZodBody } from '../../infrastructure/openapi/swagger.decorators';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import type { RequestIdentity } from '../interfaces/identity';
import { playerIdOf } from '../player-id';
import { SessionsService } from '../sessions.service';

import {
  OAuthCallbackDto,
  OAuthConnectCallbackDto,
  OAuthConnectStartDto,
  OAuthStartDto,
} from './dto/oauth.dto';
import { OAuthStateStore } from './oauth-state.store';
import { OAuthService } from './oauth.service';
import type { OAuthIdentity } from './oauth.types';
import { codeChallengeFromVerifier, generateCodeVerifier, generateState } from './pkce';
import { DiscordOAuthError, DiscordOAuthProvider } from './providers/discord.provider';
import { GoogleOAuthError, GoogleOAuthProvider } from './providers/google.provider';

const SUPPORTED_PROVIDERS: readonly OAuthProviderKind[] = ['google', 'discord'];

function isSupportedProvider(provider: string): provider is OAuthProviderKind {
  return (SUPPORTED_PROVIDERS as readonly string[]).includes(provider);
}

interface ProviderAdapter {
  displayName: string;
  isEnabled(): boolean;
  allowedRedirectUris(env: BackendEnv): readonly string[];
  buildAuthorizeUrl(params: { state: string; codeChallenge: string; redirectUri: string }): string;
  exchangeAndFetchIdentity(params: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
  }): Promise<OAuthIdentity>;
}

/**
 * Google + Discord sign-in surface (OAUTH.md §2, §7 steps 3-4, task 4.4).
 * `/start` and `/callback` are the only two routes — the client drives
 * `expo-auth-session` between them; the backend never hands the client a
 * provider token (§2: "the client never sees a client secret or a provider
 * access token — everything crosses the backend"). Both providers create
 * `AuthCredential(type=oauth)` rows only — never `ConnectedAccount` — since
 * this surface is exclusively `AccountLink.purpose = 'login'`; connecting an
 * already-signed-in-with-password user's Discord account for import is a
 * distinct, not-yet-built surface (`ConnectedProvider`/`purpose: 'connect'`)
 * that shares no table row with this one, so a sign-in here can never
 * silently become — or clobber — a connection made there.
 */
@ApiTags('oauth')
@Controller('auth/oauth')
export class OAuthController {
  private readonly providers: Record<OAuthProviderKind, ProviderAdapter>;

  constructor(
    private readonly google: GoogleOAuthProvider,
    private readonly discord: DiscordOAuthProvider,
    private readonly stateStore: OAuthStateStore,
    private readonly oauthService: OAuthService,
    private readonly sessions: SessionsService,
    @Inject(ENV) private readonly env: BackendEnv,
  ) {
    this.providers = {
      google: {
        displayName: 'Google',
        isEnabled: () => this.google.isEnabled(),
        allowedRedirectUris: (env) => env.GOOGLE_OAUTH_ALLOWED_REDIRECT_URIS,
        buildAuthorizeUrl: (params) => this.google.buildAuthorizeUrl(params),
        exchangeAndFetchIdentity: (params) => this.wrapGoogleErrors(params),
      },
      discord: {
        displayName: 'Discord',
        isEnabled: () => this.discord.isEnabled(),
        allowedRedirectUris: (env) => env.DISCORD_OAUTH_ALLOWED_REDIRECT_URIS,
        buildAuthorizeUrl: (params) => this.discord.buildAuthorizeUrl(params),
        exchangeAndFetchIdentity: (params) => this.wrapDiscordErrors(params),
      },
    };
  }

  @Post(':provider/start')
  @RateLimitClass('auth')
  @ApiZodBody(oauthStartSchema)
  async start(
    @Param('provider') provider: string,
    @Body() body: OAuthStartDto,
  ): Promise<OAuthStartResponse> {
    const adapter = this.resolveProvider(provider);
    if (!adapter.isEnabled()) {
      throw new ServiceUnavailableException({
        code: 'OAUTH_PROVIDER_UNAVAILABLE',
        message: `${adapter.displayName} sign-in is not configured`,
      });
    }
    if (!adapter.allowedRedirectUris(this.env).includes(body.redirectUri)) {
      throw new BadRequestException('redirectUri is not registered for this environment');
    }

    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = codeChallengeFromVerifier(codeVerifier);

    await this.stateStore.put(
      state,
      {
        provider: provider as OAuthProviderKind,
        codeVerifier,
        redirectUri: body.redirectUri,
        createdAt: Date.now(),
      },
      this.env.OAUTH_STATE_TTL_SECONDS,
    );

    const authorizeUrl = adapter.buildAuthorizeUrl({
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
    const adapter = this.resolveProvider(provider);

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

    const identity = await adapter.exchangeAndFetchIdentity({
      code: body.code,
      codeVerifier: record.codeVerifier,
      redirectUri: record.redirectUri,
    });

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
            message: `This email is already registered. Sign in with your password, then connect ${adapter.displayName} from Settings.`,
            hasPassword: result.hasPassword,
          });
        }
        throw new UnauthorizedException({
          code: 'OAUTH_ACCOUNT_UNAVAILABLE',
          message: 'This account is no longer available.',
        });
    }
  }

  /**
   * Task 4.7 — Settings "Connect" entry. Authenticated, unlike `/start`:
   * binds the minted `state` to the caller (`OAuthStateRecord.userId`) so
   * `/connect/callback` attaches the resulting identity to *this* player,
   * never to whichever account an email match would otherwise pick.
   */
  @Post(':provider/connect/start')
  @RateLimitClass('auth')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiZodBody(oauthStartSchema)
  async connectStart(
    @CurrentUser() identity: RequestIdentity,
    @Param('provider') provider: string,
    @Body() body: OAuthConnectStartDto,
  ): Promise<OAuthStartResponse> {
    const adapter = this.resolveProvider(provider);
    if (!adapter.isEnabled()) {
      throw new ServiceUnavailableException({
        code: 'OAUTH_PROVIDER_UNAVAILABLE',
        message: `${adapter.displayName} sign-in is not configured`,
      });
    }
    if (!adapter.allowedRedirectUris(this.env).includes(body.redirectUri)) {
      throw new BadRequestException('redirectUri is not registered for this environment');
    }

    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = codeChallengeFromVerifier(codeVerifier);

    await this.stateStore.put(
      state,
      {
        provider: provider as OAuthProviderKind,
        codeVerifier,
        redirectUri: body.redirectUri,
        createdAt: Date.now(),
        userId: playerIdOf(identity),
      },
      this.env.OAUTH_STATE_TTL_SECONDS,
    );

    const authorizeUrl = adapter.buildAuthorizeUrl({
      state,
      codeChallenge,
      redirectUri: body.redirectUri,
    });

    return { authorizeUrl, state };
  }

  /**
   * Task 4.7 — completes a Settings "Connect" attempt. Public route, same as
   * `/callback`: trust comes from the single-use `state` token, not from
   * whatever session redeems it (mirrors `SteamConnectController.callback`'s
   * reasoning, which additionally has a guard to compare against — this
   * route has no equivalent second signal, so `record.userId` is the only
   * source of truth for who this identity attaches to).
   */
  @Post(':provider/connect/callback')
  @RateLimitClass('auth')
  async connectCallback(
    @Param('provider') provider: string,
    @Body() body: OAuthConnectCallbackDto,
  ): Promise<{ connected: true }> {
    const adapter = this.resolveProvider(provider);

    const record = await this.stateStore.consume(body.state);
    if (record?.provider !== provider || record.userId === undefined) {
      throw new UnauthorizedException({
        code: 'OAUTH_STATE_INVALID',
        message: 'That connection expired. Try again.',
      });
    }

    const identity = await adapter.exchangeAndFetchIdentity({
      code: body.code,
      codeVerifier: record.codeVerifier,
      redirectUri: record.redirectUri,
    });

    const result = await this.oauthService.connectLogin(record.userId, identity);
    switch (result.outcome) {
      case 'connected':
      case 'already_connected':
        return { connected: true };
      case 'rejected':
        if (result.reason === 'identity_in_use') {
          throw new ConflictException({
            code: 'OAUTH_IDENTITY_ALREADY_LINKED',
            message: `This ${adapter.displayName} account is already connected to another player.`,
          });
        }
        throw new UnauthorizedException({
          code: 'OAUTH_ACCOUNT_UNAVAILABLE',
          message: 'This account is no longer available.',
        });
    }
  }

  /**
   * Task 4.7's other half of the Settings surface — refuses when this is the
   * caller's last usable sign-in method (`OAuthService.disconnectLogin`).
   */
  @Post(':provider/disconnect')
  @RateLimitClass('auth')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  async disconnect(
    @CurrentUser() identity: RequestIdentity,
    @Param('provider') provider: string,
  ): Promise<{ disconnected: true }> {
    const adapter = this.resolveProvider(provider);
    const result = await this.oauthService.disconnectLogin(
      playerIdOf(identity),
      provider as OAuthProviderKind,
    );
    switch (result.outcome) {
      case 'disconnected':
        return { disconnected: true };
      case 'rejected':
        if (result.reason === 'last_method') {
          throw new ConflictException({
            code: 'LAST_SIGN_IN_METHOD',
            message: `${adapter.displayName} is your only sign-in method. Set a password or connect another provider first.`,
          });
        }
        throw new NotFoundException(`${adapter.displayName} is not connected`);
    }
  }

  private resolveProvider(provider: string): ProviderAdapter {
    if (!isSupportedProvider(provider)) {
      throw new BadRequestException(`Unsupported OAuth provider: ${provider}`);
    }
    return this.providers[provider];
  }

  private async wrapGoogleErrors(params: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
  }): Promise<OAuthIdentity> {
    try {
      return await this.google.exchangeAndFetchIdentity(params);
    } catch (error) {
      if (error instanceof GoogleOAuthError) {
        throw new ServiceUnavailableException({
          code: 'OAUTH_PROVIDER_UNAVAILABLE',
          message: 'Google is not responding. Try again, or use email.',
        });
      }
      throw error;
    }
  }

  private async wrapDiscordErrors(params: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
  }): Promise<OAuthIdentity> {
    try {
      return await this.discord.exchangeAndFetchIdentity(params);
    } catch (error) {
      if (error instanceof DiscordOAuthError) {
        throw new ServiceUnavailableException({
          code: 'OAUTH_PROVIDER_UNAVAILABLE',
          message: 'Discord is not responding. Try again, or use email.',
        });
      }
      throw error;
    }
  }
}
