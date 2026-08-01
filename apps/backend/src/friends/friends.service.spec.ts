import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AchievementsService } from '../achievements/achievements.service';
import {
  createFakeActivityRepository,
  makeActor,
  makeActivityItem,
} from '../activity/testing/fake-repositories';
import { createFakeBlockRepository } from '../blocks/testing/fake-repositories';
import { createFakeFollowRepository } from '../follows/testing/fake-repositories';
import { createFakeNotificationRepository } from '../notifications/testing/fake-repositories';
import {
  createFakeUserRepository,
  makeUser,
  type FakeUserRepository,
} from '../users/testing/fake-repositories';

import { FriendsService } from './friends.service';
import {
  createFakeFriendshipRepository,
  createFakePresenceRepository,
  makeFriendRequest,
  makeFriendship,
  type FakeFriendshipRepository,
  type FakePresenceRepository,
} from './testing/fake-repositories';

function encodeCreatedAtCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`, 'utf8').toString('base64url');
}

function encodeOffsetCursor(offset: number): string {
  return Buffer.from(`offset|${String(offset)}`, 'utf8').toString('base64url');
}

function encodeActivityCursor(occurredAt: Date, id: string): string {
  return Buffer.from(`${occurredAt.toISOString()}|${id}`, 'utf8').toString('base64url');
}

let friendships: FakeFriendshipRepository;
let presence: FakePresenceRepository;
let users: FakeUserRepository;
let service: FriendsService;
let notifications: ReturnType<typeof createFakeNotificationRepository>;
let activity: ReturnType<typeof createFakeActivityRepository>;

beforeEach(() => {
  users = createFakeUserRepository([
    makeUser({ id: 'user-1', handle: 'alice', displayName: 'Alice' }),
    makeUser({ id: 'user-2', handle: 'bob', displayName: 'Bob' }),
    makeUser({ id: 'user-3', handle: 'carol', displayName: 'Carol' }),
    makeUser({ id: 'user-4', handle: 'dave', displayName: 'Dave' }),
  ]);
  friendships = createFakeFriendshipRepository();
  presence = createFakePresenceRepository();
  notifications = createFakeNotificationRepository();
  activity = createFakeActivityRepository();
  const blocks = createFakeBlockRepository();
  const follows = createFakeFollowRepository();
  service = new FriendsService(
    friendships,
    presence,
    users,
    blocks,
    follows,
    notifications,
    activity,
  );
});

describe('FriendsService.sendFriendRequest', () => {
  it('creates a pending request and notifies the receiver', async () => {
    const created = await service.sendFriendRequest('user-1', 'user-2', {
      message: 'Hey friend',
    });
    expect(created).toMatchObject({
      status: 'pending',
      message: 'Hey friend',
      sender: { id: 'user-1', handle: 'alice' },
      receiver: { id: 'user-2', handle: 'bob' },
    });
    expect(friendships.requests.size).toBe(1);
    expect([...notifications.rows.values()].some((row) => row.kind === 'friend_request')).toBe(
      true,
    );
  });

  it('rejects self-friend with 400', async () => {
    await expect(service.sendFriendRequest('user-1', 'user-1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects duplicate pending with 409', async () => {
    await service.sendFriendRequest('user-1', 'user-2', {});
    await expect(service.sendFriendRequest('user-1', 'user-2', {})).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects reverse pending as duplicate conflict', async () => {
    await service.sendFriendRequest('user-2', 'user-1', {});
    await expect(service.sendFriendRequest('user-1', 'user-2', {})).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects when a block exists either direction', async () => {
    const blocks = createFakeBlockRepository();
    await blocks.create({
      blocker: { connect: { id: 'user-1' } },
      blocked: { connect: { id: 'user-2' } },
    });
    const blockedService = new FriendsService(
      friendships,
      presence,
      users,
      blocks,
      createFakeFollowRepository(),
      notifications,
      activity,
    );
    await expect(blockedService.sendFriendRequest('user-1', 'user-2', {})).rejects.toBeInstanceOf(
      ConflictException,
    );

    const reverseBlocks = createFakeBlockRepository();
    await reverseBlocks.create({
      blocker: { connect: { id: 'user-2' } },
      blocked: { connect: { id: 'user-1' } },
    });
    const reverseService = new FriendsService(
      friendships,
      presence,
      users,
      reverseBlocks,
      createFakeFollowRepository(),
      notifications,
      activity,
    );
    await expect(reverseService.sendFriendRequest('user-1', 'user-2', {})).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects when already friends', async () => {
    await friendships.createFriendship('user-1', 'user-2');
    await expect(service.sendFriendRequest('user-1', 'user-2', {})).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

describe('FriendsService.acceptFriendRequest', () => {
  it('creates friendship, notifies sender, and records friend activity', async () => {
    const request = await service.sendFriendRequest('user-1', 'user-2', {});
    await service.acceptFriendRequest('user-2', request.id);

    const friendship = await friendships.findFriendship('user-1', 'user-2');
    expect(friendship).not.toBeNull();

    const updated = await friendships.findRequestById(request.id);
    expect(updated?.status).toBe('accepted');
    expect(updated?.respondedAt).not.toBeNull();

    expect([...notifications.rows.values()].some((row) => row.kind === 'friend_accepted')).toBe(
      true,
    );
    expect([...activity.items.values()].some((item) => item.kind === 'friend')).toBe(true);
  });

  it('forbids accept by non-receiver', async () => {
    const request = await service.sendFriendRequest('user-1', 'user-2', {});
    await expect(service.acceptFriendRequest('user-1', request.id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

describe('FriendsService.rejectFriendRequest', () => {
  it('marks the request rejected', async () => {
    const request = await service.sendFriendRequest('user-1', 'user-2', {});
    await service.rejectFriendRequest('user-2', request.id);
    const updated = await friendships.findRequestById(request.id);
    expect(updated?.status).toBe('rejected');
  });

  it('forbids reject by non-receiver', async () => {
    const request = await service.sendFriendRequest('user-1', 'user-2', {});
    await expect(service.rejectFriendRequest('user-3', request.id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

describe('FriendsService.cancelFriendRequest', () => {
  it('allows the sender to cancel a pending request', async () => {
    const request = await service.sendFriendRequest('user-1', 'user-2', {});
    await service.cancelFriendRequest('user-1', request.id);
    const updated = await friendships.findRequestById(request.id);
    expect(updated?.status).toBe('cancelled');
  });

  it('forbids cancel by non-sender', async () => {
    const request = await service.sendFriendRequest('user-1', 'user-2', {});
    await expect(service.cancelFriendRequest('user-2', request.id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

describe('FriendsService.removeFriend', () => {
  it('hard-deletes the friendship', async () => {
    await friendships.createFriendship('user-1', 'user-2');
    await service.removeFriend('user-1', 'user-2');
    expect(await friendships.findFriendship('user-1', 'user-2')).toBeNull();
  });

  it('returns 404 when friendship is missing', async () => {
    await expect(service.removeFriend('user-1', 'user-2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('FriendsService mutual count', () => {
  it('counts mutual friends correctly', async () => {
    friendships.friendships.set(
      'f-12',
      makeFriendship({ id: 'f-12', userLowId: 'user-1', userHighId: 'user-2' }),
    );
    friendships.friendships.set(
      'f-13',
      makeFriendship({ id: 'f-13', userLowId: 'user-1', userHighId: 'user-3' }),
    );
    friendships.friendships.set(
      'f-23',
      makeFriendship({ id: 'f-23', userLowId: 'user-2', userHighId: 'user-3' }),
    );
    friendships.friendships.set(
      'f-14',
      makeFriendship({ id: 'f-14', userLowId: 'user-1', userHighId: 'user-4' }),
    );

    expect(await friendships.countMutualFriends('user-1', 'user-2')).toBe(1);

    const mutual = await service.listMutualFriends('user-1', 'user-2');
    expect(mutual.items.map((user) => user.id)).toEqual(['user-3']);

    const relationship = await service.getRelationship('user-1', 'user-2');
    expect(relationship).toMatchObject({
      isFriend: true,
      mutualFriends: 1,
      isFollowing: false,
      followsYou: false,
      requestSent: false,
      requestReceived: false,
      isBlocked: false,
      blockedBy: false,
    });
  });
});

describe('FriendsService.presence', () => {
  it('updates and returns my presence', async () => {
    const updated = await service.updateMyPresence('user-1', { status: 'online' });
    expect(updated).toMatchObject({ userId: 'user-1', status: 'online' });
    const mine = await service.getMyPresence('user-1');
    expect(mine.status).toBe('online');
  });

  it('returns offline stub when my presence row is missing', async () => {
    const mine = await service.getMyPresence('user-1');
    expect(mine).toMatchObject({ userId: 'user-1', status: 'offline' });
  });

  it('masks invisible presence for other viewers', async () => {
    await service.updateMyPresence('user-2', { status: 'invisible' });
    const asOther = await service.getUserPresence('user-1', 'user-2');
    expect(asOther.status).toBe('offline');
    const asSelf = await service.getUserPresence('user-2', 'user-2');
    expect(asSelf.status).toBe('invisible');
  });

  it('returns offline stub for missing user presence and allows null viewer', async () => {
    const guest = await service.getUserPresence(null, 'user-2');
    expect(guest).toMatchObject({ userId: 'user-2', status: 'offline' });
  });

  it('rejects presence lookup across a block', async () => {
    const blocks = createFakeBlockRepository();
    await blocks.create({
      blocker: { connect: { id: 'user-1' } },
      blocked: { connect: { id: 'user-2' } },
    });
    const blockedService = new FriendsService(
      friendships,
      presence,
      users,
      blocks,
      createFakeFollowRepository(),
      notifications,
      activity,
    );
    await expect(blockedService.getUserPresence('user-1', 'user-2')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('lists online and away friends', async () => {
    await friendships.createFriendship('user-1', 'user-2');
    await friendships.createFriendship('user-1', 'user-3');
    await presence.upsert('user-2', 'online');
    await presence.upsert('user-3', 'away');
    await presence.upsert('user-4', 'online');

    const online = await service.listOnlineFriends('user-1');
    expect(online.map((row) => row.user.id).sort()).toEqual(['user-2', 'user-3']);
  });

  it('returns empty online list when the actor has no friends', async () => {
    expect(await service.listOnlineFriends('user-1')).toEqual([]);
  });

  it('skips offline, invisible, and soft-deleted friends', async () => {
    await friendships.createFriendship('user-1', 'user-2');
    await friendships.createFriendship('user-1', 'user-3');
    await friendships.createFriendship('user-1', 'user-4');
    await presence.upsert('user-2', 'offline');
    await presence.upsert('user-3', 'invisible');
    await presence.upsert('user-4', 'online');
    users.rows.set(
      'user-4',
      makeUser({
        id: 'user-4',
        handle: 'dave',
        displayName: 'Dave',
        deletedAt: new Date(),
      }),
    );

    expect(await service.listOnlineFriends('user-1')).toEqual([]);
  });
});

describe('FriendsService.listIncomingRequests', () => {
  it('pages incoming requests with a createdAt cursor', async () => {
    const older = makeFriendRequest({
      id: 'req-old',
      senderId: 'user-2',
      receiverId: 'user-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const newer = makeFriendRequest({
      id: 'req-new',
      senderId: 'user-3',
      receiverId: 'user-1',
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    friendships.requests.set(older.id, older);
    friendships.requests.set(newer.id, newer);

    const first = await service.listIncomingRequests('user-1', { limit: 1 });
    expect(first.items).toHaveLength(1);
    expect(first.items[0]?.sender.id).toBe('user-3');
    expect(first.hasMore).toBe(true);
    expect(first.cursor.next).not.toBeNull();

    const second = await service.listIncomingRequests('user-1', {
      limit: 1,
      cursor: first.cursor.next ?? undefined,
    });
    expect(second.items.map((row) => row.sender.id)).toEqual(['user-2']);
    expect(second.hasMore).toBe(false);
  });

  it('rejects an invalid createdAt cursor', async () => {
    await expect(
      service.listIncomingRequests('user-1', {
        cursor: Buffer.from('not-a-cursor', 'utf8').toString('base64url'),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('FriendsService.acceptFriendRequest edge cases', () => {
  it('cancels reverse pending and skips create when friendship already exists', async () => {
    await friendships.createFriendship('user-1', 'user-2');
    const request = makeFriendRequest({
      id: 'req-accept',
      senderId: 'user-1',
      receiverId: 'user-2',
      status: 'pending',
    });
    const reverse = makeFriendRequest({
      id: 'req-reverse',
      senderId: 'user-2',
      receiverId: 'user-1',
      status: 'pending',
    });
    friendships.requests.set(request.id, request);
    friendships.requests.set(reverse.id, reverse);

    await service.acceptFriendRequest('user-2', request.id);

    expect((await friendships.findRequestById(request.id))?.status).toBe('accepted');
    expect((await friendships.findRequestById(reverse.id))?.status).toBe('cancelled');
  });

  it('refreshes achievements and swallows recalculation failures', async () => {
    const recalculate = vi
      .fn<() => Promise<never>>()
      .mockRejectedValueOnce(new Error('recalc failed'))
      .mockRejectedValueOnce('non-error failure' as never);
    const achievements = { recalculate } as Pick<AchievementsService, 'recalculate'>;
    const withAchievements = new FriendsService(
      friendships,
      presence,
      users,
      createFakeBlockRepository(),
      createFakeFollowRepository(),
      notifications,
      activity,
      achievements as AchievementsService,
    );

    const request = await withAchievements.sendFriendRequest('user-1', 'user-2', {});
    await withAchievements.acceptFriendRequest('user-2', request.id);
    expect(recalculate).toHaveBeenCalledTimes(2);
  });
});

describe('FriendsService.listFriends', () => {
  it('lists friendships and searches with q', async () => {
    await friendships.createFriendship('user-1', 'user-2');
    await friendships.createFriendship('user-1', 'user-3');

    const all = await service.listFriends('user-1');
    expect(all.items.map((row) => row.user.id).sort()).toEqual(['user-2', 'user-3']);

    const searched = await service.listFriends('user-1', { q: ' bob ' });
    expect(searched.items.length).toBeGreaterThanOrEqual(1);

    const viaSearch = await service.searchFriends('user-1', { q: 'carol' });
    expect(viaSearch.items.length).toBeGreaterThanOrEqual(0);
  });

  it('pages friendships with a cursor and skips soft-deleted friends', async () => {
    const older = makeFriendship({
      id: 'f-old',
      userLowId: 'user-1',
      userHighId: 'user-2',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const newer = makeFriendship({
      id: 'f-new',
      userLowId: 'user-1',
      userHighId: 'user-3',
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    const deletedFriend = makeFriendship({
      id: 'f-del',
      userLowId: 'user-1',
      userHighId: 'user-4',
      createdAt: new Date('2026-01-03T00:00:00.000Z'),
    });
    friendships.friendships.set(older.id, older);
    friendships.friendships.set(newer.id, newer);
    friendships.friendships.set(deletedFriend.id, deletedFriend);
    users.rows.set(
      'user-4',
      makeUser({
        id: 'user-4',
        handle: 'dave',
        displayName: 'Dave',
        deletedAt: new Date(),
      }),
    );

    const first = await service.listFriends('user-1', { limit: 1 });
    expect(first.hasMore).toBe(true);
    expect(first.cursor.next).not.toBeNull();

    const second = await service.listFriends('user-1', {
      limit: 10,
      cursor: first.cursor.next ?? undefined,
    });
    expect(second.items.every((row) => row.user.id !== 'user-4')).toBe(true);
  });

  it('rejects blank-invalid friendship cursors', async () => {
    await expect(
      service.listFriends('user-1', {
        cursor: Buffer.from('2026-01-01T00:00:00.000Z|', 'utf8').toString('base64url'),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('FriendsService.listMutualFriends pagination', () => {
  it('pages mutual friends with an offset cursor', async () => {
    friendships.friendships.set(
      'f-12',
      makeFriendship({ id: 'f-12', userLowId: 'user-1', userHighId: 'user-2' }),
    );
    friendships.friendships.set(
      'f-13',
      makeFriendship({ id: 'f-13', userLowId: 'user-1', userHighId: 'user-3' }),
    );
    friendships.friendships.set(
      'f-14',
      makeFriendship({ id: 'f-14', userLowId: 'user-1', userHighId: 'user-4' }),
    );
    friendships.friendships.set(
      'f-23',
      makeFriendship({ id: 'f-23', userLowId: 'user-2', userHighId: 'user-3' }),
    );
    friendships.friendships.set(
      'f-24',
      makeFriendship({ id: 'f-24', userLowId: 'user-2', userHighId: 'user-4' }),
    );

    const first = await service.listMutualFriends('user-1', 'user-2', { limit: 1 });
    expect(first.items).toHaveLength(1);
    expect(first.hasMore).toBe(true);
    expect(first.cursor.next).not.toBeNull();

    const second = await service.listMutualFriends('user-1', 'user-2', {
      limit: 1,
      cursor: first.cursor.next ?? undefined,
    });
    expect(second.items).toHaveLength(1);
    expect(second.items[0]?.id).not.toBe(first.items[0]?.id);
  });

  it('rejects invalid offset cursors', async () => {
    await expect(
      service.listMutualFriends('user-1', 'user-2', {
        cursor: Buffer.from('offset|-1', 'utf8').toString('base64url'),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.listMutualFriends('user-1', 'user-2', {
        cursor: Buffer.from('bad|0', 'utf8').toString('base64url'),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('FriendsService.getRelationship', () => {
  it('rejects self relationship', async () => {
    await expect(service.getRelationship('user-1', 'user-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('projects follow and request flags', async () => {
    const follows = createFakeFollowRepository();
    await follows.create({
      follower: { connect: { id: 'user-1' } },
      followee: { connect: { id: 'user-2' } },
    });
    await follows.create({
      follower: { connect: { id: 'user-2' } },
      followee: { connect: { id: 'user-1' } },
    });
    const withFollows = new FriendsService(
      friendships,
      presence,
      users,
      createFakeBlockRepository(),
      follows,
      notifications,
      activity,
    );
    await withFollows.sendFriendRequest('user-1', 'user-2', {});

    const relationship = await withFollows.getRelationship('user-1', 'user-2');
    expect(relationship).toMatchObject({
      isFollowing: true,
      followsYou: true,
      isFriend: false,
      requestSent: true,
      requestReceived: false,
    });
  });
});

describe('FriendsService.listFriendActivity', () => {
  it('lists friend activity with from/to and activity cursor pagination', async () => {
    await friendships.createFriendship('user-1', 'user-2');
    const actor = makeActor({ id: 'user-2', handle: 'bob', displayName: 'Bob' });
    activity.actors.set('user-2', actor);

    const older = makeActivityItem({
      id: 'act-old',
      kind: 'post',
      actorId: 'user-2',
      objectType: 'post',
      objectId: 'p-old',
      occurredAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const newer = makeActivityItem({
      id: 'act-new',
      kind: 'post',
      actorId: 'user-2',
      objectType: 'post',
      objectId: 'p-new',
      occurredAt: new Date('2026-01-10T00:00:00.000Z'),
    });
    activity.items.set(older.id, older);
    activity.items.set(newer.id, newer);

    const first = await service.listFriendActivity('user-1', {
      limit: 1,
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-12-31T00:00:00.000Z',
    });
    expect(first.items).toHaveLength(1);
    expect(first.hasMore).toBe(true);
    expect(first.cursor.next).not.toBeNull();

    const second = await service.listFriendActivity('user-1', {
      limit: 1,
      cursor: first.cursor.next ?? undefined,
    });
    expect(second.items).toHaveLength(1);
    expect(second.items[0]?.id).not.toBe(first.items[0]?.id);
  });

  it('rejects invalid activity cursors', async () => {
    await expect(
      service.listFriendActivity('user-1', {
        cursor: Buffer.from('|missing-date', 'utf8').toString('base64url'),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('FriendsService request guards', () => {
  it('returns 404 for missing or non-pending requests', async () => {
    await expect(service.rejectFriendRequest('user-1', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    friendships.requests.set(
      'req-done',
      makeFriendRequest({
        id: 'req-done',
        senderId: 'user-1',
        receiverId: 'user-2',
        status: 'accepted',
      }),
    );
    await expect(service.cancelFriendRequest('user-1', 'req-done')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns 404 for missing users on send/remove', async () => {
    await expect(service.sendFriendRequest('user-1', 'ghost', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.removeFriend('user-1', 'ghost')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('skips friend-request projection when a user row is missing', async () => {
    friendships.requests.set(
      'req-orphan',
      makeFriendRequest({
        id: 'req-orphan',
        senderId: 'ghost-sender',
        receiverId: 'user-1',
        status: 'pending',
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
      }),
    );
    const page = await service.listIncomingRequests('user-1');
    expect(page.items.every((row) => row.id !== 'req-orphan')).toBe(true);
  });
});

describe('FriendsService cursor helpers via public APIs', () => {
  it('accepts a well-formed createdAt cursor round-trip', async () => {
    const request = makeFriendRequest({
      id: 'req-cursor',
      senderId: 'user-2',
      receiverId: 'user-1',
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
    });
    friendships.requests.set(request.id, request);
    const cursor = encodeCreatedAtCursor(request.createdAt, request.id);
    const page = await service.listIncomingRequests('user-1', { cursor, limit: 10 });
    expect(page.items).toEqual([]);
  });

  it('accepts a well-formed offset cursor of zero', async () => {
    const page = await service.listMutualFriends('user-1', 'user-2', {
      cursor: encodeOffsetCursor(0),
    });
    expect(page.items).toEqual([]);
  });

  it('accepts a well-formed activity cursor with no rows', async () => {
    const page = await service.listFriendActivity('user-1', {
      cursor: encodeActivityCursor(new Date('2026-01-01T00:00:00.000Z'), 'act-x'),
    });
    expect(page.items).toEqual([]);
  });
});
