import { Inject, Injectable } from '@nestjs/common';
import type { Redis } from 'ioredis';

import { ENV } from '../infrastructure/config/config.module';
import type { BackendEnv } from '../infrastructure/config/env.schema';
import { PLATFORM_REDIS } from '../infrastructure/redis/redis.constants';

const KEY_PREFIX = 'gmrlog:password-reset:';

export interface PasswordResetStorePort {
  put(token: string, userId: string): Promise<void>;
  /**
   * Atomically reads the token's user and deletes the token, returning the user
   * or `null` if the token was already spent or never existed.
   *
   * Bug 7 — a reset token is single-use, but reading it and deleting it used to
   * be separate round-trips with a password hash between them. Two requests
   * bearing the same token could both read it, both hash, and both write a
   * password; whoever wrote last owned the account. Redis `GETDEL` collapses
   * the read and the delete into one command, so the first caller takes the
   * token and every other caller sees nothing.
   */
  consume(token: string): Promise<string | null>;
  getUserId(token: string): Promise<string | null>;
  delete(token: string): Promise<void>;
}

@Injectable()
export class PasswordResetStore implements PasswordResetStorePort {
  constructor(
    @Inject(PLATFORM_REDIS) private readonly redis: Redis,
    @Inject(ENV) private readonly env: BackendEnv,
  ) {}

  async put(token: string, userId: string): Promise<void> {
    await this.redis.set(
      `${KEY_PREFIX}${token}`,
      userId,
      'EX',
      this.env.PASSWORD_RESET_TTL_SECONDS,
    );
  }

  async consume(token: string): Promise<string | null> {
    // GETDEL is a single Redis command, so the read and the delete cannot be
    // interleaved by a concurrent caller. Requires Redis 6.2+; the stack runs 7.
    return this.redis.getdel(`${KEY_PREFIX}${token}`);
  }

  /** Read without consuming. Not a validity check for a reset attempt — use `consume`. */
  async getUserId(token: string): Promise<string | null> {
    return this.redis.get(`${KEY_PREFIX}${token}`);
  }

  async delete(token: string): Promise<void> {
    await this.redis.del(`${KEY_PREFIX}${token}`);
  }
}

/** In-memory password reset store for unit tests. */
export class MemoryPasswordResetStore implements PasswordResetStorePort {
  private readonly rows = new Map<string, { userId: string; expiresAt: number }>();

  put(token: string, userId: string, ttlSeconds = 3600): Promise<void> {
    this.rows.set(token, { userId, expiresAt: Date.now() + ttlSeconds * 1000 });
    return Promise.resolve();
  }

  consume(token: string): Promise<string | null> {
    // Read and delete with no await between them, mirroring GETDEL's atomicity.
    const row = this.rows.get(token);
    this.rows.delete(token);
    if (row == null || row.expiresAt <= Date.now()) {
      return Promise.resolve(null);
    }
    return Promise.resolve(row.userId);
  }

  getUserId(token: string): Promise<string | null> {
    const row = this.rows.get(token);
    if (row == null || row.expiresAt <= Date.now()) {
      this.rows.delete(token);
      return Promise.resolve(null);
    }
    return Promise.resolve(row.userId);
  }

  delete(token: string): Promise<void> {
    this.rows.delete(token);
    return Promise.resolve();
  }
}
