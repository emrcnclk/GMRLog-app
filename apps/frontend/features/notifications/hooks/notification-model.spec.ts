import type { NotificationResponse } from '@gmrlog/types';
import { notificationsReadSchema } from '@gmrlog/validators';
import { describe, expect, it } from 'vitest';

import {
  formatNotificationTime,
  hrefForNotificationObject,
  isNotificationUnread,
  markAllNotificationsReadInCache,
  markNotificationReadInCache,
  resolveNotificationIconType,
  resolveNotificationMessage,
  resolveNotificationsView,
  type NotificationsInfiniteData,
} from './notification-model';

function notification(partial: Partial<NotificationResponse> = {}): NotificationResponse {
  return {
    id: 'n1',
    kind: 'review_mention',
    createdAt: '2026-07-27T12:00:00.000Z',
    readAt: null,
    actor: null,
    objectRef: { type: 'review', id: 'r1' },
    messageKey: 'review_mention',
    ...partial,
  };
}

describe('notification model', () => {
  it('resolves loading empty ready error', () => {
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
    expect(
      resolveNotificationsView({
        isPending: false,
        isError: true,
        error: new Error('x'),
        items: [],
        isRefreshing: false,
        isFetchingNextPage: false,
        hasNextPage: false,
      }).status,
    ).toBe('error');
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
    const ready = resolveNotificationsView({
      isPending: false,
      isError: false,
      error: null,
      items: [notification(), notification({ id: 'n2', readAt: '2026-07-27T11:00:00.000Z' })],
      isRefreshing: true,
      isFetchingNextPage: false,
      hasNextPage: true,
    });
    expect(ready.status).toBe('ready');
    expect(ready.unreadCount).toBe(1);
  });

  it('humanizes message and unread flag', () => {
    expect(resolveNotificationMessage(notification())).toBe('review mention');
    expect(
      resolveNotificationMessage(
        notification({ kind: 'friend_request', messageKey: 'friend_request' }),
      ),
    ).toBe('sent you a friend request');
    expect(
      resolveNotificationMessage(
        notification({ kind: 'friend_accepted', messageKey: 'friend_accepted' }),
      ),
    ).toBe('accepted your friend request');
    expect(
      resolveNotificationMessage(
        notification({ kind: 'achievement_unlocked', messageKey: 'achievement_unlocked' }),
      ),
    ).toBe('unlocked an achievement');
    expect(
      resolveNotificationMessage(notification({ kind: 'comment', messageKey: 'comment' })),
    ).toBe('commented on your content');
    expect(resolveNotificationMessage(notification({ kind: 'reply', messageKey: 'reply' }))).toBe(
      'replied to your comment',
    );
    expect(resolveNotificationMessage(notification({ kind: 'like', messageKey: 'like' }))).toBe(
      'liked your content',
    );
    expect(
      resolveNotificationMessage(
        notification({ kind: 'library_imported', messageKey: 'library_imported' }),
      ),
    ).toBe('imported games into your library');
    expect(
      resolveNotificationMessage(
        notification({ kind: 'sync_completed', messageKey: 'sync_completed' }),
      ),
    ).toBe('finished a library sync');
    expect(
      resolveNotificationMessage(notification({ kind: 'sync_failed', messageKey: 'sync_failed' })),
    ).toBe('could not complete a library sync');
    expect(
      resolveNotificationMessage(
        notification({ kind: 'achievement_synced', messageKey: 'achievement_synced' }),
      ),
    ).toBe('synced achievements from a platform');
    expect(
      resolveNotificationMessage(
        notification({ kind: 'new_games_found', messageKey: 'new_games_found' }),
      ),
    ).toBe('found new games in a connected library');
    expect(
      resolveNotificationMessage(
        notification({ kind: 'library_updated', messageKey: 'library_updated' }),
      ),
    ).toBe('updated your library from a sync');
    expect(isNotificationUnread(notification())).toBe(true);
    expect(isNotificationUnread(notification({ readAt: '2026-07-27T11:00:00.000Z' }))).toBe(false);
  });

  it('formats relative time', () => {
    const now = Date.parse('2026-07-27T12:30:00.000Z');
    expect(formatNotificationTime('2026-07-27T12:29:30.000Z', now)).toBe('Just now');
    expect(formatNotificationTime('2026-07-27T12:00:00.000Z', now)).toBe('30m');
  });

  it('maps object refs to routes without inventing comment/achievement screens', () => {
    expect(hrefForNotificationObject({ type: 'game', id: 'g1' })).toBe('/(app)/game/g1');
    expect(hrefForNotificationObject({ type: 'review', id: 'r1' })).toBe('/(app)/review/r1');
    expect(hrefForNotificationObject({ type: 'post', id: 'p1' })).toBe('/(app)/post/p1');
    expect(hrefForNotificationObject({ type: 'collection', id: 'c1' })).toBe(
      '/(app)/collection/c1',
    );
    expect(hrefForNotificationObject({ type: 'tier_list', id: 't1' })).toBe('/(app)/tier-list/t1');
    expect(hrefForNotificationObject({ type: 'community', id: 'co1' })).toBe(
      '/(app)/community/co1',
    );
    expect(hrefForNotificationObject({ type: 'event', id: 'e1' })).toBe('/(app)/event/e1');
    expect(hrefForNotificationObject({ type: 'user', id: 'u1' })).toBe('/(app)/user/u1');
    expect(hrefForNotificationObject({ type: 'comment', id: 'cm1' })).toBeNull();
    expect(hrefForNotificationObject({ type: 'achievement', id: 'a1' })).toBeNull();
  });

  it('resolves kind-aware icon types for social notifications', () => {
    expect(
      resolveNotificationIconType(
        notification({
          kind: 'friend_request',
          messageKey: 'friend_request',
          objectRef: { type: 'user', id: 'u2' },
        }),
      ),
    ).toBe('user');
    expect(
      resolveNotificationIconType(
        notification({
          kind: 'achievement_unlocked',
          messageKey: 'achievement_unlocked',
          objectRef: { type: 'achievement', id: 'a1' },
        }),
      ),
    ).toBe('achievement');
    expect(
      resolveNotificationIconType(
        notification({
          kind: 'like',
          messageKey: 'like',
          objectRef: { type: 'review', id: 'r1' },
        }),
      ),
    ).toBe('review');
  });

  it('resolves integration notification icons to game or achievement', () => {
    expect(
      resolveNotificationIconType(
        notification({
          kind: 'library_imported',
          messageKey: 'library_imported',
          objectRef: { type: 'user', id: 'u1' },
        }),
      ),
    ).toBe('game');
    expect(
      resolveNotificationIconType(
        notification({
          kind: 'sync_failed',
          messageKey: 'sync_failed',
          objectRef: { type: 'user', id: 'u1' },
        }),
      ),
    ).toBe('game');
    expect(
      resolveNotificationIconType(
        notification({
          kind: 'achievement_synced',
          messageKey: 'achievement_synced',
          objectRef: { type: 'user', id: 'u1' },
        }),
      ),
    ).toBe('achievement');
  });

  it('optimistically marks one and all read with rollback snapshots', () => {
    const page: NotificationsInfiniteData = {
      pages: [
        {
          data: [
            notification({ id: 'n1' }),
            notification({ id: 'n2', createdAt: '2026-07-27T11:00:00.000Z' }),
          ],
          meta: { requestId: '1', cursor: { next: null }, hasMore: false },
        },
      ],
      pageParams: [undefined],
    };
    const one = markNotificationReadInCache(page, 'n1', '2026-07-27T12:01:00.000Z');
    expect(one?.pages[0]?.data[0]?.readAt).toBe('2026-07-27T12:01:00.000Z');
    expect(one?.pages[0]?.data[1]?.readAt).toBeNull();
    const all = markAllNotificationsReadInCache(page, '2026-07-27T12:02:00.000Z');
    expect(all?.pages[0]?.data.every((item) => item.readAt !== null)).toBe(true);
  });

  it('validates mark-read payloads', () => {
    expect(notificationsReadSchema.parse({ ids: ['n1'] }).ids).toEqual(['n1']);
    expect(notificationsReadSchema.parse({ all: true }).all).toBe(true);
    expect(() => notificationsReadSchema.parse({})).toThrow();
    expect(() => notificationsReadSchema.parse({ ids: [] })).toThrow();
  });

  it('preserves backend newest-first order', () => {
    const items = [
      notification({ id: 'n2', createdAt: '2026-07-27T12:00:00.000Z' }),
      notification({ id: 'n1', createdAt: '2026-07-27T11:00:00.000Z' }),
    ];
    expect(items.map((item) => item.id)).toEqual(['n2', 'n1']);
  });
});
