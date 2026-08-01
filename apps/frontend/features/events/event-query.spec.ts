import type { ApiEnvelope, EventResponse } from '@gmrlog/types';
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '../../src/query/query-client';
import { optimisticJoin, optimisticLeave, patchEventInDiscoverPages } from './hooks/event-model';

function event(partial: Partial<EventResponse> = {}): EventResponse {
  return {
    id: 'e1',
    title: 'Season Finale',
    kind: 'game',
    startsAt: '2026-07-28T18:00:00.000Z',
    endsAt: null,
    viewerParticipation: null,
    ...partial,
  };
}

describe('event participation optimistic query', () => {
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('uses independent event detail key', () => {
    expect(queryKeys.events.detail('e1')).toEqual(['events', 'detail', 'e1']);
    expect(queryKeys.discover.events()).toEqual(['discover', 'events']);
  });

  it('optimistically joins then rolls back on failure', () => {
    const detailKey = queryKeys.events.detail('e1');
    const listKey = queryKeys.discover.events();
    const previous = event();
    const list = {
      pages: [{ data: [previous], meta: { nextCursor: null } }] as ApiEnvelope<EventResponse[]>[],
      pageParams: [undefined],
    };
    client.setQueryData(detailKey, previous);
    client.setQueryData(listKey, list);

    const next = optimisticJoin(previous);
    client.setQueryData(detailKey, next);
    client.setQueryData(listKey, {
      ...list,
      pages: patchEventInDiscoverPages(list.pages, next) ?? list.pages,
    });

    expect(client.getQueryData<EventResponse>(detailKey)?.viewerParticipation?.state).toBe('going');
    expect(
      client.getQueryData<{ pages: ApiEnvelope<EventResponse[]>[] }>(listKey)?.pages[0]?.data[0]
        ?.viewerParticipation?.state,
    ).toBe('going');

    client.setQueryData(detailKey, previous);
    client.setQueryData(listKey, list);
    expect(client.getQueryData<EventResponse>(detailKey)?.viewerParticipation).toBeNull();
  });

  it('optimistically leaves with list patch', () => {
    const detailKey = queryKeys.events.detail('e1');
    const previous = event({
      viewerParticipation: { state: 'going', createdAt: '2026-07-01T00:00:00.000Z' },
    });
    client.setQueryData(detailKey, previous);
    client.setQueryData(detailKey, optimisticLeave(previous));
    expect(client.getQueryData<EventResponse>(detailKey)?.viewerParticipation).toBeNull();
  });

  it('invalidates only event detail and discover events after participation', async () => {
    const spy = vi.spyOn(client, 'invalidateQueries');
    await client.invalidateQueries({ queryKey: queryKeys.events.detail('e1') });
    await client.invalidateQueries({ queryKey: queryKeys.discover.events() });
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.events.detail('e1') });
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.discover.events() });
    expect(spy).not.toHaveBeenCalledWith({ queryKey: queryKeys.me });
  });
});
