import { describe, expect, it } from 'vitest';

import { resolveNotificationsView } from './hooks/notification-model';

describe('notifications screen states', () => {
  it('loading uses skeleton contract', () => {
    expect(
      resolveNotificationsView({
        isPending: true,
        isError: false,
        error: null,
        items: [],
        isRefreshing: false,
        isFetchingNextPage: false,
        hasNextPage: false,
      }).status,
    ).toBe('loading');
  });

  it('empty desk', () => {
    expect(
      resolveNotificationsView({
        isPending: false,
        isError: false,
        error: null,
        items: [],
        isRefreshing: false,
        isFetchingNextPage: false,
        hasNextPage: false,
      }).status,
    ).toBe('empty');
  });

  it('ready list with refresh', () => {
    const view = resolveNotificationsView({
      isPending: false,
      isError: false,
      error: null,
      items: [
        {
          id: 'n1',
          kind: 'k',
          createdAt: '2026-07-27T12:00:00.000Z',
          readAt: null,
          actor: null,
          objectRef: { type: 'game', id: 'g1' },
          messageKey: 'k',
        },
      ],
      isRefreshing: true,
      isFetchingNextPage: false,
      hasNextPage: false,
    });
    expect(view.status).toBe('ready');
    expect(view.isRefreshing).toBe(true);
    expect(view.unreadCount).toBe(1);
  });
});
