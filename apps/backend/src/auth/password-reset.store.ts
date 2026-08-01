import { Inject, Injectable } from '@nestjs/common';
import type { Redis } from 'ioredis';

import { ENV } from '../infrastructure/config/config.module';
import type { BackendEnv } from '../infrastructure/config/env.schema';
import { PLATFORM_REDIS } from '../infrastructure/redis/redis.constants';

const KEY_PREFIX = 'gmrlog:password-reset:';

export interface PasswordResetStorePort {
  put(token: string, userId: string): Promise<void>;
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
