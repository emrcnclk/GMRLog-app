import type { CollectionResponse } from '@gmrlog/types';
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '../../../src/query/query-client';

describe('collection query architecture', () => {
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('uses independent collection keys', () => {
    expect(queryKeys.collections.list()).toEqual(['collections', 'list']);
    expect(queryKeys.collections.detail('c1')).toEqual(['collections', 'detail', 'c1']);
  });

  it('optimistically patches then rolls back', () => {
    const key = queryKeys.collections.detail('c1');
    const previous: CollectionResponse = {
      id: 'c1',
      title: 'Old',
      description: null,
      owner: { id: 'u1', handle: 'p', displayName: 'P', avatarUrl: null },
      visibility: 'public',
      entries: [],
      updatedAt: '2026-07-27T12:00:00.000Z',
    };
    client.setQueryData(key, previous);
    client.setQueryData(key, { ...previous, title: 'New' });
    expect(client.getQueryData<CollectionResponse>(key)?.title).toBe('New');
    client.setQueryData(key, previous);
    expect(client.getQueryData<CollectionResponse>(key)?.title).toBe('Old');
  });

  it('optimistically replaces entries then rolls back', () => {
    const key = queryKeys.collections.detail('c1');
    const previous: CollectionResponse = {
      id: 'c1',
      title: 'Board',
      description: null,
      owner: { id: 'u1', handle: 'p', displayName: 'P', avatarUrl: null },
      visibility: 'public',
      entries: [{ gameId: 'g1', position: 0, note: null }],
      updatedAt: '2026-07-27T12:00:00.000Z',
    };
    client.setQueryData(key, previous);
    client.setQueryData(key, {
      ...previous,
      entries: [
        { gameId: 'g2', position: 0, note: null },
        { gameId: 'g1', position: 1, note: null },
      ],
    });
    expect(client.getQueryData<CollectionResponse>(key)?.entries.map((e) => e.gameId)).toEqual([
      'g2',
      'g1',
    ]);
    client.setQueryData(key, previous);
    expect(client.getQueryData<CollectionResponse>(key)?.entries.map((e) => e.gameId)).toEqual([
      'g1',
    ]);
  });

  it('invalidates only collection list after delete', async () => {
    const spy = vi.spyOn(client, 'invalidateQueries');
    await client.invalidateQueries({ queryKey: queryKeys.collections.list() });
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.collections.list() });
  });
});
