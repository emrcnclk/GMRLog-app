import type { ApiEnvelope, CollectionResponse, LibraryEntryResponse } from '@gmrlog/types';
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getNextPageParam,
  invalidateProfileQueries,
  queryKeys,
} from '../../../src/query/query-client';

describe('profile query architecture', () => {
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('uses independent cache keys', () => {
    expect(queryKeys.me).toEqual(['me']);
    expect(queryKeys.library.hub()).toEqual(['library', 'hub']);
    expect(queryKeys.library.entries()).toEqual(['library', 'entries']);
    expect(queryKeys.reviews.list()).toEqual(['reviews', 'list']);
    expect(queryKeys.collections.list()).toEqual(['collections', 'list']);
    expect(queryKeys.tierLists.list()).toEqual(['tierLists', 'list']);
  });

  it('paginates activity cursor for overview (existing endpoint)', () => {
    expect(getNextPageParam({ cursor: { next: 'c2' }, hasMore: true })).toBe('c2');
    expect(getNextPageParam({ hasMore: false, cursor: { next: 'c2' } })).toBeUndefined();
  });

  it('preserves library entry order in cache', () => {
    const entries: LibraryEntryResponse[] = [
      {
        gameId: 'g1',
        game: { id: 'g1', title: 'First', slug: 'first', coverUrl: null },
        status: 'playing',
        source: 'manual',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
      {
        gameId: 'g2',
        game: { id: 'g2', title: 'Second', slug: 'second', coverUrl: null },
        status: 'playing',
        source: 'manual',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    client.setQueryData(queryKeys.library.entries(), entries);
    expect(
      client
        .getQueryData<LibraryEntryResponse[]>(queryKeys.library.entries())
        ?.map((e) => e.gameId),
    ).toEqual(['g1', 'g2']);
  });

  it('preserves collections array order (non-cursor index)', () => {
    const page: ApiEnvelope<CollectionResponse[]> = {
      data: [
        {
          id: 'c1',
          title: 'One',
          description: null,
          owner: { id: 'u1', handle: 'p', displayName: 'P', avatarUrl: null },
          visibility: 'public',
          entries: [{ gameId: 'g1', position: 0, note: null }],
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'c2',
          title: 'Two',
          description: null,
          owner: { id: 'u1', handle: 'p', displayName: 'P', avatarUrl: null },
          visibility: 'private',
          entries: [],
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      meta: { requestId: '1' },
    };
    client.setQueryData(queryKeys.collections.list(), page.data);
    expect(
      client.getQueryData<CollectionResponse[]>(queryKeys.collections.list())?.map((c) => c.id),
    ).toEqual(['c1', 'c2']);
  });

  it('invalidates all profile-related queries on refresh', async () => {
    const spy = vi.spyOn(client, 'invalidateQueries');
    await invalidateProfileQueries(client);
    expect(spy).toHaveBeenCalled();
    const keys = spy.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual(
      expect.arrayContaining([
        queryKeys.me,
        queryKeys.library.all,
        queryKeys.reviews.all,
        queryKeys.collections.all,
        queryKeys.tierLists.all,
        queryKeys.activity.all,
      ]),
    );
  });
});
