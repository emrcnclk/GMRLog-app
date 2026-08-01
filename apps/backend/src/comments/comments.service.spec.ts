import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
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

import { CommentsService } from './comments.service';
import {
  createFakeCommentRepository,
  createFakePostRepository,
  createFakeReviewRepository,
  createFakeUserRepository,
  makePost,
  makeReview,
  makeUser,
  type FakeCommentRepository,
  type FakePostRepository,
  type FakeReviewRepository,
  type FakeUserRepository,
} from './testing/fake-repositories';

let comments: FakeCommentRepository;
let users: FakeUserRepository;
let posts: FakePostRepository;
let reviews: FakeReviewRepository;
let collections: FakeCollectionRepository;
let tierLists: FakeTierListRepository;
let notifications: FakeNotificationRepository;
let feedFanout: ReturnType<typeof createFakeFeedFanoutPublisher>;
let service: CommentsService;

beforeEach(() => {
  users = createFakeUserRepository([
    makeUser({ id: 'user-1', handle: 'gamer' }),
    makeUser({ id: 'user-2', handle: 'other' }),
  ]);
  posts = createFakePostRepository([makePost({ id: 'post-1', authorId: 'user-1' })]);
  reviews = createFakeReviewRepository([makeReview({ id: 'review-1', authorId: 'user-1' })]);
  collections = createFakeCollectionRepository([
    makeCollection({ id: 'collection-1', ownerId: 'user-1' }),
  ]);
  tierLists = createFakeTierListRepository([makeTierList({ id: 'tier-1', ownerId: 'user-1' })]);
  comments = createFakeCommentRepository();
  notifications = createFakeNotificationRepository();
  feedFanout = createFakeFeedFanoutPublisher();
  service = new CommentsService(
    comments,
    users,
    posts,
    reviews,
    collections,
    tierLists,
    notifications,
    asFeedFanoutPublisher(feedFanout),
  );
});

describe('CommentsService.createComment', () => {
  it('creates a root comment on a review host', async () => {
    const created = await service.createComment('user-1', {
      hostType: 'review',
      hostId: 'review-1',
      body: 'Solid review',
    });
    expect(created).toMatchObject({
      hostType: 'review',
      hostId: 'review-1',
      body: 'Solid review',
      parentCommentId: null,
      author: { id: 'user-1', handle: 'gamer' },
    });
  });

  it('creates a comment on a collection host and notifies the owner', async () => {
    const created = await service.createComment('user-2', {
      hostType: 'collection',
      hostId: 'collection-1',
      body: 'Nice list',
    });
    expect(created).toMatchObject({
      hostType: 'collection',
      hostId: 'collection-1',
      body: 'Nice list',
    });
    expect([...notifications.rows.values()]).toEqual([
      expect.objectContaining({
        recipientId: 'user-1',
        kind: 'comment',
        objectType: 'comment',
        objectId: created.id,
      }),
    ]);
    expect(feedFanout.calls).toEqual([
      expect.objectContaining({
        kind: 'comment',
        objectId: created.id,
        objectType: 'comment',
        actorId: 'user-2',
      }),
    ]);
  });

  it('creates a reply under the same host and notifies with reply kind', async () => {
    const root = await service.createComment('user-1', {
      hostType: 'review',
      hostId: 'review-1',
      body: 'Root',
    });
    notifications.rows.clear();
    feedFanout.calls.length = 0;

    const reply = await service.createComment('user-2', {
      hostType: 'review',
      hostId: 'review-1',
      body: 'Reply',
      parentCommentId: root.id,
    });
    expect(reply.parentCommentId).toBe(root.id);
    expect(await comments.listReplies(root.id)).toHaveLength(1);
    expect([...notifications.rows.values()]).toEqual([
      expect.objectContaining({ kind: 'reply', recipientId: 'user-1' }),
    ]);
  });

  it('rejects replies deeper than depth 2', async () => {
    const root = await service.createComment('user-1', {
      hostType: 'review',
      hostId: 'review-1',
      body: 'Root',
    });
    const depth1 = await service.createComment('user-2', {
      hostType: 'review',
      hostId: 'review-1',
      body: 'Depth 1',
      parentCommentId: root.id,
    });
    const depth2 = await service.createComment('user-1', {
      hostType: 'review',
      hostId: 'review-1',
      body: 'Depth 2',
      parentCommentId: depth1.id,
    });
    await expect(
      service.createComment('user-2', {
        hostType: 'review',
        hostId: 'review-1',
        body: 'Too deep',
        parentCommentId: depth2.id,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not notify when commenting on own host', async () => {
    await service.createComment('user-1', {
      hostType: 'collection',
      hostId: 'collection-1',
      body: 'Mine',
    });
    expect(notifications.rows.size).toBe(0);
  });

  it('rejects an unknown host', async () => {
    await expect(
      service.createComment('user-1', {
        hostType: 'post',
        hostId: 'missing',
        body: 'Nope',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a parent that belongs to a different host', async () => {
    const root = await service.createComment('user-1', {
      hostType: 'review',
      hostId: 'review-1',
      body: 'Root',
    });
    await expect(
      service.createComment('user-1', {
        hostType: 'post',
        hostId: 'post-1',
        body: 'Cross',
        parentCommentId: root.id,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('CommentsService.updateComment', () => {
  it('edits own body and forbids non-authors', async () => {
    const created = await service.createComment('user-1', {
      hostType: 'post',
      hostId: 'post-1',
      body: 'Original',
    });
    const updated = await service.updateComment(created.id, 'user-1', { body: 'Edited' });
    expect(updated.body).toBe('Edited');
    await expect(
      service.updateComment(created.id, 'user-2', { body: 'Nope' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('CommentsService.listByHost', () => {
  it('returns a flat creation-ordered list including replies and excluding soft-deleted', async () => {
    const root = await service.createComment('user-1', {
      hostType: 'review',
      hostId: 'review-1',
      body: 'Root',
    });
    await service.createComment('user-2', {
      hostType: 'review',
      hostId: 'review-1',
      body: 'Reply',
      parentCommentId: root.id,
    });
    const gone = await service.createComment('user-1', {
      hostType: 'review',
      hostId: 'review-1',
      body: 'Gone',
    });
    await service.deleteComment(gone.id, 'user-1');

    const listed = await service.listByHost('review', 'review-1');
    expect(listed.map((c) => c.body)).toEqual(['Root', 'Reply']);
  });

  it('lists collection and tier_list hosts', async () => {
    await service.createComment('user-2', {
      hostType: 'collection',
      hostId: 'collection-1',
      body: 'On collection',
    });
    await service.createComment('user-2', {
      hostType: 'tier_list',
      hostId: 'tier-1',
      body: 'On tier',
    });
    expect(await service.listByHost('collection', 'collection-1')).toHaveLength(1);
    expect(await service.listByHost('tier_list', 'tier-1')).toHaveLength(1);
  });
});

describe('CommentsService.deleteComment', () => {
  it('soft-deletes as author and forbids non-authors', async () => {
    const created = await service.createComment('user-1', {
      hostType: 'post',
      hostId: 'post-1',
      body: 'Mine',
    });
    await expect(service.deleteComment(created.id, 'user-2')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await service.deleteComment(created.id, 'user-1');
    expect(comments.rows.get(created.id)?.deletedAt).toBeInstanceOf(Date);
    expect(await service.listByHost('post', 'post-1')).toHaveLength(0);
  });

  it('rejects missing comments and deleted authors', async () => {
    await expect(service.deleteComment('missing', 'user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    users.rows.set('user-1', makeUser({ id: 'user-1', handle: 'gamer', deletedAt: new Date() }));
    await expect(
      service.createComment('user-1', {
        hostType: 'post',
        hostId: 'post-1',
        body: 'Ghost',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
