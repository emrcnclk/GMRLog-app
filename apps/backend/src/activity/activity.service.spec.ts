import type {
  CollectionRepository,
  CommentRepository,
  CommunityMemberRepository,
  CommunityRepository,
  ReviewRepository,
  TierListRepository,
  UserRepository,
} from '@gmrlog/database';
import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeFollowRepository, makeFollow } from '../follows/testing/fake-repositories';
import { createFakePostRepository, makePost } from '../posts/testing/fake-repositories';
import {
  createFakeCollectionRepository,
  makeCollection,
} from '../collections/testing/fake-repositories';
import {
  createFakeCommunityMemberRepository,
  createFakeCommunityRepository,
  makeCommunity,
  makeCommunityMember,
} from '../communities/testing/fake-repositories';
import { createFakeCommentRepository, makeComment } from '../comments/testing/fake-repositories';
import { createFakeReviewRepository, makeReview } from '../reviews/testing/fake-repositories';
import { createFakeTierListRepository, makeTierList } from '../tierlists/testing/fake-repositories';
import { createFakeUserRepository, makeUser } from '../users/testing/fake-repositories';

import { ActivityService } from './activity.service';
import {
  createFakeActivityRepository,
  makeActivityItem,
  makeActor,
  type FakeActivityRepository,
} from './testing/fake-repositories';

const viewerId = 'user-1';

let activityRepo: FakeActivityRepository;
let postsRepo: ReturnType<typeof createFakePostRepository>;
let followsRepo: ReturnType<typeof createFakeFollowRepository>;
let service: ActivityService;

function buildService(): ActivityService {
  const emptyReviewRepo = { findById: () => Promise.resolve(null) } as unknown as ReviewRepository;
  const emptyCollectionRepo = {
    findById: () => Promise.resolve(null),
  } as unknown as CollectionRepository;
  const emptyTierListRepo = {
    findById: () => Promise.resolve(null),
  } as unknown as TierListRepository;
  const emptyCommentRepo = {
    findById: () => Promise.resolve(null),
  } as unknown as CommentRepository;
  const emptyUserRepo = { findById: () => Promise.resolve(null) } as unknown as UserRepository;
  const emptyCommunityRepo = {
    findById: () => Promise.resolve(null),
  } as unknown as CommunityRepository;
  const emptyMemberRepo = {
    findByCommunityAndUser: () => Promise.resolve(null),
    listByCommunity: () => Promise.resolve([]),
  } as unknown as CommunityMemberRepository;

  return new ActivityService(
    activityRepo,
    postsRepo,
    emptyReviewRepo,
    emptyCollectionRepo,
    emptyTierListRepo,
    emptyCommentRepo,
    emptyUserRepo,
    emptyCommunityRepo,
    emptyMemberRepo,
    followsRepo,
    null,
    null,
    null,
    null,
    null,
  );
}

beforeEach(() => {
  activityRepo = createFakeActivityRepository();
  postsRepo = createFakePostRepository();
  followsRepo = createFakeFollowRepository();
  service = buildService();
});

describe('ActivityService.listActivity', () => {
  it('lists newest first and paginates with opaque cursors', async () => {
    const older = makeActivityItem({
      id: 'a-1',
      objectId: 'post-old',
      occurredAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const newer = makeActivityItem({
      id: 'a-2',
      objectId: 'post-new',
      occurredAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    postsRepo.rows.set(
      'post-old',
      makePost({ id: 'post-old', authorId: viewerId, visibility: 'public' }),
    );
    postsRepo.rows.set(
      'post-new',
      makePost({ id: 'post-new', authorId: viewerId, visibility: 'public' }),
    );
    activityRepo.items.set(older.id, older);
    activityRepo.feedUserIds.set(older.id, viewerId);
    activityRepo.feedEntryIds.set(older.id, 'feed-1');
    activityRepo.items.set(newer.id, newer);
    activityRepo.feedUserIds.set(newer.id, viewerId);
    activityRepo.feedEntryIds.set(newer.id, 'feed-2');

    const page1 = await service.listActivity(viewerId, { limit: 1 });
    expect(page1.items.map((row) => row.id)).toEqual(['a-2']);
    expect(page1.hasMore).toBe(true);
    expect(page1.cursor.next).toEqual(expect.any(String));

    const page2 = await service.listActivity(viewerId, {
      limit: 1,
      cursor: page1.cursor.next!,
    });
    expect(page2.items.map((row) => row.id)).toEqual(['a-1']);
    expect(page2.hasMore).toBe(false);
  });

  it('returns an empty feed when nothing exists', async () => {
    const page = await service.listActivity(viewerId);
    expect(page.items).toEqual([]);
    expect(page.hasMore).toBe(false);
    expect(page.cursor.next).toBeNull();
  });

  it('rejects an invalid cursor', async () => {
    await expect(service.listActivity(viewerId, { cursor: 'bad' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('hides private posts the viewer cannot read', async () => {
    const publicItem = makeActivityItem({
      id: 'public',
      objectId: 'post-public',
      occurredAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    const privateItem = makeActivityItem({
      id: 'private',
      objectId: 'post-private',
      occurredAt: new Date('2026-01-03T00:00:00.000Z'),
    });
    postsRepo.rows.set(
      'post-public',
      makePost({ id: 'post-public', authorId: viewerId, visibility: 'public' }),
    );
    postsRepo.rows.set(
      'post-private',
      makePost({ id: 'post-private', authorId: 'other-user', visibility: 'private' }),
    );
    activityRepo.items.set(publicItem.id, publicItem);
    activityRepo.feedUserIds.set(publicItem.id, viewerId);
    activityRepo.feedEntryIds.set(publicItem.id, 'feed-public');
    activityRepo.items.set(privateItem.id, privateItem);
    activityRepo.feedUserIds.set(privateItem.id, viewerId);
    activityRepo.feedEntryIds.set(privateItem.id, 'feed-private');

    const page = await service.listActivity(viewerId);
    expect(page.items.map((row) => row.id)).toEqual(['public']);
  });

  it('projects actor and S1 dialect fields', async () => {
    const actor = makeActor({ id: 'actor-1', handle: 'actor', displayName: 'Actor' });
    const item = makeActivityItem({
      id: 'a-actor',
      actorId: 'actor-1',
      objectId: 'post-1',
      kind: 'post',
    });
    postsRepo.rows.set('post-1', makePost({ id: 'post-1', authorId: viewerId }));
    activityRepo.items.set(item.id, item);
    activityRepo.feedUserIds.set(item.id, viewerId);
    activityRepo.feedEntryIds.set(item.id, 'feed-actor');
    activityRepo.actors.set(actor.id, actor);

    const page = await service.listActivity(viewerId);
    expect(page.items[0]).toMatchObject({
      id: 'a-actor',
      kind: 'post',
      readAt: null,
      actor: { id: 'actor-1', handle: 'actor', displayName: 'Actor' },
      objectRef: { type: 'post', id: 'post-1' },
      messageKey: 'post',
    });
  });
});

describe('ActivityService.listHomeFeed', () => {
  it('projects feed entry ids and S1 FeedItemResponse fields', async () => {
    const actor = makeActor({ id: 'actor-1', handle: 'actor', displayName: 'Actor' });
    const item = makeActivityItem({
      id: 'a-feed',
      actorId: 'actor-1',
      objectId: 'post-1',
      kind: 'post',
    });
    postsRepo.rows.set('post-1', makePost({ id: 'post-1', authorId: viewerId }));
    activityRepo.items.set(item.id, item);
    activityRepo.feedUserIds.set(item.id, viewerId);
    activityRepo.feedEntryIds.set(item.id, 'feed-row-1');
    activityRepo.actors.set(actor.id, actor);

    const page = await service.listHomeFeed(viewerId);
    expect(page.items[0]).toMatchObject({
      id: 'feed-row-1',
      kind: 'post',
      projection: null,
      actor: { id: 'actor-1', handle: 'actor', displayName: 'Actor' },
      object: { type: 'post', id: 'post-1' },
    });
    expect(page.items[0]?.occurredAt).toEqual(expect.any(String));
  });

  it('returns an empty feed when nothing exists', async () => {
    const page = await service.listHomeFeed(viewerId);
    expect(page.items).toEqual([]);
    expect(page.hasMore).toBe(false);
  });

  it('paginates home feed rows newest first', async () => {
    postsRepo.rows.set(
      'post-old',
      makePost({ id: 'post-old', authorId: viewerId, visibility: 'public' }),
    );
    postsRepo.rows.set(
      'post-new',
      makePost({ id: 'post-new', authorId: viewerId, visibility: 'public' }),
    );
    const older = makeActivityItem({
      id: 'home-old',
      objectId: 'post-old',
      occurredAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const newer = makeActivityItem({
      id: 'home-new',
      objectId: 'post-new',
      occurredAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    activityRepo.items.set(older.id, older);
    activityRepo.feedUserIds.set(older.id, viewerId);
    activityRepo.feedEntryIds.set(older.id, 'feed-old');
    activityRepo.items.set(newer.id, newer);
    activityRepo.feedUserIds.set(newer.id, viewerId);
    activityRepo.feedEntryIds.set(newer.id, 'feed-new');

    const page1 = await service.listHomeFeed(viewerId, { limit: 1 });
    expect(page1.items[0]?.object.id).toBe('post-new');
    expect(page1.hasMore).toBe(true);

    const page2 = await service.listHomeFeed(viewerId, {
      limit: 1,
      cursor: page1.cursor.next ?? undefined,
    });
    expect(page2.items[0]?.object.id).toBe('post-old');
  });
});

describe('ActivityService visibility by object type', () => {
  it('filters review, collection, tier list, community, comment, and user rows', async () => {
    const reviewsRepo = createFakeReviewRepository();
    const collectionsRepo = createFakeCollectionRepository();
    const tierListsRepo = createFakeTierListRepository();
    const commentsRepo = createFakeCommentRepository();
    const usersRepo = createFakeUserRepository([makeUser({ id: 'user-visible' })]);
    const communitiesRepo = createFakeCommunityRepository([
      makeCommunity({
        id: 'community-1',
        visibility: 'public',
      }),
    ]);
    const membersRepo = createFakeCommunityMemberRepository([
      makeCommunityMember({
        communityId: 'community-1',
        userId: 'owner-1',
        role: 'owner',
      }),
    ]);

    const visibilityService = new ActivityService(
      activityRepo,
      postsRepo,
      reviewsRepo,
      collectionsRepo,
      tierListsRepo,
      commentsRepo,
      usersRepo,
      communitiesRepo,
      membersRepo,
      followsRepo,
      null,
      null,
      null,
      null,
      null,
    );

    const seed = [
      makeActivityItem({ id: 'review-visible', objectType: 'review', objectId: 'review-1' }),
      makeActivityItem({
        id: 'collection-hidden',
        objectType: 'collection',
        objectId: 'collection-1',
      }),
      makeActivityItem({ id: 'tier-visible', objectType: 'tier_list', objectId: 'tier-1' }),
      makeActivityItem({
        id: 'community-visible',
        objectType: 'community',
        objectId: 'community-1',
      }),
      makeActivityItem({ id: 'comment-visible', objectType: 'comment', objectId: 'comment-1' }),
      makeActivityItem({ id: 'user-visible', objectType: 'user', objectId: 'user-visible' }),
      makeActivityItem({ id: 'game-visible', objectType: 'game', objectId: 'game-1' }),
    ];

    for (const item of seed) {
      activityRepo.items.set(item.id, item);
      activityRepo.feedUserIds.set(item.id, viewerId);
      activityRepo.feedEntryIds.set(item.id, `feed-${item.id}`);
    }

    reviewsRepo.rows.set(
      'review-1',
      makeReview({
        id: 'review-1',
        authorId: viewerId,
        visibility: 'public',
      }),
    );
    collectionsRepo.rows.set(
      'collection-1',
      makeCollection({
        id: 'collection-1',
        ownerId: 'other-user',
        visibility: 'private',
      }),
    );
    tierListsRepo.rows.set(
      'tier-1',
      makeTierList({
        id: 'tier-1',
        ownerId: viewerId,
        visibility: 'public',
      }),
    );
    commentsRepo.rows.set(
      'comment-1',
      makeComment({
        id: 'comment-1',
        hostType: 'post',
        hostId: 'post-comment-host',
      }),
    );
    postsRepo.rows.set(
      'post-comment-host',
      makePost({ id: 'post-comment-host', authorId: viewerId, visibility: 'public' }),
    );

    const page = await visibilityService.listActivity(viewerId);
    expect(page.items.map((row) => row.id).sort()).toEqual(
      [
        'comment-visible',
        'community-visible',
        'game-visible',
        'review-visible',
        'tier-visible',
        'user-visible',
      ].sort(),
    );
  });

  it('supports date filters, invalid cursors, and unknown object types', async () => {
    const unknownItem = makeActivityItem({
      id: 'unknown',
      objectType: 'unknown_type' as never,
      objectId: 'obj-1',
    });
    activityRepo.items.set(unknownItem.id, unknownItem);
    activityRepo.feedUserIds.set(unknownItem.id, viewerId);
    activityRepo.feedEntryIds.set(unknownItem.id, 'feed-unknown');

    const filtered = await service.listActivity(viewerId, {
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-12-31T00:00:00.000Z',
    });
    expect(filtered.items.some((row) => row.id === 'unknown')).toBe(false);

    await expect(service.listActivity(viewerId, { cursor: 'bad' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('scans additional batches when the first batch is full but nothing is visible yet', async () => {
    const batch1 = Array.from({ length: 50 }, (_, index) => ({
      activityItem: makeActivityItem({
        id: `hidden-${index}`,
        objectType: 'unknown_type' as never,
        objectId: `obj-${index}`,
      }),
      actor: null,
    }));
    const batch2 = [
      {
        activityItem: makeActivityItem({
          id: 'visible-game',
          objectType: 'game',
          objectId: 'game-1',
        }),
        actor: null,
      },
    ];
    let calls = 0;
    vi.spyOn(activityRepo, 'listForUser').mockImplementation(async () => {
      calls += 1;
      return calls === 1 ? batch1 : batch2;
    });

    const page = await service.listActivity(viewerId, { limit: 5 });
    expect(page.items.map((row) => row.id)).toEqual(['visible-game']);
    expect(calls).toBe(2);
  });
});

describe('ActivityService visibility edges', () => {
  it('hides deleted targets and unknown object types', async () => {
    const deletedPost = makeActivityItem({
      id: 'deleted-post',
      objectType: 'post',
      objectId: 'post-deleted',
    });
    postsRepo.rows.set(
      'post-deleted',
      makePost({
        id: 'post-deleted',
        authorId: viewerId,
        visibility: 'public',
        deletedAt: new Date(),
      }),
    );
    activityRepo.items.set(deletedPost.id, deletedPost);
    activityRepo.feedUserIds.set(deletedPost.id, viewerId);
    activityRepo.feedEntryIds.set(deletedPost.id, 'feed-deleted');

    const page = await service.listActivity(viewerId);
    expect(page.items.some((row) => row.id === 'deleted-post')).toBe(false);
  });

  it('supports event and achievement object types', async () => {
    for (const [id, objectType] of [
      ['event-item', 'event'],
      ['achievement-item', 'achievement'],
    ] as const) {
      const item = makeActivityItem({ id, objectType, objectId: `${id}-obj` });
      activityRepo.items.set(item.id, item);
      activityRepo.feedUserIds.set(item.id, viewerId);
      activityRepo.feedEntryIds.set(item.id, `feed-${id}`);
    }

    const page = await service.listActivity(viewerId);
    expect(page.items.map((row) => row.id).sort()).toEqual(['achievement-item', 'event-item']);
  });

  it('hides communities without owners and resolves followers-only access', async () => {
    const communitiesRepo = createFakeCommunityRepository([
      makeCommunity({
        id: 'community-no-owner',
        visibility: 'public',
      }),
      makeCommunity({
        id: 'community-followers',
        visibility: 'followers',
      }),
    ]);
    const membersRepo = createFakeCommunityMemberRepository([
      makeCommunityMember({
        communityId: 'community-followers',
        userId: 'owner-2',
        role: 'owner',
      }),
    ]);
    followsRepo.rows.set(
      'follow-owner',
      makeFollow({
        id: 'follow-owner',
        followerId: viewerId,
        followeeId: 'owner-2',
      }),
    );
    const edgeService = new ActivityService(
      activityRepo,
      postsRepo,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      communitiesRepo,
      membersRepo,
      followsRepo,
      null,
      null,
      null,
      null,
      null,
    );

    for (const [id, communityId] of [
      ['no-owner', 'community-no-owner'],
      ['followers-visible', 'community-followers'],
    ] as const) {
      const item = makeActivityItem({
        id,
        objectType: 'community',
        objectId: communityId,
      });
      activityRepo.items.set(item.id, item);
      activityRepo.feedUserIds.set(item.id, viewerId);
      activityRepo.feedEntryIds.set(item.id, `feed-${id}`);
    }

    const page = await edgeService.listActivity(viewerId);
    expect(page.items.map((row) => row.id)).toEqual(['followers-visible']);
  });

  it('checks review-hosted comments and scans full home-feed batches', async () => {
    const commentsRepo = createFakeCommentRepository();
    const reviewsRepo = createFakeReviewRepository();
    commentsRepo.rows.set(
      'comment-review',
      makeComment({
        id: 'comment-review',
        hostType: 'review',
        hostId: 'review-host',
      }),
    );
    reviewsRepo.rows.set(
      'review-host',
      makeReview({
        id: 'review-host',
        authorId: viewerId,
        visibility: 'public',
      }),
    );
    const reviewService = new ActivityService(
      activityRepo,
      postsRepo,
      reviewsRepo,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      commentsRepo,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      { listByCommunity: () => Promise.resolve([]) } as never,
      followsRepo,
      null,
      null,
      null,
      null,
      null,
    );
    const commentItem = makeActivityItem({
      id: 'comment-review-item',
      objectType: 'comment',
      objectId: 'comment-review',
    });
    activityRepo.items.set(commentItem.id, commentItem);
    activityRepo.feedUserIds.set(commentItem.id, viewerId);
    activityRepo.feedEntryIds.set(commentItem.id, 'feed-comment-review');

    const commentPage = await reviewService.listActivity(viewerId);
    expect(commentPage.items.map((row) => row.id)).toEqual(['comment-review-item']);

    const batch1 = Array.from({ length: 50 }, (_, index) => ({
      feedEntryId: `feed-hidden-${index}`,
      activityItem: makeActivityItem({
        id: `home-hidden-${index}`,
        objectType: 'unknown_type' as never,
        objectId: `obj-${index}`,
      }),
      actor: null,
    }));
    const batch2 = [
      {
        feedEntryId: 'feed-visible-home',
        activityItem: makeActivityItem({
          id: 'home-visible',
          objectType: 'game',
          objectId: 'game-visible',
        }),
        actor: null,
      },
    ];
    let homeCalls = 0;
    vi.spyOn(activityRepo, 'listHomeFeed').mockImplementation(async () => {
      homeCalls += 1;
      return homeCalls === 1 ? batch1 : batch2;
    });
    const homePage = await reviewService.listHomeFeed(viewerId, { limit: 5 });
    expect(homePage.items[0]?.object.id).toBe('game-visible');
    expect(homeCalls).toBe(2);
  });
});

describe('ActivityService.listGameFeed', () => {
  it('projects public posts and reviews for a game and paginates by opaque id', async () => {
    const author = makeUser({ id: 'author-1', handle: 'author' });
    const usersRepo = createFakeUserRepository([author]);
    const reviewsRepo = createFakeReviewRepository([
      makeReview({
        id: 'review-g1',
        gameId: 'game-1',
        authorId: 'author-1',
        visibility: 'public',
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
      }),
    ]);
    postsRepo.rows.set(
      'post-g1',
      makePost({
        id: 'post-g1',
        gameId: 'game-1',
        authorId: 'author-1',
        visibility: 'public',
        createdAt: new Date('2026-01-03T00:00:00.000Z'),
      }),
    );
    postsRepo.rows.set(
      'post-private',
      makePost({
        id: 'post-private',
        gameId: 'game-1',
        authorId: 'author-1',
        visibility: 'private',
      }),
    );

    const gameService = new ActivityService(
      activityRepo,
      postsRepo,
      reviewsRepo,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      usersRepo,
      { findById: () => Promise.resolve(null) } as never,
      { listByCommunity: () => Promise.resolve([]) } as never,
      followsRepo,
      { listMutedIds: () => Promise.resolve([]) } as never,
      null,
      { listBlockedPairIds: () => Promise.resolve([]) } as never,
      null,
      null,
    );

    const page = await gameService.listGameFeed(viewerId, 'game-1', { limit: 1 });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.id).toBe('game-post:post-g1');
    expect(page.hasMore).toBe(true);
    expect(page.cursor.next).toBeTruthy();

    const next = await gameService.listGameFeed(viewerId, 'game-1', {
      limit: 10,
      cursor: page.cursor.next!,
    });
    expect(next.items.map((row) => row.id)).toEqual(['game-review:review-g1']);
  });

  it('skips muted and blocked authors for guests and players', async () => {
    const author = makeUser({ id: 'blocked-1', handle: 'blocked' });
    const usersRepo = createFakeUserRepository([author]);
    postsRepo.rows.set(
      'post-blocked',
      makePost({
        id: 'post-blocked',
        gameId: 'game-2',
        authorId: 'blocked-1',
        visibility: 'public',
      }),
    );
    const reviewsRepo = createFakeReviewRepository();
    const gameService = new ActivityService(
      activityRepo,
      postsRepo,
      reviewsRepo,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      usersRepo,
      { findById: () => Promise.resolve(null) } as never,
      { listByCommunity: () => Promise.resolve([]) } as never,
      followsRepo,
      { listMutedIds: () => Promise.resolve(['blocked-1']) } as never,
      null,
      { listBlockedPairIds: () => Promise.resolve([]) } as never,
      null,
      null,
    );

    await expect(gameService.listGameFeed(viewerId, 'game-2')).resolves.toMatchObject({
      items: [],
    });
    // Guests have no mute set — public posts remain visible.
    await expect(gameService.listGameFeed(null, 'game-2')).resolves.toMatchObject({
      items: [expect.objectContaining({ id: 'game-post:post-blocked' })],
    });
  });
});

describe('ActivityService.listReviewFeed', () => {
  function reviewFeedService(options?: {
    friendIds?: string[];
    games?: { findById: (id: string) => Promise<{ popularity: number } | null> };
  }) {
    const author = makeUser({ id: 'rev-author', handle: 'rev' });
    const usersRepo = createFakeUserRepository([author, makeUser({ id: viewerId })]);
    const reviewsRepo = createFakeReviewRepository([
      makeReview({
        id: 'rev-low',
        authorId: 'rev-author',
        rating: 2,
        body: 'short',
        visibility: 'public',
        gameId: 'game-gem',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
      makeReview({
        id: 'rev-gem',
        authorId: 'rev-author',
        rating: 9,
        body: 'x'.repeat(100),
        visibility: 'public',
        gameId: 'game-gem',
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
      }),
      makeReview({
        id: 'rev-friend',
        authorId: 'friend-1',
        rating: 8,
        body: 'friend review body long enough',
        visibility: 'public',
        gameId: 'game-gem',
      }),
    ]);
    usersRepo.rows.set('friend-1', makeUser({ id: 'friend-1', handle: 'friend' }));

    for (const review of reviewsRepo.rows.values()) {
      const item = makeActivityItem({
        id: `act-${review.id}`,
        kind: 'review',
        objectType: 'review',
        objectId: review.id,
        actorId: review.authorId,
        occurredAt: review.createdAt,
      });
      activityRepo.items.set(item.id, item);
      activityRepo.feedUserIds.set(item.id, viewerId);
      activityRepo.feedEntryIds.set(item.id, `feed-${review.id}`);
    }

    return new ActivityService(
      activityRepo,
      postsRepo,
      reviewsRepo,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      usersRepo,
      { findById: () => Promise.resolve(null) } as never,
      { listByCommunity: () => Promise.resolve([]) } as never,
      followsRepo,
      { listMutedIds: () => Promise.resolve([]) } as never,
      {
        listFriendIds: () => Promise.resolve(options?.friendIds ?? ['friend-1']),
        findFriendship: () => Promise.resolve(null),
      } as never,
      { listBlockedPairIds: () => Promise.resolve([]) } as never,
      (options?.games ?? {
        findById: () => Promise.resolve({ popularity: 1 }),
      }) as never,
      null,
    );
  }

  it('delegates latest slice to home reviews filter', async () => {
    const svc = reviewFeedService();
    const page = await svc.listReviewFeed(viewerId, { slice: 'latest', limit: 10 });
    expect(page.items.every((row) => row.kind === 'review' || row.object.type === 'review')).toBe(
      true,
    );
  });

  it('filters friends · negative · popular · hidden_gems slices', async () => {
    const svc = reviewFeedService({ friendIds: ['friend-1'] });

    const friends = await svc.listReviewFeed(viewerId, { slice: 'friends' });
    expect(friends.items.map((row) => row.object.id)).toEqual(['rev-friend']);

    const negative = await svc.listReviewFeed(viewerId, { slice: 'negative' });
    expect(negative.items.map((row) => row.object.id)).toContain('rev-low');

    const popular = await svc.listReviewFeed(viewerId, { slice: 'popular' });
    expect(popular.items.length).toBeGreaterThan(0);

    const gems = await svc.listReviewFeed(viewerId, { slice: 'hidden_gems' });
    expect(gems.items.map((row) => row.object.id)).toContain('rev-gem');
  });

  it('excludes high-popularity games from hidden_gems and empty friends without friendships', async () => {
    const popularSvc = reviewFeedService({
      friendIds: ['friend-1'],
      games: { findById: () => Promise.resolve({ popularity: 999 }) },
    });
    const gems = await popularSvc.listReviewFeed(viewerId, { slice: 'hidden_gems' });
    expect(gems.items.map((row) => row.object.id)).not.toContain('rev-gem');

    const noFriends = new ActivityService(
      activityRepo,
      postsRepo,
      createFakeReviewRepository([
        makeReview({
          id: 'rev-friend',
          authorId: 'friend-1',
          rating: 8,
          visibility: 'public',
          gameId: 'game-gem',
        }),
      ]),
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      createFakeUserRepository([makeUser({ id: 'friend-1' }), makeUser({ id: viewerId })]),
      { findById: () => Promise.resolve(null) } as never,
      { listByCommunity: () => Promise.resolve([]) } as never,
      followsRepo,
      { listMutedIds: () => Promise.resolve([]) } as never,
      null,
      { listBlockedPairIds: () => Promise.resolve([]) } as never,
      { findById: () => Promise.resolve({ popularity: 1 }) } as never,
      null,
    );
    const friendItem = makeActivityItem({
      id: 'act-rev-friend',
      kind: 'review',
      objectType: 'review',
      objectId: 'rev-friend',
      actorId: 'friend-1',
    });
    activityRepo.items.set(friendItem.id, friendItem);
    activityRepo.feedUserIds.set(friendItem.id, viewerId);
    activityRepo.feedEntryIds.set(friendItem.id, 'feed-rev-friend');

    const friends = await noFriends.listReviewFeed(viewerId, { slice: 'friends' });
    expect(friends.items).toEqual([]);
  });

  it('treats missing games repo as zero popularity for hidden_gems', async () => {
    const reviewsRepo = createFakeReviewRepository([
      makeReview({
        id: 'rev-gem-null',
        authorId: 'rev-author',
        rating: 9,
        body: 'x'.repeat(100),
        visibility: 'public',
        gameId: 'game-gem',
      }),
    ]);
    const usersRepo = createFakeUserRepository([
      makeUser({ id: 'rev-author' }),
      makeUser({ id: viewerId }),
    ]);
    const item = makeActivityItem({
      id: 'act-gem-null',
      kind: 'review',
      objectType: 'review',
      objectId: 'rev-gem-null',
      actorId: 'rev-author',
    });
    activityRepo.items.set(item.id, item);
    activityRepo.feedUserIds.set(item.id, viewerId);
    activityRepo.feedEntryIds.set(item.id, 'feed-gem-null');

    const nullGames = new ActivityService(
      activityRepo,
      postsRepo,
      reviewsRepo,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      usersRepo,
      { findById: () => Promise.resolve(null) } as never,
      { listByCommunity: () => Promise.resolve([]) } as never,
      followsRepo,
      { listMutedIds: () => Promise.resolve([]) } as never,
      null,
      { listBlockedPairIds: () => Promise.resolve([]) } as never,
      null,
      null,
    );
    const gems = await nullGames.listReviewFeed(viewerId, { slice: 'hidden_gems' });
    expect(gems.items.map((row) => row.object.id)).toContain('rev-gem-null');
  });

  it('skips muted · blocked · missing reviews and paginates ranked slices', async () => {
    const reviewsRepo = createFakeReviewRepository([
      makeReview({
        id: 'rev-keep',
        authorId: 'rev-author',
        rating: 2,
        visibility: 'public',
        gameId: 'game-gem',
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
      }),
      makeReview({
        id: 'rev-muted',
        authorId: 'muted-1',
        rating: 1,
        visibility: 'public',
        gameId: 'game-gem',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    ]);
    const usersRepo = createFakeUserRepository([
      makeUser({ id: 'rev-author' }),
      makeUser({ id: 'muted-1' }),
      makeUser({ id: viewerId }),
    ]);
    for (const review of reviewsRepo.rows.values()) {
      const item = makeActivityItem({
        id: `act-${review.id}`,
        kind: 'review',
        objectType: 'review',
        objectId: review.id,
        actorId: review.authorId,
        occurredAt: review.createdAt,
      });
      activityRepo.items.set(item.id, item);
      activityRepo.feedUserIds.set(item.id, viewerId);
      activityRepo.feedEntryIds.set(item.id, `feed-${review.id}`);
    }
    const missing = makeActivityItem({
      id: 'act-missing',
      kind: 'review',
      objectType: 'review',
      objectId: 'rev-gone',
      actorId: 'rev-author',
    });
    activityRepo.items.set(missing.id, missing);
    activityRepo.feedUserIds.set(missing.id, viewerId);
    activityRepo.feedEntryIds.set(missing.id, 'feed-missing');

    const svc = new ActivityService(
      activityRepo,
      postsRepo,
      reviewsRepo,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      usersRepo,
      { findById: () => Promise.resolve(null) } as never,
      { listByCommunity: () => Promise.resolve([]) } as never,
      followsRepo,
      { listMutedIds: () => Promise.resolve(['muted-1']) } as never,
      {
        listFriendIds: () => Promise.resolve([]),
        findFriendship: () => Promise.resolve(null),
      } as never,
      { listBlockedPairIds: () => Promise.resolve([]) } as never,
      { findById: () => Promise.resolve({ popularity: 1 }) } as never,
      null,
    );

    const page1 = await svc.listReviewFeed(viewerId, { slice: 'negative', limit: 1 });
    expect(page1.items.map((row) => row.object.id)).toEqual(['rev-keep']);
    expect(page1.hasMore).toBe(false);
  });
});

describe('ActivityService.listGameFeed cache and edges', () => {
  it('serves cached game feed pages and skips blocked · deleted authors', async () => {
    const author = makeUser({ id: 'author-1', handle: 'author' });
    const deleted = makeUser({
      id: 'deleted-1',
      handle: 'gone',
      deletedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const usersRepo = createFakeUserRepository([author, deleted]);
    postsRepo.rows.set(
      'post-ok',
      makePost({
        id: 'post-ok',
        gameId: 'game-cache',
        authorId: 'author-1',
        visibility: 'public',
        createdAt: new Date('2026-01-03T00:00:00.000Z'),
      }),
    );
    postsRepo.rows.set(
      'post-blocked',
      makePost({
        id: 'post-blocked',
        gameId: 'game-cache',
        authorId: 'blocked-1',
        visibility: 'public',
      }),
    );
    postsRepo.rows.set(
      'post-deleted-author',
      makePost({
        id: 'post-deleted-author',
        gameId: 'game-cache',
        authorId: 'deleted-1',
        visibility: 'public',
      }),
    );
    usersRepo.rows.set('blocked-1', makeUser({ id: 'blocked-1', handle: 'blocked' }));

    const feedCache = {
      gameKey: () => 'game-cache-key',
      gameIndexKey: () => 'game-cache-index',
      getPage: vi.fn().mockResolvedValueOnce({
        items: [{ id: 'cached-game' }],
        cursor: { next: null },
        hasMore: false,
        limit: 20,
      }),
      setPage: vi.fn(),
    };

    const svc = new ActivityService(
      activityRepo,
      postsRepo,
      createFakeReviewRepository(),
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      usersRepo,
      { findById: () => Promise.resolve(null) } as never,
      { listByCommunity: () => Promise.resolve([]) } as never,
      followsRepo,
      { listMutedIds: () => Promise.resolve([]) } as never,
      null,
      { listBlockedPairIds: () => Promise.resolve(['blocked-1']) } as never,
      null,
      feedCache as never,
    );

    const cached = await svc.listGameFeed(viewerId, 'game-cache');
    expect(cached.items).toEqual([{ id: 'cached-game' }]);

    feedCache.getPage.mockResolvedValue(null);
    const page = await svc.listGameFeed(viewerId, 'game-cache', { limit: 10 });
    expect(page.items.map((row) => row.id)).toEqual(['game-post:post-ok']);
    expect(feedCache.setPage).toHaveBeenCalled();

    await expect(svc.listGameFeed(viewerId, 'game-cache', { cursor: '' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('ignores unknown opaque cursors and sorts ties by id', async () => {
    const author = makeUser({ id: 'author-1', handle: 'author' });
    const usersRepo = createFakeUserRepository([author]);
    const stamp = new Date('2026-01-02T00:00:00.000Z');
    postsRepo.rows.set(
      'post-b',
      makePost({
        id: 'post-b',
        gameId: 'game-tie',
        authorId: 'author-1',
        visibility: 'public',
        createdAt: stamp,
      }),
    );
    postsRepo.rows.set(
      'post-a',
      makePost({
        id: 'post-a',
        gameId: 'game-tie',
        authorId: 'author-1',
        visibility: 'public',
        createdAt: stamp,
      }),
    );
    const svc = new ActivityService(
      activityRepo,
      postsRepo,
      createFakeReviewRepository(),
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      usersRepo,
      { findById: () => Promise.resolve(null) } as never,
      { listByCommunity: () => Promise.resolve([]) } as never,
      followsRepo,
      null,
      null,
      null,
      null,
      null,
    );
    const unknownCursor = Buffer.from('game-post:missing', 'utf8').toString('base64url');
    const page = await svc.listGameFeed(viewerId, 'game-tie', { cursor: unknownCursor });
    expect(page.items.map((row) => row.id)).toEqual(['game-post:post-a', 'game-post:post-b']);
  });
});

describe('ActivityService home feed filters', () => {
  it('applies following · games · reviews · media · communities · events filters', async () => {
    const author = makeUser({ id: 'author-f', handle: 'af' });
    followsRepo.rows.set('f1', makeFollow({ followerId: viewerId, followeeId: 'author-f' }));
    const usersRepo = createFakeUserRepository([author, makeUser({ id: viewerId })]);
    postsRepo.rows.set(
      'media-post',
      makePost({ id: 'media-post', authorId: 'author-f', visibility: 'public' }),
    );

    const rows = [
      makeActivityItem({
        id: 'f-follow',
        kind: 'post',
        objectType: 'post',
        objectId: 'media-post',
        actorId: 'author-f',
      }),
      makeActivityItem({
        id: 'f-game',
        kind: 'wishlist',
        objectType: 'game',
        objectId: 'game-1',
        actorId: 'author-f',
      }),
      makeActivityItem({
        id: 'f-review',
        kind: 'review',
        objectType: 'review',
        objectId: 'rev-x',
        actorId: 'author-f',
      }),
      makeActivityItem({
        id: 'f-community',
        kind: 'community',
        objectType: 'community',
        objectId: 'c-1',
        actorId: 'author-f',
      }),
      makeActivityItem({
        id: 'f-event',
        kind: 'event',
        objectType: 'event',
        objectId: 'e-1',
        actorId: 'author-f',
      }),
    ];

    const reviewsRepo = createFakeReviewRepository([
      makeReview({ id: 'rev-x', authorId: 'author-f', visibility: 'public' }),
    ]);
    const communitiesRepo = createFakeCommunityRepository([
      makeCommunity({ id: 'c-1', visibility: 'public' }),
    ]);
    const membersRepo = createFakeCommunityMemberRepository([
      makeCommunityMember({
        communityId: 'c-1',
        userId: 'author-f',
        role: 'owner',
      }),
    ]);

    for (const item of rows) {
      activityRepo.items.set(item.id, item);
      activityRepo.feedUserIds.set(item.id, viewerId);
      activityRepo.feedEntryIds.set(item.id, `feed-${item.id}`);
    }

    const svc = new ActivityService(
      activityRepo,
      postsRepo,
      reviewsRepo,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      usersRepo,
      communitiesRepo,
      membersRepo,
      followsRepo,
      { listMutedIds: () => Promise.resolve([]) } as never,
      {
        listFriendIds: () => Promise.resolve([]),
        findFriendship: () => Promise.resolve({ id: 'friendship-1' }),
      } as never,
      { listBlockedPairIds: () => Promise.resolve([]) } as never,
      null,
      null,
    );

    await expect(svc.listHomeFeed(viewerId, { filter: 'following' })).resolves.toMatchObject({
      items: expect.arrayContaining([expect.objectContaining({ id: expect.any(String) })]),
    });
    await expect(svc.listHomeFeed(viewerId, { filter: 'games' })).resolves.toMatchObject({
      items: expect.arrayContaining([
        expect.objectContaining({ object: { type: 'game', id: 'game-1' } }),
      ]),
    });
    await expect(svc.listHomeFeed(viewerId, { filter: 'reviews' })).resolves.toMatchObject({
      items: expect.arrayContaining([
        expect.objectContaining({ object: { type: 'review', id: 'rev-x' } }),
      ]),
    });
    await expect(svc.listHomeFeed(viewerId, { filter: 'media' })).resolves.toMatchObject({
      items: expect.arrayContaining([
        expect.objectContaining({ object: { type: 'post', id: 'media-post' } }),
      ]),
    });
    await expect(svc.listHomeFeed(viewerId, { filter: 'communities' })).resolves.toMatchObject({
      items: expect.arrayContaining([
        expect.objectContaining({ object: { type: 'community', id: 'c-1' } }),
      ]),
    });
    await expect(svc.listHomeFeed(viewerId, { filter: 'events' })).resolves.toMatchObject({
      items: expect.arrayContaining([
        expect.objectContaining({ object: { type: 'event', id: 'e-1' } }),
      ]),
    });

    // 13.2 — the friendship fake above answers with one, so §4's third tab
    // has something to show.
    await expect(svc.listHomeFeed(viewerId, { filter: 'friends' })).resolves.toMatchObject({
      items: expect.arrayContaining([expect.objectContaining({ id: expect.any(String) })]),
    });

    // And it is genuinely narrower than `following`: with the follow still in
    // place but no friendship, the same rows serve the following tab and none
    // of them reaches the friends tab. A friends feed that quietly falls back
    // to follows would be the following feed under a second name.
    const strangers = new ActivityService(
      activityRepo,
      postsRepo,
      reviewsRepo,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      usersRepo,
      communitiesRepo,
      membersRepo,
      followsRepo,
      { listMutedIds: () => Promise.resolve([]) } as never,
      {
        listFriendIds: () => Promise.resolve([]),
        findFriendship: () => Promise.resolve(null),
      } as never,
      { listBlockedPairIds: () => Promise.resolve([]) } as never,
      null,
      null,
    );

    await expect(strangers.listHomeFeed(viewerId, { filter: 'friends' })).resolves.toMatchObject({
      items: [],
    });
    await expect(strangers.listHomeFeed(viewerId, { filter: 'following' })).resolves.toMatchObject({
      items: expect.arrayContaining([expect.objectContaining({ id: expect.any(String) })]),
    });
  });

  it('serves and stores home feed pages via FeedCacheService', async () => {
    const feedCache = {
      homeKey: () => 'cache-key',
      homeIndexKey: () => 'cache-index',
      getPage: vi.fn().mockResolvedValue({
        items: [{ id: 'cached' }],
        cursor: { next: null },
        hasMore: false,
        limit: 20,
      }),
      setPage: vi.fn(),
    };
    const svc = new ActivityService(
      activityRepo,
      postsRepo,
      { findById: () => Promise.resolve(null), listByGame: () => Promise.resolve([]) } as never,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      { listByCommunity: () => Promise.resolve([]) } as never,
      followsRepo,
      null,
      null,
      null,
      null,
      feedCache as never,
    );
    const cached = await svc.listHomeFeed(viewerId, { filter: 'for_you' });
    expect(cached.items).toEqual([{ id: 'cached' }]);
    expect(feedCache.getPage).toHaveBeenCalled();

    feedCache.getPage.mockResolvedValueOnce(null);
    await svc.listHomeFeed(viewerId, { filter: 'for_you' });
    expect(feedCache.setPage).toHaveBeenCalled();
  });

  it('serves and stores discover feed pages via FeedCacheService', async () => {
    const feedCache = {
      discoverKey: () => 'discover-key',
      getPage: vi.fn().mockResolvedValue({
        items: [{ id: 'discover-cached' }],
        cursor: { next: null },
        hasMore: false,
        limit: 20,
      }),
      setPage: vi.fn(),
    };
    const svc = new ActivityService(
      activityRepo,
      postsRepo,
      { findById: () => Promise.resolve(null), listByGame: () => Promise.resolve([]) } as never,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      { listByCommunity: () => Promise.resolve([]) } as never,
      followsRepo,
      null,
      null,
      null,
      null,
      feedCache as never,
    );
    const cached = await svc.listDiscoverFeed(viewerId);
    expect(cached.items).toEqual([{ id: 'discover-cached' }]);
    expect(feedCache.getPage).toHaveBeenCalledWith('discover-key');

    feedCache.getPage.mockResolvedValueOnce(null);
    await svc.listDiscoverFeed(viewerId);
    expect(feedCache.setPage).toHaveBeenCalled();
  });

  it('scores for_you rows and maps recommendation slots with take', async () => {
    const author = makeUser({ id: 'author-score', handle: 'scorer' });
    followsRepo.rows.set(
      'f-score',
      makeFollow({ followerId: viewerId, followeeId: 'author-score' }),
    );
    postsRepo.rows.set(
      'post-score',
      makePost({ id: 'post-score', authorId: 'author-score', visibility: 'public' }),
    );
    const item = makeActivityItem({
      id: 'score-item',
      kind: 'recommendation_slot',
      objectType: 'post',
      objectId: 'post-score',
      actorId: 'author-score',
      occurredAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    activityRepo.items.set(item.id, item);
    activityRepo.feedUserIds.set(item.id, viewerId);
    activityRepo.feedEntryIds.set(item.id, 'feed-score');

    const svc = new ActivityService(
      activityRepo,
      postsRepo,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      { findById: () => Promise.resolve(null) } as never,
      createFakeUserRepository([author, makeUser({ id: viewerId })]),
      { findById: () => Promise.resolve(null) } as never,
      { listByCommunity: () => Promise.resolve([]) } as never,
      followsRepo,
      { listMutedIds: () => Promise.resolve([]) } as never,
      {
        listFriendIds: () => Promise.resolve([]),
        findFriendship: () => Promise.resolve({ id: 'fs-1' }),
      } as never,
      { listBlockedPairIds: () => Promise.resolve([]) } as never,
      null,
      null,
    );

    const page = await svc.listHomeFeed(viewerId, { filter: 'for_you', take: 5 });
    expect(page.items[0]?.feedItemKind).toBe('recommendation_item');
    expect(page.limit).toBe(5);
  });
});
