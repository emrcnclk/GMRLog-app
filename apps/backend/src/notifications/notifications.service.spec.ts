import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import { NotificationsService } from './notifications.service';
import {
  createFakeNotificationRepository,
  makeNotification,
  type FakeNotificationRepository,
} from './testing/fake-repositories';

let notifications: FakeNotificationRepository;
let service: NotificationsService;

beforeEach(() => {
  notifications = createFakeNotificationRepository();
  service = new NotificationsService(notifications);
});

describe('NotificationsService.listNotifications', () => {
  it('lists newest first and paginates with opaque cursors', async () => {
    const older = makeNotification({
      id: 'n-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const newer = makeNotification({
      id: 'n-2',
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    const newest = makeNotification({
      id: 'n-3',
      createdAt: new Date('2026-01-03T00:00:00.000Z'),
    });
    notifications.rows.set(older.id, older);
    notifications.rows.set(newer.id, newer);
    notifications.rows.set(newest.id, newest);

    const page1 = await service.listNotifications('user-1', { limit: 2 });
    expect(page1.items.map((n) => n.id)).toEqual(['n-3', 'n-2']);
    expect(page1.hasMore).toBe(true);
    expect(page1.cursor.next).toEqual(expect.any(String));

    const page2 = await service.listNotifications('user-1', {
      limit: 2,
      cursor: page1.cursor.next!,
    });
    expect(page2.items.map((n) => n.id)).toEqual(['n-1']);
    expect(page2.hasMore).toBe(false);
    expect(page2.cursor.next).toBeNull();
  });

  it('rejects an invalid cursor', async () => {
    await expect(
      service.listNotifications('user-1', { cursor: 'not-a-cursor' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('NotificationsService.markRead', () => {
  it('marks selected ids and preserves already-read timestamps', async () => {
    const unread = makeNotification({ id: 'n-unread', readAt: null });
    const priorReadAt = new Date('2026-01-01T12:00:00.000Z');
    const already = makeNotification({ id: 'n-read', readAt: priorReadAt });
    notifications.rows.set(unread.id, unread);
    notifications.rows.set(already.id, already);

    await service.markRead('user-1', { ids: ['n-unread', 'n-read'] });

    expect(notifications.rows.get('n-unread')?.readAt).toBeInstanceOf(Date);
    expect(notifications.rows.get('n-read')?.readAt?.toISOString()).toBe(priorReadAt.toISOString());
  });

  it('marks all unread for the recipient', async () => {
    notifications.rows.set('a', makeNotification({ id: 'a', recipientId: 'user-1', readAt: null }));
    notifications.rows.set('b', makeNotification({ id: 'b', recipientId: 'user-1', readAt: null }));
    notifications.rows.set(
      'other',
      makeNotification({ id: 'other', recipientId: 'user-2', readAt: null }),
    );

    await service.markRead('user-1', { all: true });

    expect(notifications.rows.get('a')?.readAt).toBeInstanceOf(Date);
    expect(notifications.rows.get('b')?.readAt).toBeInstanceOf(Date);
    expect(notifications.rows.get('other')?.readAt).toBeNull();
  });

  it('hides foreign or missing ids as not found', async () => {
    notifications.rows.set('foreign', makeNotification({ id: 'foreign', recipientId: 'user-2' }));
    await expect(service.markRead('user-1', { ids: ['foreign'] })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.markRead('user-1', { ids: ['missing'] })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
