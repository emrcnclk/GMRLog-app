import type { ApiEnvelope, GameCardResponse } from '@gmrlog/types';
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getNextPageParam, queryKeys } from '../../../src/query/query-client';

describe('discover query architecture', () => {
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('uses stable discover keys', () => {
    expect(queryKeys.discover.hub()).toEqual(['discover', 'hub']);
    expect(queryKeys.discover.games()).toEqual(['discover', 'games', 'all']);
    expect(queryKeys.discover.games('rpg')).toEqual(['discover', 'games', 'rpg']);
    expect(queryKeys.discover.communities()).toEqual(['discover', 'communities']);
    expect(queryKeys.discover.events()).toEqual(['discover', 'events']);
    expect(queryKeys.discover.trending()).toEqual(['discover', 'trending', '7d']);
    expect(queryKeys.discover.trending('24h')).toEqual(['discover', 'trending', '24h']);
    expect(queryKeys.discover.popular()).toEqual(['discover', 'popular']);
    expect(queryKeys.discover.hiddenGems()).toEqual(['discover', 'hidden-gems']);
    expect(queryKeys.discover.recommended()).toEqual(['discover', 'recommended']);
    expect(queryKeys.discover.collections()).toEqual(['discover', 'collections']);
    expect(queryKeys.discover.similarGames('g1')).toEqual(['discover', 'similar-games', 'g1']);
    expect(queryKeys.discover.similarUsers('u1')).toEqual(['discover', 'similar-users', 'u1']);
  });

  it('paginates games with cursor meta', () => {
    expect(getNextPageParam({ cursor: { next: 'c2' }, hasMore: true })).toBe('c2');
    expect(getNextPageParam({ hasMore: false, cursor: { next: 'c2' } })).toBeUndefined();
  });

  it('flattens games pages without duplicate ids', () => {
    const page1: ApiEnvelope<GameCardResponse[]> = {
      data: [
        {
          id: 'g1',
          slug: 'game-1',
          title: 'Game One',
          coverImageUrl: null,
          releaseDate: null,
          genres: [],
          platforms: [],
          ratingSummary: { average: null, count: 0 },
          libraryCount: 0,
        },
      ],
      meta: { requestId: '1', cursor: { next: 'c2' }, hasMore: true },
    };
    const page2: ApiEnvelope<GameCardResponse[]> = {
      data: [
        {
          id: 'g2',
          slug: 'game-2',
          title: 'Game Two',
          coverImageUrl: null,
          releaseDate: null,
          genres: [],
          platforms: [],
          ratingSummary: { average: 4.2, count: 10 },
          libraryCount: 3,
        },
      ],
      meta: { requestId: '2', cursor: { next: null }, hasMore: false },
    };

    client.setQueryData(queryKeys.discover.games(), {
      pages: [page1, page2],
      pageParams: [undefined, 'c2'],
    });

    const cached = client.getQueryData<{ pages: ApiEnvelope<GameCardResponse[]>[] }>(
      queryKeys.discover.games(),
    );
    const flat = cached?.pages.flatMap((p) => p.data) ?? [];
    expect(flat.map((g) => g.id)).toEqual(['g1', 'g2']);
  });

  it('invalidates a single discover list key', async () => {
    const spy = vi.spyOn(client, 'invalidateQueries');
    await client.invalidateQueries({ queryKey: queryKeys.discover.games() });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
