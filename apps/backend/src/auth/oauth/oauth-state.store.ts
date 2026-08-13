import { Inject, Injectable, Optional } from '@nestjs/common';
import type { Redis } from 'ioredis';

import { ENV } from '../../infrastructure/config/config.module';
import type { BackendEnv } from '../../infrastructure/config/env.schema';
import { PLATFORM_REDIS } from '../../infrastructure/redis/redis.constants';

import type { OAuthIdentity } from './oauth.types';

const OAUTH_KEY_PREFIX = 'gmrlog:oauth-state:';

/**
 * The pending-attempt record `/start` writes and `/callback` consumes
 * (OAUTH.md §2 steps 1-3). Binds `state` to everything the callback needs to
 * trust it — which provider issued it, the PKCE verifier, and the exact
 * redirect URI that must come back unchanged.
 */
export interface OAuthStateRecord {
  provider: OAuthIdentity['provider'];
  codeVerifier: string;
  redirectUri: string;
  createdAt: number;
}

export interface OAuthStateStorePort<T> {
  put(state: string, record: T, ttlSeconds: number): Promise<void>;
  /** Atomic get-and-delete — a `state` value works exactly once, ever. */
  consume(state: string): Promise<T | null>;
}

/**
 * `account_links` can't hold this (OAUTH.md §2 step 1 describes a `pending`
 * row created before a user exists; `AccountLink.userId` is non-nullable, so
 * there is no user to attach it to yet — see 4.2's note on the same wall).
 * Redis, mirroring `PasswordResetStore`'s already-accepted shape for the
 * identical problem (a short-lived, single-use, identity-bearing token):
 *
 * - **Replay** is closed by `GETDEL` — a single Redis command that reads and
 *   deletes atomically, so a second `consume()` of the same `state` (a
 *   captured/replayed callback URL) always misses, with no read-then-delete
 *   window for two racing callbacks to both see it present. A Postgres table
 *   gets the same atomicity only via an explicit `UPDATE ... WHERE status =
 *   'pending' RETURNING *` compare-and-swap — doable, but it's the thing you
 *   have to get right by hand instead of getting for free from the primitive.
 * - **Expiry** is `EX` on write, not a query filter or a cleanup job. This
 *   codebase already has a live example of the alternative going wrong: the
 *   release-gate script leaves ~100k stray `Community` rows behind because
 *   nothing ever swept them (CLAUDE.md, "Known environment traps"). A TTL
 *   key self-deletes; it can't become that.
 * - **CSRF** is closed by `state` itself being the lookup key: an unguessably
 *   random, server-generated, single-use value the client must echo back
 *   unmodified. `/callback` additionally checks the *provider in the URL*
 *   against `record.provider` (a state minted for `/start/discord` cannot be
 *   redeemed against `/callback/google`) and the *redirect URI* it received
 *   against `record.redirectUri`, so a token meant for one client surface
 *   can't be replayed against another.
 *
 * Trade-off accepted explicitly, not by default: `PlatformRedisLifecycle`
 * defers its connect on boot and never retries (CLAUDE.md's Redis trap), so
 * if Redis is down, `/start` and `/callback` fail — they already sit behind
 * `RateLimitClass('auth')`, which is fail-closed (503
 * `INTEGRATION_UNAVAILABLE`) for exactly this reason, so this doesn't add a
 * new failure mode to the auth surface, it reuses the one that already
 * exists there.
 *
 * Generic over the record shape (default `OAuthStateRecord`) and the Redis
 * key prefix so a different single-use, state-bound flow can reuse the exact
 * same mechanics under its own namespace rather than reimplementing GETDEL/
 * TTL/malformed-payload handling — task 4.5's `SteamConnectStateStore` below
 * is that reuse: Steam's OpenID 2.0 return shares none of OAuth2's protocol
 * (no code, no PKCE verifier), but it needs the identical single-use,
 * TTL-bound, unguessable-key primitive, so it subclasses this instead of
 * inventing a second store.
 */
@Injectable()
export class OAuthStateStore<
  T extends { createdAt: number } = OAuthStateRecord,
> implements OAuthStateStorePort<T> {
  constructor(
    @Inject(PLATFORM_REDIS) protected readonly redis: Redis,
    @Inject(ENV) protected readonly env: BackendEnv,
    // Not a DI token — plain constructor default. `@Optional()` stops Nest
    // from trying to resolve a provider for the bare `string` design type
    // (it would otherwise look up a token literally named `String` and
    // fail); resolving to `undefined` still lets the default apply, since
    // JS default parameters trigger on an explicit `undefined` argument.
    @Optional() private readonly keyPrefix: string = OAUTH_KEY_PREFIX,
  ) {}

  async put(state: string, record: T, ttlSeconds: number): Promise<void> {
    await this.redis.set(`${this.keyPrefix}${state}`, JSON.stringify(record), 'EX', ttlSeconds);
  }

  async consume(state: string): Promise<T | null> {
    const raw = await this.redis.getdel(`${this.keyPrefix}${state}`);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
}

/** In-memory OAuth state store for unit tests. */
export class MemoryOAuthStateStore<
  T extends { createdAt: number } = OAuthStateRecord,
> implements OAuthStateStorePort<T> {
  private readonly rows = new Map<string, { record: T; expiresAt: number }>();

  put(state: string, record: T, ttlSeconds: number): Promise<void> {
    this.rows.set(state, { record, expiresAt: Date.now() + ttlSeconds * 1000 });
    return Promise.resolve();
  }

  consume(state: string): Promise<T | null> {
    const row = this.rows.get(state);
    this.rows.delete(state);
    if (row === undefined || row.expiresAt <= Date.now()) {
      return Promise.resolve(null);
    }
    return Promise.resolve(row.record);
  }
}
