import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import { FollowsService } from './follows.service';
import {
  createFakeFollowRepository,
  makeFollow,
  makeUser,
  type FakeFollowRepository,
} from './testing/fake-repositories';
import {
  createFakeUserRepository,
  type FakeUserRepository,
} from '../users/testing/fake-repositories';
import {
  createFakeBlockRepository,
  type FakeBlockRepository,
} from '../blocks/testing/fake-repositories';

let follows: FakeFollowRepository;
let blocks: FakeBlockRepository;
let users: FakeUserRepository;
let service: FollowsService;

beforeEach(() => {
  users = createFakeUserRepository([
    makeUser({ id: 'user-1', handle: 'gamer', displayName: 'Gamer' }),
    makeUser({ id: 'user-2', handle: 'other', displayName: 'Other' }),
    makeUser({ id: 'user-3', handle: 'third', displayName: 'Third' }),
  ]);
  follows = createFakeFollowRepository();
  blocks = createFakeBlockRepository();
  service = new FollowsService(follows, users, blocks);
});

describe('FollowsService.followUser', () => {
  it('creates a directed follow edge', async () => {
    const created = await service.followUser('user-1', { userId: 'user-2' });
    expect(created).toMatchObject({
      follower: { id: 'user-1', handle: 'gamer' },
      followee: { id: 'user-2', handle: 'other' },
      createdAt: expect.any(String),
    });
    expect(follows.rows.size).toBe(1);
  });

  it('rejects self-follow', async () => {
    await expect(service.followUser('user-1', { userId: 'user-1' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects duplicate follow with 409', async () => {
    await service.followUser('user-1', { userId: 'user-2' });
    await expect(service.followUser('user-1', { userId: 'user-2' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects unknown followee with 404', async () => {
    await expect(service.followUser('user-1', { userId: 'missing' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // Bug 9. Blocking someone did nothing to stop them following you back.
  describe('Bug 9 — blocks stop a follow in both directions', () => {
    it('stops the blocked user from following the person who blocked them', async () => {
      await blocks.create({
        blocker: { connect: { id: 'user-1' } },
        blocked: { connect: { id: 'user-2' } },
      });

      await expect(service.followUser('user-2', { userId: 'user-1' })).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(follows.rows.size).toBe(0);
    });

    it('stops the blocker from following the user they blocked', async () => {
      await blocks.create({
        blocker: { connect: { id: 'user-1' } },
        blocked: { connect: { id: 'user-2' } },
      });

      await expect(service.followUser('user-1', { userId: 'user-2' })).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(follows.rows.size).toBe(0);
    });

    it('leaves unrelated pairs alone', async () => {
      await blocks.create({
        blocker: { connect: { id: 'user-1' } },
        blocked: { connect: { id: 'user-2' } },
      });

      await expect(service.followUser('user-3', { userId: 'user-1' })).resolves.toBeDefined();
      expect(follows.rows.size).toBe(1);
    });
  });
});

describe('FollowsService.unfollowUser', () => {
  it('hard-deletes the relationship', async () => {
    await service.followUser('user-1', { userId: 'user-2' });
    await service.unfollowUser('user-1', 'user-2');
    expect(follows.rows.size).toBe(0);
  });

  it('returns 404 when the relationship is missing', async () => {
    await expect(service.unfollowUser('user-1', 'user-2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('FollowsService lists', () => {
  it('lists followers and following oldest-first', async () => {
    follows.rows.set(
      'f-old',
      makeFollow({
        id: 'f-old',
        followerId: 'user-2',
        followeeId: 'user-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    );
    follows.rows.set(
      'f-new',
      makeFollow({
        id: 'f-new',
        followerId: 'user-3',
        followeeId: 'user-1',
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
      }),
    );
    follows.rows.set(
      'out-old',
      makeFollow({
        id: 'out-old',
        followerId: 'user-1',
        followeeId: 'user-2',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    );
    follows.rows.set(
      'out-new',
      makeFollow({
        id: 'out-new',
        followerId: 'user-1',
        followeeId: 'user-3',
        createdAt: new Date('2026-01-03T00:00:00.000Z'),
      }),
    );

    const followers = await service.listFollowers('user-1');
    expect(followers.map((u) => u.id)).toEqual(['user-2', 'user-3']);

    const following = await service.listFollowing('user-1');
    expect(following.map((u) => u.id)).toEqual(['user-2', 'user-3']);
  });

  it('rejects unknown subject user', async () => {
    await expect(service.listFollowers('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
