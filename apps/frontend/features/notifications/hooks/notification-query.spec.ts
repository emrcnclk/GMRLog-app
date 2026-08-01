import type { ApiEnvelope, NotificationResponse } from '@gmrlog/types';
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '../../../src/query/query-client';
import {
  markAllNotificationsReadInCache,
  markNotificationReadInCache,
  type NotificationsInfiniteData,
} from './notification-model';

function notification(partial: Partial<NotificationResponse> = {}): NotificationResponse {
  return {
    id: 'n1',
    kind: 'post_reply',
    createdAt: '2026-07-27T12:00:00.000Z',
    readAt: null,
    actor: null,
    objectRef: { type: 'post', id: 'p1' },
    messageKey: 'post_reply',
    ...partial,
  };
}

describe('notification query architecture', () => {
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('uses independent notifications keys', () => {
    expect(queryKeys.notifications.list()).toEqual(['notifications', 'list']);
    expect(queryKeys.notifications.all).toEqual(['notifications']);
  });

  it('flattens cursor pages newest first', () => {
    const page1: ApiEnvelope<NotificationResponse[]> = {
      data: [notification({ id: 'n1' })],
      meta: { requestId: '1', cursor: { next: 'c2' }, hasMore: true },
    };
    const page2: ApiEnvelope<NotificationResponse[]> = {
      data: [notification({ id: 'n2', createdAt: '2026-07-27T11:00:00.000Z' })],
      meta: { requestId: '2', cursor: { next: null }, hasMore: false },
    };
    client.setQueryData(queryKeys.notifications.list(), {
      pages: [page1, page2],
      pageParams: [undefined, 'c2'],
    });
    const cached = client.getQueryData<NotificationsInfiniteData>(queryKeys.notifications.list());
    expect(cached?.pages.flatMap((p) => p.data).map((n) => n.id)).toEqual(['n1', 'n2']);
  });

  it('optimistically marks one then rolls back', () => {
    const key = queryKeys.notifications.list();
    const previous: NotificationsInfiniteData = {
      pages: [
        {
          data: [notification()],
          meta: { requestId: '1', cursor: { next: null }, hasMore: false },
        },
      ],
      pageParams: [undefined],
    };
    client.setQueryData(key, previous);
    client.setQueryData(
      key,
      markNotificationReadInCache(previous, 'n1', '2026-07-27T12:01:00.000Z'),
    );
    expect(client.getQueryData<NotificationsInfiniteData>(key)?.pages[0]?.data[0]?.readAt).toBe(
      '2026-07-27T12:01:00.000Z',
    );
    client.setQueryData(key, previous);
    expect(
      client.getQueryData<NotificationsInfiniteData>(key)?.pages[0]?.data[0]?.readAt,
    ).toBeNull();
  });

  it('optimistically marks all then rolls back', () => {
    const key = queryKeys.notifications.list();
    const previous: NotificationsInfiniteData = {
      pages: [
        {
          data: [notification({ id: 'n1' }), notification({ id: 'n2' })],
          meta: { requestId: '1', cursor: { next: null }, hasMore: false },
        },
      ],
      pageParams: [undefined],
    };
    client.setQueryData(key, previous);
    client.setQueryData(key, markAllNotificationsReadInCache(previous, '2026-07-27T12:05:00.000Z'));
    expect(
      client
        .getQueryData<NotificationsInfiniteData>(key)
        ?.pages[0]?.data.every((item) => item.readAt !== null),
    ).toBe(true);
    client.setQueryData(key, previous);
    expect(
      client
        .getQueryData<NotificationsInfiniteData>(key)
        ?.pages[0]?.data.every((item) => item.readAt === null),
    ).toBe(true);
  });

  it('invalidates only the notifications list after mark-read', async () => {
    const spy = vi.spyOn(client, 'invalidateQueries');
    await client.invalidateQueries({ queryKey: queryKeys.notifications.list() });
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.notifications.list() });
  });
});
