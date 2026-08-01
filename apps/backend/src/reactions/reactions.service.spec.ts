import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  createFakeCollectionRepository,
  makeCollection,
  type FakeCollectionRepository,
} from '../collections/testing/fake-repositories';
import {
  asFeedFanoutPublisher,
  createFakeFeedFanoutPublisher,
} from '../infrastructure/jobs/testing/fake-feed-fanout.publisher';
import {
  createFakeNotificationRepository,
  type FakeNotificationRepository,
} from '../notifications/testing/fake-repositories';
import {
  createFakeTierListRepository,
  makeTierList,
  type FakeTierListRepository,
} from '../tierlists/testing/fake-repositories';

import { ReactionsService } from './reactions.service';
import {
  createFakeCommentRepository,
  createFakePostRepository,
  createFakeReactionRepository,
  createFakeReviewRepository,
  createFakeUserRepository,
  makeComment,
  makePost,
  makeReview,
  makeUser,
  type FakeCommentRepository,
  type FakePostRepository,
  type FakeReactionRepository,
  type FakeReviewRepository,
  type FakeUserRepository,
} from './testing/fake-repositories';

let reactions: FakeReactionRepository;
let users: FakeUserRepository;
let posts: FakePostRepository;
let reviews: FakeReviewRepository;
let comments: FakeCommentRepository;
let collections: FakeCollectionRepository;
let tierLists: FakeTierListRepository;
let notifications: FakeNotificationRepository;
let feedFanout: ReturnType<typeof createFakeFeedFanoutPublisher>;
let service: ReactionsService;

beforeEach(() => {
  users = createFakeUserRepository([
    makeUser({ id: 'user-1', handle: 'gamer' }),
    makeUser({ id: 'user-2', handle: 'other' }),
  ]);
  posts = createFakePostRepository([makePost({ id: 'post-1', authorId: 'user-1' })]);
  reviews = createFakeReviewRepository([makeReview({ id: 'review-1', authorId: 'user-1' })]);
  comments = createFakeCommentRepository([makeComment({ id: 'comment-1', authorId: 'user-1' })]);
  collections = createFakeCollectionRepository([
    makeCollection({ id: 'collection-1', ownerId: 'user-1' }),
  ]);
  tierLists = createFakeTierListRepository([makeTierList({ id: 'tier-1', ownerId: 'user-1' })]);
  reactions = createFakeReactionRepository();
  notifications = createFakeNotificationRepository();
  feedFanout = createFakeFeedFanoutPublisher();
  service = new ReactionsService(
    reactions,
    users,
    posts,
    reviews,
    comments,
    collections,
    tierLists,
    notifications,
    asFeedFanoutPublisher(feedFanout),
  );
});

describe('ReactionsService.createReaction', () => {
  it('creates a reaction on a review target', async () => {
    const created = await service.createReaction('user-1', {
      targetType: 'review',
      targetId: 'review-1',
      kind: 'like',
    });
    expect(created).toMatchObject({
      targetType: 'review',
      targetId: 'review-1',
      kind: 'like',
      actor: { id: 'user-1', handle: 'gamer' },
    });
  });

  it('creates reactions on post and comment targets', async () => {
    await expect(
      service.createReaction('user-1', {
        targetType: 'post',
        targetId: 'post-1',
        kind: 'fire',
      }),
    ).resolves.toMatchObject({ targetType: 'post', kind: 'fire' });

    await expect(
      service.createReaction('user-1', {
        targetType: 'comment',
        targetId: 'comment-1',
        kind: 'like',
      }),
    ).resolves.toMatchObject({ targetType: 'comment', kind: 'like' });
  });

  it('creates a reaction on a tier list target', async () => {
    await expect(
      service.createReaction('user-2', {
        targetType: 'tier_list',
        targetId: 'tier-1',
        kind: 'like',
      }),
    ).resolves.toMatchObject({ targetType: 'tier_list', targetId: 'tier-1', kind: 'like' });
  });

  it('rejects a missing tier list target', async () => {
    await expect(
      service.createReaction('user-1', {
        targetType: 'tier_list',
        targetId: 'missing',
        kind: 'like',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('likes a collection and notifies the owner with activity fan-out', async () => {
    const created = await service.createReaction('user-2', {
      targetType: 'collection',
      targetId: 'collection-1',
      kind: 'like',
    });
    expect(created).toMatchObject({
      targetType: 'collection',
      targetId: 'collection-1',
      kind: 'like',
    });
    expect([...notifications.rows.values()]).toEqual([
      expect.objectContaining({
        recipientId: 'user-1',
        kind: 'like',
        objectType: 'collection',
        objectId: 'collection-1',
      }),
    ]);
    expect(feedFanout.calls).toEqual([
      expect.objectContaining({
        kind: 'like',
        objectId: 'collection-1',
        objectType: 'collection',
        actorId: 'user-2',
      }),
    ]);
  });

  it('does not notify when liking own target', async () => {
    await service.createReaction('user-1', {
      targetType: 'collection',
      targetId: 'collection-1',
      kind: 'like',
    });
    expect(notifications.rows.size).toBe(0);
    expect(feedFanout.calls).toHaveLength(1);
  });

  it('does not emit like side effects for non-like kinds', async () => {
    await service.createReaction('user-2', {
      targetType: 'collection',
      targetId: 'collection-1',
      kind: 'fire',
    });
    expect(notifications.rows.size).toBe(0);
    expect(feedFanout.calls).toHaveLength(0);
  });

  it('rejects an unknown or soft-deleted target', async () => {
    await expect(
      service.createReaction('user-1', {
        targetType: 'review',
        targetId: 'missing',
        kind: 'like',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    reviews.rows.set('gone', makeReview({ id: 'gone', deletedAt: new Date() }));
    await expect(
      service.createReaction('user-1', {
        targetType: 'review',
        targetId: 'gone',
        kind: 'like',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a duplicate actor/target/kind with conflict', async () => {
    await service.createReaction('user-1', {
      targetType: 'review',
      targetId: 'review-1',
      kind: 'like',
    });
    await expect(
      service.createReaction('user-1', {
        targetType: 'review',
        targetId: 'review-1',
        kind: 'like',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('allows a different kind on the same target (change = delete + create)', async () => {
    const first = await service.createReaction('user-1', {
      targetType: 'review',
      targetId: 'review-1',
      kind: 'like',
    });
    await service.deleteReaction(first.id, 'user-1');
    const second = await service.createReaction('user-1', {
      targetType: 'review',
      targetId: 'review-1',
      kind: 'fire',
    });
    expect(second.kind).toBe('fire');
    expect(await reactions.findById(first.id)).toBeNull();
  });
});

describe('ReactionsService.deleteReaction', () => {
  it('hard-deletes an owned reaction', async () => {
    const created = await service.createReaction('user-1', {
      targetType: 'post',
      targetId: 'post-1',
      kind: 'like',
    });
    await service.deleteReaction(created.id, 'user-1');
    expect(await reactions.findById(created.id)).toBeNull();
  });

  it('forbids non-owner delete', async () => {
    const created = await service.createReaction('user-1', {
      targetType: 'post',
      targetId: 'post-1',
      kind: 'like',
    });
    await expect(service.deleteReaction(created.id, 'user-2')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects missing reaction', async () => {
    await expect(service.deleteReaction('missing', 'user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
