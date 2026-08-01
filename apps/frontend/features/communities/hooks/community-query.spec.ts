import type { CommunityResponse } from '@gmrlog/types';
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '../../../src/query/query-client';
import { optimisticJoin, optimisticLeave } from './community-model';

function community(partial: Partial<CommunityResponse> = {}): CommunityResponse {
  return {
    id: 'c1',
    name: 'Culture Room',
    description: null,
    avatarUrl: null,
    bannerUrl: null,
    viewerMembership: null,
    counts: { members: 1 },
    ...partial,
  };
}

describe('community query architecture', () => {
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('uses independent community keys', () => {
    expect(queryKeys.communities.list()).toEqual(['communities', 'list']);
    expect(queryKeys.communities.detail('c1')).toEqual(['communities', 'detail', 'c1']);
    expect(queryKeys.communities.members('c1')).toEqual(['communities', 'members', 'c1']);
  });

  it('optimistically joins then rolls back on failure', () => {
    const key = queryKeys.communities.detail('c1');
    const previous = community();
    client.setQueryData(key, previous);
    client.setQueryData(key, optimisticJoin(previous));
    expect(client.getQueryData<CommunityResponse>(key)?.viewerMembership?.role).toBe('member');
    expect(client.getQueryData<CommunityResponse>(key)?.counts.members).toBe(2);
    client.setQueryData(key, previous);
    expect(client.getQueryData<CommunityResponse>(key)?.viewerMembership).toBeNull();
    expect(client.getQueryData<CommunityResponse>(key)?.counts.members).toBe(1);
  });

  it('optimistically leaves then rolls back on failure', () => {
    const key = queryKeys.communities.detail('c1');
    const previous = community({
      viewerMembership: { role: 'member', joinedAt: '2026-01-01T00:00:00.000Z' },
      counts: { members: 4 },
    });
    client.setQueryData(key, previous);
    client.setQueryData(key, optimisticLeave(previous));
    expect(client.getQueryData<CommunityResponse>(key)?.viewerMembership).toBeNull();
    expect(client.getQueryData<CommunityResponse>(key)?.counts.members).toBe(3);
    client.setQueryData(key, previous);
    expect(client.getQueryData<CommunityResponse>(key)?.counts.members).toBe(4);
  });

  it('optimistically patches community name with rollback', () => {
    const key = queryKeys.communities.detail('c1');
    const previous = community({ name: 'Old' });
    client.setQueryData(key, previous);
    client.setQueryData(key, { ...previous, name: 'New' });
    expect(client.getQueryData<CommunityResponse>(key)?.name).toBe('New');
    client.setQueryData(key, previous);
    expect(client.getQueryData<CommunityResponse>(key)?.name).toBe('Old');
  });

  it('optimistically removes deleted community from list', () => {
    const listKey = queryKeys.communities.list();
    const list = [community({ id: 'c1' }), community({ id: 'c2', name: 'Other' })];
    client.setQueryData(listKey, list);
    client.setQueryData(
      listKey,
      list.filter((item) => item.id !== 'c1'),
    );
    expect(client.getQueryData<CommunityResponse[]>(listKey)?.map((c) => c.id)).toEqual(['c2']);
  });

  it('invalidates only affected community queries after join', async () => {
    const spy = vi.spyOn(client, 'invalidateQueries');
    await client.invalidateQueries({ queryKey: queryKeys.communities.detail('c1') });
    await client.invalidateQueries({ queryKey: queryKeys.communities.members('c1') });
    await client.invalidateQueries({ queryKey: queryKeys.communities.list() });
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.communities.detail('c1') });
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.communities.members('c1') });
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.communities.list() });
  });
});
