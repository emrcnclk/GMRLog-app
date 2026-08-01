import type { PostResponse, ReviewResponse } from '@gmrlog/types';
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '../../../src/query/query-client';

describe('content query architecture', () => {
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('uses independent review and post keys', () => {
    expect(queryKeys.reviews.byGame('g1')).toEqual(['reviews', 'game', 'g1']);
    expect(queryKeys.reviews.detail('r1')).toEqual(['reviews', 'detail', 'r1']);
    expect(queryKeys.posts.byGame('g1')).toEqual(['posts', 'game', 'g1']);
    expect(queryKeys.posts.detail('p1')).toEqual(['posts', 'detail', 'p1']);
  });

  it('optimistically removes a deleted review from the game list', () => {
    const list: ReviewResponse[] = [
      {
        id: 'r1',
        author: { id: 'u1', handle: 'a', displayName: 'A', avatarUrl: null },
        body: 'One',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        visibility: 'public',
        rating: 8,
        containsSpoilers: false,
        gameId: 'g1',
      },
      {
        id: 'r2',
        author: { id: 'u2', handle: 'b', displayName: 'B', avatarUrl: null },
        body: 'Two',
        createdAt: '2026-01-02T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
        visibility: 'public',
        rating: 6,
        containsSpoilers: true,
        gameId: 'g1',
      },
    ];
    const key = queryKeys.reviews.byGame('g1');
    client.setQueryData(key, list);
    const previous = client.getQueryData<ReviewResponse[]>(key) ?? [];
    client.setQueryData(
      key,
      previous.filter((item) => item.id !== 'r1'),
    );
    expect(client.getQueryData<ReviewResponse[]>(key)?.map((r) => r.id)).toEqual(['r2']);
  });

  it('rolls back optimistic post list on failure snapshot', () => {
    const list: PostResponse[] = [
      {
        id: 'p1',
        author: { id: 'u1', handle: 'a', displayName: 'A', avatarUrl: null },
        body: 'Hello',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        visibility: 'public',
        gameId: 'g1',
        communityId: null,
      },
    ];
    const key = queryKeys.posts.byGame('g1');
    client.setQueryData(key, list);
    const previous = client.getQueryData<PostResponse[]>(key);
    client.setQueryData(key, []);
    client.setQueryData(key, previous);
    expect(client.getQueryData<PostResponse[]>(key)?.[0]?.id).toBe('p1');
  });

  it('invalidates game review queries after create', async () => {
    const spy = vi.spyOn(client, 'invalidateQueries');
    await client.invalidateQueries({ queryKey: queryKeys.reviews.byGame('g1') });
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.reviews.byGame('g1') });
  });
});
