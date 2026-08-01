import { createHash } from 'node:crypto';

import { Inject, Injectable, Optional } from '@nestjs/common';
import type { Redis } from 'ioredis';

import { AppLogger } from '../logging/app-logger.service';

import { PLATFORM_REDIS } from './redis.constants';

/** FEED_CACHE.md — short TTL; Postgres remains SoT. */
export const FEED_CACHE_TTL_SECONDS = 45;

export interface FeedCachePage<T> {
  items: readonly T[];
  cursor: { next: string | null; prev?: string | null };
  hasMore: boolean;
  limit: number;
}

/**
 * D3.24 viewer-sensitive feed cache (FEED_CACHE.md).
 * Targeted DEL only — never FLUSHALL / KEYS. Graceful when Redis is down.
 */
@Injectable()
export class FeedCacheService {
  private readonly memory = new Map<string, { expiresAt: number; payload: string }>();

  constructor(
    @Optional() @Inject(PLATFORM_REDIS) private readonly redis: Redis | null,
    @Optional() private readonly logger: AppLogger | null,
  ) {}

  homeKey(userId: string, filter: string, cursor: string | undefined): string {
    return `feed:home:${userId}:${filter}:${cursorHash(cursor)}`;
  }

  communityKey(communityId: string, userId: string, cursor: string | undefined): string {
    return `feed:community:${communityId}:${userId}:${cursorHash(cursor)}`;
  }

  gameKey(gameId: string, viewerKey: string, cursor: string | undefined): string {
    return `feed:game:${gameId}:${viewerKey}:${cursorHash(cursor)}`;
  }

  discoverKey(viewerKey: string, window: string, cursor: string | undefined): string {
    return `feed:discover:${viewerKey}:${window}:${cursorHash(cursor)}`;
  }

  async getPage<T>(key: string): Promise<FeedCachePage<T> | null> {
    const raw = await this.getRaw(key);
    if (raw === null) {
      return null;
    }
    try {
      return JSON.parse(raw) as FeedCachePage<T>;
    } catch {
      await this.delKeys([key]);
      return null;
    }
  }

  async setPage<T>(key: string, page: FeedCachePage<T>, indexKey?: string): Promise<void> {
    const payload = JSON.stringify(page);
    await this.setRaw(key, payload, FEED_CACHE_TTL_SECONDS);
    if (indexKey !== undefined) {
      await this.indexAdd(indexKey, key);
    }
  }

  async invalidateHome(userId: string): Promise<void> {
    await this.invalidateIndex(`feed:home:index:${userId}`);
    const filters = [
      'for_you',
      'following',
      'games',
      'reviews',
      'media',
      'communities',
      'events',
    ] as const;
    await this.delKeys(filters.map((filter) => this.homeKey(userId, filter, undefined)));
  }

  async invalidateGame(gameId: string): Promise<void> {
    await this.invalidateIndex(`feed:game:index:${gameId}`);
  }

  async invalidateCommunity(communityId: string): Promise<void> {
    await this.invalidateIndex(`feed:community:index:${communityId}`);
  }

  homeIndexKey(userId: string): string {
    return `feed:home:index:${userId}`;
  }

  gameIndexKey(gameId: string): string {
    return `feed:game:index:${gameId}`;
  }

  communityIndexKey(communityId: string): string {
    return `feed:community:index:${communityId}`;
  }

  private async getRaw(key: string): Promise<string | null> {
    try {
      if (this.redis?.status === 'ready') {
        return await this.redis.get(key);
      }
    } catch (error: unknown) {
      this.warn('feed.cache.get.failed', error);
    }
    const cached = this.memory.get(key);
    if (cached === undefined) {
      return null;
    }
    if (cached.expiresAt <= Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return cached.payload;
  }

  private async setRaw(key: string, payload: string, ttlSeconds: number): Promise<void> {
    try {
      if (this.redis?.status === 'ready') {
        await this.redis.set(key, payload, 'EX', ttlSeconds);
        return;
      }
    } catch (error: unknown) {
      this.warn('feed.cache.set.failed', error);
    }
    this.memory.set(key, { payload, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  private async indexAdd(indexKey: string, memberKey: string): Promise<void> {
    try {
      if (this.redis?.status === 'ready') {
        await this.redis.sadd(indexKey, memberKey);
        await this.redis.expire(indexKey, FEED_CACHE_TTL_SECONDS + 60);
        return;
      }
    } catch (error: unknown) {
      this.warn('feed.cache.index.failed', error);
    }
  }

  private async invalidateIndex(indexKey: string): Promise<void> {
    try {
      if (this.redis?.status === 'ready') {
        const members = await this.redis.smembers(indexKey);
        if (members.length > 0) {
          await this.redis.del(...members, indexKey);
        } else {
          await this.redis.del(indexKey);
        }
        return;
      }
    } catch (error: unknown) {
      this.warn('feed.cache.invalidate.failed', error);
    }
  }

  private async delKeys(keys: readonly string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }
    try {
      if (this.redis?.status === 'ready') {
        await this.redis.del(...keys);
        return;
      }
    } catch (error: unknown) {
      this.warn('feed.cache.del.failed', error);
    }
    for (const key of keys) {
      this.memory.delete(key);
    }
  }

  private warn(event: string, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.logger?.event('warn', { error: message }, event);
  }
}

function cursorHash(cursor: string | undefined): string {
  if (cursor === undefined || cursor.trim().length === 0) {
    return 'start';
  }
  return createHash('sha256').update(cursor).digest('hex').slice(0, 16);
}
