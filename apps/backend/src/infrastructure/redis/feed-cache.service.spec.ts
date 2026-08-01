import { describe, expect, it, vi } from 'vitest';

import { FeedCacheService } from './feed-cache.service';

function createFakeRedis(overrides: Record<string, unknown> = {}) {
  const store = new Map<string, string>();
  const sets = new Map<string, Set<string>>();
  return {
    status: 'ready' as const,
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
      return 'OK';
    }),
    del: vi.fn(async (...keys: string[]) => {
      for (const key of keys) {
        store.delete(key);
        sets.delete(key);
      }
      return keys.length;
    }),
    sadd: vi.fn(async (key: string, member: string) => {
      const set = sets.get(key) ?? new Set<string>();
      set.add(member);
      sets.set(key, set);
      return 1;
    }),
    smembers: vi.fn(async (key: string) => [...(sets.get(key) ?? [])]),
    expire: vi.fn(async () => 1),
    store,
    sets,
    ...overrides,
  };
}

describe('FeedCacheService', () => {
  it('round-trips pages via memory fallback when Redis is absent', async () => {
    const cache = new FeedCacheService(null, null);
    const key = cache.homeKey('user-1', 'for_you', undefined);
    await cache.setPage(
      key,
      {
        items: [{ id: 'a' }],
        cursor: { next: null },
        hasMore: false,
        limit: 20,
      },
      cache.homeIndexKey('user-1'),
    );
    const page = await cache.getPage<{ id: string }>(key);
    expect(page?.items).toEqual([{ id: 'a' }]);
  });

  it('builds stable key patterns without wildcards', () => {
    const cache = new FeedCacheService(null, null);
    expect(cache.homeKey('u1', 'reviews', undefined)).toBe('feed:home:u1:reviews:start');
    expect(cache.gameKey('g1', 'anon', undefined)).toBe('feed:game:g1:anon:start');
    expect(cache.communityKey('c1', 'u1', undefined)).toBe('feed:community:c1:u1:start');
    expect(cache.discoverKey('u1', '7d', 'abc')).toMatch(/^feed:discover:u1:7d:/);
    expect(cache.homeIndexKey('u1')).toBe('feed:home:index:u1');
    expect(cache.gameIndexKey('g1')).toBe('feed:game:index:g1');
    expect(cache.communityIndexKey('c1')).toBe('feed:community:index:c1');
  });

  it('uses Redis when ready and invalidates home filter keys', async () => {
    const redis = createFakeRedis();
    const cache = new FeedCacheService(redis as never, null);
    const key = cache.homeKey('user-1', 'for_you', undefined);
    await cache.setPage(
      key,
      { items: [1], cursor: { next: null }, hasMore: false, limit: 10 },
      cache.homeIndexKey('user-1'),
    );
    expect(await cache.getPage(key)).toMatchObject({ items: [1] });
    await cache.invalidateHome('user-1');
    expect(redis.del).toHaveBeenCalled();
  });

  it('invalidates game and community indexes via Redis sets', async () => {
    const redis = createFakeRedis();
    const cache = new FeedCacheService(redis as never, null);
    const gameKey = cache.gameKey('g1', 'u1', undefined);
    await cache.setPage(
      gameKey,
      { items: [], cursor: { next: null }, hasMore: false, limit: 5 },
      cache.gameIndexKey('g1'),
    );
    await cache.invalidateGame('g1');
    await cache.invalidateCommunity('c1');
    expect(redis.smembers).toHaveBeenCalled();
  });

  it('drops corrupt JSON payloads', async () => {
    const redis = createFakeRedis();
    redis.store.set('bad', '{not-json');
    const cache = new FeedCacheService(redis as never, null);
    expect(await cache.getPage('bad')).toBeNull();
  });

  it('falls back to memory when Redis throws', async () => {
    const redis = createFakeRedis({
      get: vi.fn(async () => {
        throw new Error('redis down');
      }),
      set: vi.fn(async () => {
        throw new Error('redis down');
      }),
    });
    const logger = { event: vi.fn() };
    const cache = new FeedCacheService(redis as never, logger as never);
    const key = cache.homeKey('u', 'for_you', undefined);
    await cache.setPage(key, {
      items: ['x'],
      cursor: { next: null },
      hasMore: false,
      limit: 1,
    });
    expect(await cache.getPage(key)).toMatchObject({ items: ['x'] });
    expect(logger.event).toHaveBeenCalled();
  });

  it('hashes non-empty cursors and treats blank as start', () => {
    const cache = new FeedCacheService(null, null);
    expect(cache.homeKey('u', 'for_you', '   ')).toContain(':start');
    expect(cache.homeKey('u', 'for_you', 'cursor-abc')).not.toContain(':start');
  });

  it('uses memory when Redis status is not ready and drops expired entries', async () => {
    const redis = createFakeRedis({ status: 'end' });
    const cache = new FeedCacheService(redis as never, null);
    const key = 'feed:tmp';
    await cache.setPage(key, {
      items: [1],
      cursor: { next: null },
      hasMore: false,
      limit: 1,
    });
    expect(await cache.getPage(key)).toMatchObject({ items: [1] });
    expect(redis.set).not.toHaveBeenCalled();

    // Force-expire the in-memory entry.
    const internal = (
      cache as unknown as { memory: Map<string, { expiresAt: number; payload: string }> }
    ).memory;
    const entry = internal.get(key);
    if (entry !== undefined) {
      entry.expiresAt = Date.now() - 1;
    }
    expect(await cache.getPage(key)).toBeNull();
  });

  it('deletes indexed members when invalidating a populated Redis set', async () => {
    const redis = createFakeRedis();
    const cache = new FeedCacheService(redis as never, null);
    const index = cache.gameIndexKey('g1');
    const pageKey = cache.gameKey('g1', 'u1', undefined);
    await cache.setPage(
      pageKey,
      { items: [], cursor: { next: null }, hasMore: false, limit: 1 },
      index,
    );
    await cache.invalidateGame('g1');
    expect(redis.del).toHaveBeenCalledWith(pageKey, index);
  });

  it('logs when index and invalidate paths throw', async () => {
    const redis = createFakeRedis({
      sadd: vi.fn(async () => {
        throw new Error('sadd fail');
      }),
      smembers: vi.fn(async () => {
        throw new Error('smembers fail');
      }),
      del: vi.fn(async () => {
        throw new Error('del fail');
      }),
    });
    const logger = { event: vi.fn() };
    const cache = new FeedCacheService(redis as never, logger as never);
    await cache.setPage(
      'k',
      { items: [], cursor: { next: null }, hasMore: false, limit: 1 },
      'idx',
    );
    await cache.invalidateHome('u1');
    expect(logger.event).toHaveBeenCalled();
  });
});
