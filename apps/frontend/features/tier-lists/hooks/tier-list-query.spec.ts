import type { TierListResponse } from '@gmrlog/types';
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '../../../src/query/query-client';

describe('tier list query architecture', () => {
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('uses independent tier list keys', () => {
    expect(queryKeys.tierLists.list()).toEqual(['tierLists', 'list']);
    expect(queryKeys.tierLists.detail('t1')).toEqual(['tierLists', 'detail', 't1']);
  });

  it('optimistically replaces slots then rolls back', () => {
    const key = queryKeys.tierLists.detail('t1');
    const previous: TierListResponse = {
      id: 't1',
      title: 'Ranks',
      owner: { id: 'u1', handle: 'p', displayName: 'P', avatarUrl: null },
      visibility: 'public',
      slots: [{ label: 'S', position: 0, games: [{ gameId: 'g1', position: 0 }] }],
      updatedAt: '2026-07-27T12:00:00.000Z',
    };
    client.setQueryData(key, previous);
    client.setQueryData(key, {
      ...previous,
      slots: [
        {
          label: 'S',
          position: 0,
          games: [
            { gameId: 'g2', position: 0 },
            { gameId: 'g1', position: 1 },
          ],
        },
      ],
    });
    expect(
      client.getQueryData<TierListResponse>(key)?.slots[0]?.games.map((g) => g.gameId),
    ).toEqual(['g2', 'g1']);
    client.setQueryData(key, previous);
    expect(
      client.getQueryData<TierListResponse>(key)?.slots[0]?.games.map((g) => g.gameId),
    ).toEqual(['g1']);
  });

  it('invalidates only tier list queries after save', async () => {
    const spy = vi.spyOn(client, 'invalidateQueries');
    await client.invalidateQueries({ queryKey: queryKeys.tierLists.list() });
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.tierLists.list() });
  });
});
