import { Inject, Injectable } from '@nestjs/common';
import type { Redis } from 'ioredis';

import { ENV } from '../../infrastructure/config/config.module';
import type { BackendEnv } from '../../infrastructure/config/env.schema';
import { PLATFORM_REDIS } from '../../infrastructure/redis/redis.constants';

import { MemoryOAuthStateStore, OAuthStateStore } from './oauth-state.store';

const STEAM_CONNECT_KEY_PREFIX = 'gmrlog:steam-connect-state:';

/**
 * The pending-attempt record `/auth/connect/steam/start` writes and
 * `/callback` consumes (task 4.5). Unlike `OAuthStateRecord` there is no
 * `codeVerifier` — Steam's OpenID 2.0 return has no code exchange at all —
 * but there is a `userId`, because unlike a login attempt this flow only
 * ever runs against an already-authenticated user: `/callback` refuses to
 * complete a record against any session but the one that opened it.
 * `returnToBase` is the exact, allowlisted URI the client requested before
 * `state` was appended to it, kept so the callback can reconstruct the exact
 * `openid.return_to` value Steam must echo back.
 */
export interface SteamConnectStateRecord {
  userId: string;
  returnToBase: string;
  createdAt: number;
}

/**
 * Reuses `OAuthStateStore`'s Redis GETDEL/TTL mechanics under a distinct key
 * namespace and record shape (see that class's doc comment) — Steam's
 * protocol doesn't fit `OAuthStateRecord`, but the single-use/anti-replay
 * primitive it needs is identical, so this subclasses rather than
 * reimplementing it.
 */
@Injectable()
export class SteamConnectStateStore extends OAuthStateStore<SteamConnectStateRecord> {
  constructor(@Inject(PLATFORM_REDIS) redis: Redis, @Inject(ENV) env: BackendEnv) {
    super(redis, env, STEAM_CONNECT_KEY_PREFIX);
  }
}

/** In-memory Steam connect state store for unit tests. */
export class MemorySteamConnectStateStore extends MemoryOAuthStateStore<SteamConnectStateRecord> {}
