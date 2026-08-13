import type { SteamConnectStartResponse, UserIntegrationResponse } from '@gmrlog/types';
import { steamConnectCallbackSchema, steamConnectStartSchema } from '@gmrlog/validators';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Inject,
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
import { SteamConnectService } from '../../integrations/steam-connect.service';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import type { RequestIdentity } from '../interfaces/identity';
import { playerIdOf } from '../player-id';

import { SteamConnectCallbackDto, SteamConnectStartDto } from './dto/oauth.dto';
import { generateState } from './pkce';
import { SteamOpenIdError, SteamOpenIdProvider } from './providers/steam-openid.provider';
import { SteamConnectStateStore } from './steam-connect-state.store';

/**
 * Steam **connect** surface (task 4.5) — deliberately not a sibling of
 * `OAuthController`. OAUTH.md §1 is explicit that Steam is "not available as
 * identity" (OpenID 2.0, no code exchange, no PKCE, no userinfo, no email),
 * so it never resolves or creates a user the way Google/Discord do: every
 * route here sits behind `JwtAuthGuard` and attaches a verified SteamID to
 * whichever user is *already* signed in. There is no email-capture step —
 * that only makes sense for a login provider, and Steam isn't one.
 *
 * OAUTH.md's own Steam section (§1, §7 step 5) describes a different shape —
 * Steam as a signup-time login option with an email-capture fallback. That
 * was written before this task's brief overrode it: Steam connect runs
 * against an account that already has an email claim, so email-capture here
 * would just reintroduce the login path this controller exists to avoid.
 * Recorded as a deliberate deviation from the doc, not an oversight.
 *
 * The write path (`SteamConnectService.connectVerified`) is shared with the
 * pre-existing, unverified `POST /integrations/steam/connect` (D3.23,
 * self-reported SteamID/vanity URL, no proof of ownership) — same
 * `UserIntegration`/`ExternalProfile`/`ConnectedAccount` upsert, same
 * duplicate-SteamID guard, same idempotent reconnect. The two surfaces are
 * left to coexist: unifying or retiring the unverified one is a product
 * call this task doesn't make, but it's worth flagging that today a player
 * can still self-report any unclaimed SteamID there with no ownership
 * check at all — this controller is the verified alternative, not a
 * replacement for it.
 *
 * Out of scope, by the same brief: importing or syncing a connected
 * player's Steam library. `SteamConnectService.connectVerified` only
 * upserts the connection rows above; `POST /integrations/:id/sync` (already
 * built, D3.23) is the separate, existing surface that pulls owned games —
 * wiring that trigger to fire automatically after a verified connect is
 * left for whoever picks up the import/sync task next.
 */
@ApiTags('oauth')
@ApiBearerAuth('bearer')
@Controller('auth/connect/steam')
@UseGuards(JwtAuthGuard)
export class SteamConnectController {
  constructor(
    private readonly steamOpenId: SteamOpenIdProvider,
    private readonly stateStore: SteamConnectStateStore,
    private readonly steamConnect: SteamConnectService,
    @Inject(ENV) private readonly env: BackendEnv,
  ) {}

  @Post('start')
  @RateLimitClass('auth')
  @ApiZodBody(steamConnectStartSchema)
  async start(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: SteamConnectStartDto,
  ): Promise<SteamConnectStartResponse> {
    if (!this.steamOpenId.isEnabled()) {
      throw new ServiceUnavailableException({
        code: 'STEAM_CONNECT_PROVIDER_UNAVAILABLE',
        message: 'Steam connect is not configured',
      });
    }
    if (!this.env.STEAM_OPENID_ALLOWED_RETURN_URIS.includes(body.returnTo)) {
      throw new BadRequestException('returnTo is not registered for this environment');
    }

    const state = generateState();
    const returnTo = withStateParam(body.returnTo, state);

    await this.stateStore.put(
      state,
      {
        userId: playerIdOf(identity),
        returnToBase: body.returnTo,
        createdAt: Date.now(),
      },
      this.env.OAUTH_STATE_TTL_SECONDS,
    );

    const authorizeUrl = this.steamOpenId.buildAuthorizeUrl({ returnTo });
    return { authorizeUrl, state };
  }

  @Post('callback')
  @RateLimitClass('auth')
  @ApiZodBody(steamConnectCallbackSchema)
  async callback(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: SteamConnectCallbackDto,
  ): Promise<UserIntegrationResponse> {
    const state = body.query.state;
    if (typeof state !== 'string' || state.length === 0) {
      throw new UnauthorizedException({
        code: 'STEAM_CONNECT_STATE_INVALID',
        message: 'That connection expired. Try again.',
      });
    }

    // Single-use (GETDEL): a replayed or forged callback URL misses on every
    // attempt after the first — see `OAuthStateStore`'s doc comment. Also
    // scoped to the session that opened it: a state minted for one player
    // can't be redeemed by completing the callback as a different one.
    const record = await this.stateStore.consume(state);
    if (record?.userId !== playerIdOf(identity)) {
      throw new UnauthorizedException({
        code: 'STEAM_CONNECT_STATE_INVALID',
        message: 'That connection expired. Try again.',
      });
    }

    const expectedReturnTo = withStateParam(record.returnToBase, state);

    let steamId64: string;
    try {
      ({ steamId64 } = await this.steamOpenId.verifyAssertion(body.query, {
        returnTo: expectedReturnTo,
      }));
    } catch (error) {
      if (error instanceof SteamOpenIdError) {
        throw new UnauthorizedException({
          code: 'STEAM_CONNECT_VERIFICATION_FAILED',
          message: 'Steam could not verify that sign-in. Try again.',
        });
      }
      throw error;
    }

    try {
      return await this.steamConnect.connectVerified(record.userId, steamId64);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException({
          code: 'STEAM_CONNECT_ALREADY_LINKED',
          message: 'This Steam account is already connected to another player.',
        });
      }
      throw error;
    }
  }
}

/** Deterministic so the value built at `/start` and rebuilt at `/callback` match exactly. */
function withStateParam(base: string, state: string): string {
  const url = new URL(base);
  url.searchParams.set('state', state);
  return url.toString();
}
