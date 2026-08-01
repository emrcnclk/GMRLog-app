import { beforeEach, describe, expect, it } from 'vitest';

import {
  createFakeUserRepository,
  makeUser,
  type FakeUserRepository,
} from '../posts/testing/fake-repositories';

import { extractMentionHandles, notifyMentions } from './notify-mentions';
import {
  createFakeNotificationRepository,
  type FakeNotificationRepository,
} from './testing/fake-repositories';

describe('extractMentionHandles', () => {
  it('extracts unique handles case-insensitively', () => {
    expect(extractMentionHandles('hi @Alice and @alice again @bob_1')).toEqual(['Alice', 'bob_1']);
  });

  it('ignores email-like and empty bodies', () => {
    expect(extractMentionHandles('mail@example.com no mention')).toEqual([]);
    expect(extractMentionHandles('')).toEqual([]);
  });
});

describe('notifyMentions', () => {
  let users: FakeUserRepository;
  let notifications: FakeNotificationRepository;

  beforeEach(() => {
    users = createFakeUserRepository([
      makeUser({ id: 'actor-1', handle: 'actor' }),
      makeUser({ id: 'user-bob', handle: 'bob' }),
      makeUser({ id: 'user-gone', handle: 'gone', deletedAt: new Date() }),
    ]);
    users.findByHandle = (handle: string) => {
      const found = [...users.rows.values()].find(
        (u) => u.handle.toLowerCase() === handle.toLowerCase(),
      );
      return Promise.resolve(found ?? null);
    };
    notifications = createFakeNotificationRepository();
  });

  it('creates mention notifications for known handles', async () => {
    await notifyMentions({
      body: 'Hey @bob check this',
      actorId: 'actor-1',
      objectType: 'post',
      objectId: 'post-1',
      users,
      notifications,
    });
    expect(notifications.rows.size).toBe(1);
    const row = [...notifications.rows.values()][0];
    expect(row).toMatchObject({
      recipientId: 'user-bob',
      kind: 'mention',
      objectType: 'post',
      objectId: 'post-1',
    });
  });

  it('skips self, unknown, deleted, and duplicates', async () => {
    await notifyMentions({
      body: '@actor @nobody @gone @bob @bob',
      actorId: 'actor-1',
      objectType: 'comment',
      objectId: 'c-1',
      users,
      notifications,
    });
    expect(notifications.rows.size).toBe(1);
    expect([...notifications.rows.values()][0]?.recipientId).toBe('user-bob');
  });

  it('no-ops when body has no mentions', async () => {
    await notifyMentions({
      body: 'plain text',
      actorId: 'actor-1',
      objectType: 'post',
      objectId: 'post-1',
      users,
      notifications,
    });
    expect(notifications.rows.size).toBe(0);
  });
});
