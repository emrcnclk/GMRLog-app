import type {
  ActivityFeedRow,
  ActivityListCursor,
  ActivityRepository,
  BlockRepository,
  CollectionRepository,
  CommentRepository,
  CommunityMemberRepository,
  CommunityRepository,
  FollowRepository,
  FriendshipRepository,
  GameRepository,
  HomeFeedRow,
  MuteRepository,
  PostRepository,
  ReviewRepository,
  TierListRepository,
  UserRepository,
} from '@gmrlog/database';
import type { ActivityItemResponse, FeedItemResponse } from '@gmrlog/types';
import type { ActivityQueryInput, FeedQueryInput, ReviewFeedQueryInput } from '@gmrlog/validators';
import {
  ACTIVITY_LIST_DEFAULT_LIMIT,
  REVIEW_HIDDEN_GEM_MAX_POPULARITY,
  REVIEW_NEGATIVE_RATING_MAX,
} from '@gmrlog/validators';
import { BadRequestException, Inject, Injectable, Optional } from '@nestjs/common';

import { BLOCK_REPOSITORY } from '../blocks/blocks.tokens';
import { canViewerReadCollection } from '../collections/mappers/collection.mapper';
import {
  COMMUNITY_MEMBER_REPOSITORY,
  COMMUNITY_REPOSITORY,
} from '../communities/communities.tokens';
import { canViewerReadCommunity } from '../communities/mappers/community.mapper';
import { FOLLOW_REPOSITORY } from '../follows/follows.tokens';
import { FRIENDSHIP_REPOSITORY } from '../friends/friends.tokens';
import { PaginatedPayload } from '../infrastructure/http/paginated-payload';
import { FeedCacheService } from '../infrastructure/redis/feed-cache.service';
import { MUTE_REPOSITORY } from '../mutes/mutes.tokens';
import { canViewerReadPost, toUserPublicResponse } from '../posts/mappers/post.mapper';
import { canViewerReadReview } from '../reviews/mappers/review.mapper';
import { canViewerReadTierList } from '../tierlists/mappers/tierlist.mapper';

import {
  ACTIVITY_COLLECTION_REPOSITORY,
  ACTIVITY_COMMENT_REPOSITORY,
  ACTIVITY_GAME_REPOSITORY,
  ACTIVITY_POST_REPOSITORY,
  ACTIVITY_REPOSITORY,
  ACTIVITY_REVIEW_REPOSITORY,
  ACTIVITY_TIER_LIST_REPOSITORY,
  ACTIVITY_USER_REPOSITORY,
} from './activity.tokens';
import { computeFeedScore } from './feed-ranking';
import { toActivityItemResponse, toFeedItemResponse } from './mappers/activity.mapper';

const MAX_VISIBILITY_SCAN_BATCH = 50;
const REVIEW_SLICE_SCAN_BUDGET = 120;

/**
 * Activity center + D3.24 Hybrid Home Feed.
 * Deterministic ranking · mute/block · filters. No AI · no advertisement_item emit.
 */
@Injectable()
export class ActivityService {
  constructor(
    @Inject(ACTIVITY_REPOSITORY) private readonly activity: ActivityRepository,
    @Inject(ACTIVITY_POST_REPOSITORY) private readonly posts: PostRepository,
    @Inject(ACTIVITY_REVIEW_REPOSITORY) private readonly reviews: ReviewRepository,
    @Inject(ACTIVITY_COLLECTION_REPOSITORY) private readonly collections: CollectionRepository,
    @Inject(ACTIVITY_TIER_LIST_REPOSITORY) private readonly tierLists: TierListRepository,
    @Inject(ACTIVITY_COMMENT_REPOSITORY) private readonly comments: CommentRepository,
    @Inject(ACTIVITY_USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(COMMUNITY_REPOSITORY) private readonly communities: CommunityRepository,
    @Inject(COMMUNITY_MEMBER_REPOSITORY)
    private readonly communityMembers: CommunityMemberRepository,
    @Inject(FOLLOW_REPOSITORY) private readonly follows: FollowRepository,
    @Optional() @Inject(MUTE_REPOSITORY) private readonly mutes: MuteRepository | null,
    @Optional()
    @Inject(FRIENDSHIP_REPOSITORY)
    private readonly friendships: FriendshipRepository | null,
    @Optional() @Inject(BLOCK_REPOSITORY) private readonly blocks: BlockRepository | null = null,
    @Optional()
    @Inject(ACTIVITY_GAME_REPOSITORY)
    private readonly games: GameRepository | null = null,
    @Optional() private readonly feedCache: FeedCacheService | null = null,
  ) {}

  async listActivity(
    viewerId: string,
    query: ActivityQueryInput = {},
  ): Promise<PaginatedPayload<ActivityItemResponse>> {
    const limit = query.limit ?? ACTIVITY_LIST_DEFAULT_LIMIT;
    const from = query.from !== undefined ? new Date(query.from) : undefined;
    const to = query.to !== undefined ? new Date(query.to) : undefined;
    let scanCursor = query.cursor !== undefined ? decodeCursor(query.cursor) : undefined;

    const visible: ActivityFeedRow[] = [];
    let hasMore = false;

    while (visible.length <= limit) {
      const batch = await this.activity.listForUser(viewerId, {
        limit: MAX_VISIBILITY_SCAN_BATCH,
        ...(scanCursor !== undefined ? { cursor: scanCursor } : {}),
        ...(from !== undefined ? { from } : {}),
        ...(to !== undefined ? { to } : {}),
      });

      if (batch.length === 0) {
        break;
      }

      for (const row of batch) {
        if (await this.isRowVisible(viewerId, row)) {
          visible.push(row);
          if (visible.length > limit) {
            hasMore = true;
            break;
          }
        }
      }

      if (hasMore || batch.length < MAX_VISIBILITY_SCAN_BATCH) {
        break;
      }

      const lastBatchRow = batch[batch.length - 1];
      if (lastBatchRow === undefined) {
        break;
      }
      scanCursor = {
        occurredAt: lastBatchRow.activityItem.occurredAt,
        id: lastBatchRow.activityItem.id,
      };
    }

    const page = hasMore ? visible.slice(0, limit) : visible;
    const last = page[page.length - 1];
    const next =
      hasMore && last !== undefined
        ? encodeCursor({
            occurredAt: last.activityItem.occurredAt,
            id: last.activityItem.id,
          })
        : null;

    return new PaginatedPayload(page.map(toActivityItemResponse), { next }, hasMore, limit);
  }

  async listHomeFeed(
    viewerId: string,
    query: FeedQueryInput | ActivityQueryInput = {},
  ): Promise<PaginatedPayload<FeedItemResponse>> {
    const filter = 'filter' in query ? (query.filter ?? 'for_you') : 'for_you';
    const cursorRaw = query.cursor;
    const cacheKey =
      this.feedCache !== null ? this.feedCache.homeKey(viewerId, filter, cursorRaw) : null;
    if (cacheKey !== null && this.feedCache !== null) {
      const cached = await this.feedCache.getPage<FeedItemResponse>(cacheKey);
      if (cached !== null) {
        return new PaginatedPayload(cached.items, cached.cursor, cached.hasMore, cached.limit);
      }
    }

    const page = await this.buildHomeFeed(viewerId, query);

    if (cacheKey !== null && this.feedCache !== null) {
      await this.feedCache.setPage(
        cacheKey,
        {
          items: page.items,
          cursor: page.cursor,
          hasMore: page.hasMore,
          limit: page.limit,
        },
        this.feedCache.homeIndexKey(viewerId),
      );
    }

    return page;
  }

  /**
   * D3.24 Discover feed — culture discovery timeline (`/feed/discover`).
   * Uses dedicated discover cache key; miss falls back to for_you build.
   */
  async listDiscoverFeed(
    viewerId: string,
    query: FeedQueryInput | ActivityQueryInput = {},
  ): Promise<PaginatedPayload<FeedItemResponse>> {
    const window = '7d';
    const cacheKey =
      this.feedCache !== null ? this.feedCache.discoverKey(viewerId, window, query.cursor) : null;
    if (cacheKey !== null && this.feedCache !== null) {
      const cached = await this.feedCache.getPage<FeedItemResponse>(cacheKey);
      if (cached !== null) {
        return new PaginatedPayload(cached.items, cached.cursor, cached.hasMore, cached.limit);
      }
    }

    const page = await this.buildHomeFeed(viewerId, { ...query, filter: 'for_you' });

    if (cacheKey !== null && this.feedCache !== null) {
      await this.feedCache.setPage(cacheKey, {
        items: page.items,
        cursor: page.cursor,
        hasMore: page.hasMore,
        limit: page.limit,
      });
    }

    return page;
  }

  /**
   * D3.24 Game Hub timeline — posts + reviews for `gameId`, AuthZ · blocks · mutes.
   */
  async listGameFeed(
    viewerId: string | null,
    gameId: string,
    query: ActivityQueryInput = {},
  ): Promise<PaginatedPayload<FeedItemResponse>> {
    const limit = query.limit ?? ACTIVITY_LIST_DEFAULT_LIMIT;
    const viewerKey = viewerId ?? 'anon';
    const cacheKey =
      this.feedCache !== null ? this.feedCache.gameKey(gameId, viewerKey, query.cursor) : null;
    if (cacheKey !== null && this.feedCache !== null) {
      const cached = await this.feedCache.getPage<FeedItemResponse>(cacheKey);
      if (cached !== null) {
        return new PaginatedPayload(cached.items, cached.cursor, cached.hasMore, cached.limit);
      }
    }

    const [posts, reviews] = await Promise.all([
      this.posts.listByGame(gameId),
      this.reviews.listByGame(gameId),
    ]);

    const mutedIds =
      viewerId !== null && this.mutes !== null
        ? new Set(await this.mutes.listMutedIds(viewerId))
        : new Set<string>();
    const blockedIds =
      viewerId !== null && this.blocks !== null
        ? new Set(await this.blocks.listBlockedPairIds(viewerId))
        : new Set<string>();

    const candidates: FeedItemResponse[] = [];

    for (const post of posts) {
      if (mutedIds.has(post.authorId) || blockedIds.has(post.authorId)) {
        continue;
      }
      const follows =
        viewerId !== null ? await this.follows.exists(viewerId, post.authorId) : false;
      if (!canViewerReadPost(post.visibility, post.authorId, viewerId, follows)) {
        continue;
      }
      const author = await this.users.findById(post.authorId);
      if (author == null || author.deletedAt != null) {
        continue;
      }
      candidates.push({
        id: `game-post:${post.id}`,
        kind: 'post',
        occurredAt: post.createdAt.toISOString(),
        actor: toUserPublicResponse(author),
        object: { type: 'post', id: post.id },
        projection: null,
        feedItemKind: 'post_item',
        contentClass: 'user_generated',
      });
    }

    for (const review of reviews) {
      if (mutedIds.has(review.authorId) || blockedIds.has(review.authorId)) {
        continue;
      }
      const follows =
        viewerId !== null ? await this.follows.exists(viewerId, review.authorId) : false;
      if (!canViewerReadReview(review.visibility, review.authorId, viewerId, follows)) {
        continue;
      }
      const author = await this.users.findById(review.authorId);
      if (author == null || author.deletedAt != null) {
        continue;
      }
      candidates.push({
        id: `game-review:${review.id}`,
        kind: 'review',
        occurredAt: review.createdAt.toISOString(),
        actor: toUserPublicResponse(author),
        object: { type: 'review', id: review.id },
        projection: null,
        feedItemKind: 'post_item',
        contentClass: 'user_generated',
      });
    }

    candidates.sort((a, b) => {
      const t = new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
      if (t !== 0) {
        return t;
      }
      return a.id.localeCompare(b.id);
    });

    const cursor = query.cursor !== undefined ? decodeOpaqueIdCursor(query.cursor) : null;
    let start = 0;
    if (cursor !== null) {
      const idx = candidates.findIndex((row) => row.id === cursor);
      start = idx >= 0 ? idx + 1 : 0;
    }
    const slice = candidates.slice(start, start + limit + 1);
    const hasMore = slice.length > limit;
    const pageItems = hasMore ? slice.slice(0, limit) : slice;
    const last = pageItems[pageItems.length - 1];
    const next = hasMore && last !== undefined ? encodeOpaqueIdCursor(last.id) : null;
    const page = new PaginatedPayload(pageItems, { next }, hasMore, limit);

    if (cacheKey !== null && this.feedCache !== null) {
      await this.feedCache.setPage(
        cacheKey,
        {
          items: page.items,
          cursor: page.cursor,
          hasMore: page.hasMore,
          limit: page.limit,
        },
        this.feedCache.gameIndexKey(gameId),
      );
    }

    return page;
  }

  private async buildHomeFeed(
    viewerId: string,
    query: FeedQueryInput | ActivityQueryInput = {},
  ): Promise<PaginatedPayload<FeedItemResponse>> {
    const limit =
      ('take' in query && query.take !== undefined ? query.take : undefined) ??
      query.limit ??
      ACTIVITY_LIST_DEFAULT_LIMIT;
    const filter = 'filter' in query ? (query.filter ?? 'for_you') : 'for_you';
    const from = query.from !== undefined ? new Date(query.from) : undefined;
    const to = query.to !== undefined ? new Date(query.to) : undefined;
    let scanCursor = query.cursor !== undefined ? decodeCursor(query.cursor) : undefined;

    const mutedIds =
      this.mutes !== null ? new Set(await this.mutes.listMutedIds(viewerId)) : new Set<string>();
    const blockedIds =
      this.blocks !== null
        ? new Set(await this.blocks.listBlockedPairIds(viewerId))
        : new Set<string>();

    const visible: HomeFeedRow[] = [];
    let hasMore = false;
    const scanBudget = filter === 'for_you' ? Math.max(limit * 3, 60) : limit + 1;

    while (visible.length < scanBudget) {
      const batch = await this.activity.listHomeFeed(viewerId, {
        limit: MAX_VISIBILITY_SCAN_BATCH,
        ...(scanCursor !== undefined ? { cursor: scanCursor } : {}),
        ...(from !== undefined ? { from } : {}),
        ...(to !== undefined ? { to } : {}),
      });

      if (batch.length === 0) {
        break;
      }

      for (const row of batch) {
        const actorId = row.activityItem.actorId;
        if (actorId !== null && (mutedIds.has(actorId) || blockedIds.has(actorId))) {
          continue;
        }
        if (!(await this.isRowVisible(viewerId, row))) {
          continue;
        }
        if (!(await this.matchesFilter(viewerId, row, filter))) {
          continue;
        }
        visible.push(row);
      }

      if (batch.length < MAX_VISIBILITY_SCAN_BATCH) {
        break;
      }

      const lastBatchRow = batch[batch.length - 1];
      if (lastBatchRow === undefined) {
        break;
      }
      scanCursor = {
        occurredAt: lastBatchRow.activityItem.occurredAt,
        id: lastBatchRow.activityItem.id,
      };
    }

    const scored = await Promise.all(
      visible.map(async (row) => {
        const score = await this.scoreRow(viewerId, row, filter);
        return { row, score };
      }),
    );

    if (filter === 'for_you') {
      scored.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        const t = b.row.activityItem.occurredAt.getTime() - a.row.activityItem.occurredAt.getTime();
        if (t !== 0) {
          return t;
        }
        return a.row.activityItem.id.localeCompare(b.row.activityItem.id);
      });
    }

    hasMore = scored.length > limit;
    const page = hasMore ? scored.slice(0, limit) : scored;
    const last = page[page.length - 1];
    const next =
      hasMore && last !== undefined
        ? encodeCursor({
            occurredAt: last.row.activityItem.occurredAt,
            id: last.row.activityItem.id,
          })
        : null;

    return new PaginatedPayload(
      page.map(({ row, score }) =>
        toFeedItemResponse(row, {
          score,
          // advertisement_item never emitted
          feedItemKind:
            row.activityItem.kind === 'recommendation_slot' ? 'recommendation_item' : undefined,
        }),
      ),
      { next },
      hasMore,
      limit,
    );
  }

  /**
   * D3.24 Review Feed — GET /feed/reviews?slice=
   * latest | friends | popular | negative | hidden_gems
   */
  async listReviewFeed(
    viewerId: string,
    query: ReviewFeedQueryInput = {},
  ): Promise<PaginatedPayload<FeedItemResponse>> {
    const slice = query.slice ?? 'latest';
    if (slice === 'latest') {
      return this.listHomeFeed(viewerId, { ...query, filter: 'reviews' });
    }

    const limit = query.limit ?? ACTIVITY_LIST_DEFAULT_LIMIT;
    const mutedIds =
      this.mutes !== null ? new Set(await this.mutes.listMutedIds(viewerId)) : new Set<string>();
    const blockedIds =
      this.blocks !== null
        ? new Set(await this.blocks.listBlockedPairIds(viewerId))
        : new Set<string>();

    const friendIds =
      slice === 'friends' && this.friendships !== null
        ? new Set(await this.friendships.listFriendIds(viewerId))
        : null;

    let scanCursor = query.cursor !== undefined ? decodeCursor(query.cursor) : undefined;
    const ranked: { row: HomeFeedRow; rank: number }[] = [];

    while (ranked.length < REVIEW_SLICE_SCAN_BUDGET) {
      const batch = await this.activity.listHomeFeed(viewerId, {
        limit: MAX_VISIBILITY_SCAN_BATCH,
        ...(scanCursor !== undefined ? { cursor: scanCursor } : {}),
      });
      if (batch.length === 0) {
        break;
      }

      for (const row of batch) {
        if (row.activityItem.kind !== 'review' || row.activityItem.objectType !== 'review') {
          continue;
        }
        const actorId = row.activityItem.actorId;
        if (actorId !== null && (mutedIds.has(actorId) || blockedIds.has(actorId))) {
          continue;
        }
        if (!(await this.isRowVisible(viewerId, row))) {
          continue;
        }

        const review = await this.reviews.findActiveById(row.activityItem.objectId);
        if (review === null) {
          continue;
        }

        if (slice === 'friends') {
          if (actorId === null || !friendIds?.has(actorId)) {
            continue;
          }
          ranked.push({ row, rank: row.activityItem.occurredAt.getTime() });
          continue;
        }

        if (slice === 'negative') {
          if (review.rating > REVIEW_NEGATIVE_RATING_MAX) {
            continue;
          }
          ranked.push({
            row,
            rank: -review.rating * 1_000_000 + row.activityItem.occurredAt.getTime(),
          });
          continue;
        }

        if (slice === 'popular') {
          const ageHours = Math.max(
            (Date.now() - row.activityItem.occurredAt.getTime()) / 3_600_000,
            1,
          );
          const bodyBoost = Math.min(review.body?.length ?? 0, 2000) / 2000;
          ranked.push({ row, rank: (review.rating + bodyBoost) / ageHours });
          continue;
        }

        // Remaining slice: hidden_gems.
        const bodyLen = review.body?.length ?? 0;
        if (review.rating < 7 || bodyLen < 80) {
          continue;
        }
        let popularity = 0;
        if (this.games !== null) {
          const game = await this.games.findById(review.gameId);
          popularity = game?.popularity ?? 0;
        }
        if (popularity > REVIEW_HIDDEN_GEM_MAX_POPULARITY) {
          continue;
        }
        ranked.push({
          row,
          rank:
            review.rating * 10_000 +
            Math.min(bodyLen, 2000) -
            popularity * 10 -
            ageHoursProxy(row.activityItem.occurredAt.toISOString()),
        });
      }

      if (batch.length < MAX_VISIBILITY_SCAN_BATCH) {
        break;
      }
      const lastBatchRow = batch[batch.length - 1];
      if (lastBatchRow === undefined) {
        break;
      }
      scanCursor = {
        occurredAt: lastBatchRow.activityItem.occurredAt,
        id: lastBatchRow.activityItem.id,
      };
    }

    ranked.sort((a, b) => {
      if (b.rank !== a.rank) {
        return b.rank - a.rank;
      }
      const t = b.row.activityItem.occurredAt.getTime() - a.row.activityItem.occurredAt.getTime();
      if (t !== 0) {
        return t;
      }
      return a.row.activityItem.id.localeCompare(b.row.activityItem.id);
    });

    const hasMore = ranked.length > limit;
    const page = hasMore ? ranked.slice(0, limit) : ranked;
    const last = page[page.length - 1];
    const next =
      hasMore && last !== undefined
        ? encodeCursor({
            occurredAt: last.row.activityItem.occurredAt,
            id: last.row.activityItem.id,
          })
        : null;

    return new PaginatedPayload(
      page.map(({ row }) =>
        toFeedItemResponse(row, {
          feedItemKind: 'post_item',
          contentClass: 'user_generated',
        }),
      ),
      { next },
      hasMore,
      limit,
    );
  }

  private async matchesFilter(
    viewerId: string,
    row: HomeFeedRow,
    filter: string,
  ): Promise<boolean> {
    const kind = row.activityItem.kind;
    switch (filter) {
      case 'following': {
        const actorId = row.activityItem.actorId;
        if (actorId === null || actorId === viewerId) {
          return false;
        }
        const isFollow = await this.follows.exists(viewerId, actorId);
        const isFriend =
          this.friendships !== null
            ? (await this.friendships.findFriendship(viewerId, actorId)) !== null
            : false;
        return isFollow || isFriend;
      }
      // 13.2 — §4's third tab, and narrower than `following` above on
      // purpose: that case is satisfied by a one-way follow, this one is not.
      // A viewer with no friends sees an empty feed rather than their
      // following feed under a different name, which is the honest answer.
      case 'friends': {
        const actorId = row.activityItem.actorId;
        if (actorId === null || actorId === viewerId || this.friendships === null) {
          return false;
        }
        return (await this.friendships.findFriendship(viewerId, actorId)) !== null;
      }
      case 'games':
        return (
          kind === 'game_log' ||
          kind === 'achievement' ||
          kind === 'wishlist' ||
          kind === 'library_import' ||
          kind === 'library_synced' ||
          kind === 'playtime_updated' ||
          row.activityItem.objectType === 'game'
        );
      case 'reviews':
        return kind === 'review';
      case 'media':
        return kind === 'post' && row.activityItem.objectType === 'post';
      case 'communities':
        return kind === 'community' || row.activityItem.objectType === 'community';
      case 'events':
        return kind === 'event' || row.activityItem.objectType === 'event';
      case 'for_you':
      default:
        return true;
    }
  }

  private async scoreRow(viewerId: string, row: HomeFeedRow, filter: string): Promise<number> {
    if (filter !== 'for_you') {
      return 0;
    }
    const actorId = row.activityItem.actorId;
    let isFriend = false;
    let isFollowing = false;
    if (actorId !== null && actorId !== viewerId) {
      isFollowing = await this.follows.exists(viewerId, actorId);
      if (this.friendships !== null) {
        isFriend = (await this.friendships.findFriendship(viewerId, actorId)) !== null;
      }
    }
    return computeFeedScore({
      occurredAt: row.activityItem.occurredAt,
      isFriend,
      isFollowing,
      sharedCommunityCount: 0,
      sharedGameOverlap: 0,
      interactionCount: 0,
      discoveryEligible: !isFriend && !isFollowing,
      userSimilarity: 0,
      interestOverlap: 0,
    });
  }

  private async isRowVisible(viewerId: string, row: ActivityFeedRow): Promise<boolean> {
    const { objectType, objectId } = row.activityItem;

    switch (objectType) {
      case 'post':
        return this.canReadPost(objectId, viewerId);
      case 'review':
        return this.canReadReview(objectId, viewerId);
      case 'collection':
        return this.canReadCollection(objectId, viewerId);
      case 'tier_list':
        return this.canReadTierList(objectId, viewerId);
      case 'community':
        return this.canReadCommunity(objectId, viewerId);
      case 'comment':
        return this.canReadComment(objectId, viewerId);
      case 'user':
        return this.canReadUser(objectId);
      case 'game':
      case 'event':
      case 'achievement':
        return true;
      default:
        return false;
    }
  }

  private async canReadPost(postId: string, viewerId: string): Promise<boolean> {
    const post = await this.posts.findById(postId);
    if (post == null || post.deletedAt != null) {
      return false;
    }
    const follows = await this.follows.exists(viewerId, post.authorId);
    return canViewerReadPost(post.visibility, post.authorId, viewerId, follows);
  }

  private async canReadReview(reviewId: string, viewerId: string): Promise<boolean> {
    const review = await this.reviews.findById(reviewId);
    if (review == null || review.deletedAt != null) {
      return false;
    }
    const follows = await this.follows.exists(viewerId, review.authorId);
    return canViewerReadReview(review.visibility, review.authorId, viewerId, follows);
  }

  private async canReadCollection(collectionId: string, viewerId: string): Promise<boolean> {
    const collection = await this.collections.findById(collectionId);
    if (collection == null || collection.deletedAt != null) {
      return false;
    }
    const follows = await this.follows.exists(viewerId, collection.ownerId);
    return canViewerReadCollection(collection.visibility, collection.ownerId, viewerId, follows);
  }

  private async canReadTierList(tierListId: string, viewerId: string): Promise<boolean> {
    const tierList = await this.tierLists.findById(tierListId);
    if (tierList == null || tierList.deletedAt != null) {
      return false;
    }
    const follows = await this.follows.exists(viewerId, tierList.ownerId);
    return canViewerReadTierList(tierList.visibility, tierList.ownerId, viewerId, follows);
  }

  private async canReadCommunity(communityId: string, viewerId: string): Promise<boolean> {
    const community = await this.communities.findById(communityId);
    if (community == null || community.deletedAt != null) {
      return false;
    }
    const members = await this.communityMembers.listByCommunity(communityId);
    const ownerUserId = members.find((row) => row.role === 'owner')?.userId ?? null;
    if (ownerUserId === null) {
      return false;
    }
    const membership = members.find((row) => row.userId === viewerId) ?? null;
    const isMember = membership !== null;
    let viewerFollowsOwner = false;
    if (community.visibility === 'followers' && viewerId !== ownerUserId && membership === null) {
      viewerFollowsOwner = await this.follows.exists(viewerId, ownerUserId);
    }
    return canViewerReadCommunity(
      community.visibility,
      ownerUserId,
      viewerId,
      isMember,
      viewerFollowsOwner,
    );
  }

  private async canReadComment(commentId: string, viewerId: string): Promise<boolean> {
    const comment = await this.comments.findById(commentId);
    if (comment == null || comment.deletedAt != null) {
      return false;
    }
    switch (comment.hostType) {
      case 'post':
        return this.canReadPost(comment.hostId, viewerId);
      case 'review':
        return this.canReadReview(comment.hostId, viewerId);
      case 'collection':
        return this.canReadCollection(comment.hostId, viewerId);
      case 'tier_list':
        return this.canReadTierList(comment.hostId, viewerId);
      default: {
        const _exhaustive: never = comment.hostType;
        return _exhaustive;
      }
    }
  }

  private async canReadUser(userId: string): Promise<boolean> {
    const user = await this.users.findById(userId);
    return user != null && user.deletedAt == null;
  }
}

function encodeCursor(cursor: ActivityListCursor): string {
  const payload = `${cursor.occurredAt.toISOString()}|${cursor.id}`;
  return Buffer.from(payload, 'utf8').toString('base64url');
}

function decodeCursor(raw: string): ActivityListCursor {
  let decoded: string;
  try {
    decoded = Buffer.from(raw, 'base64url').toString('utf8');
  } catch {
    throw new BadRequestException('Invalid cursor');
  }
  const separator = decoded.indexOf('|');
  if (separator <= 0) {
    throw new BadRequestException('Invalid cursor');
  }
  const occurredAtRaw = decoded.slice(0, separator);
  const id = decoded.slice(separator + 1);
  const occurredAt = new Date(occurredAtRaw);
  if (Number.isNaN(occurredAt.getTime()) || id.length === 0) {
    throw new BadRequestException('Invalid cursor');
  }
  return { occurredAt, id };
}

function ageHoursProxy(occurredAtIso: string): number {
  return Math.max((Date.now() - new Date(occurredAtIso).getTime()) / 3_600_000, 0);
}

function encodeOpaqueIdCursor(id: string): string {
  return Buffer.from(id, 'utf8').toString('base64url');
}

function decodeOpaqueIdCursor(raw: string): string {
  let decoded: string;
  try {
    decoded = Buffer.from(raw, 'base64url').toString('utf8');
  } catch {
    throw new BadRequestException('Invalid cursor');
  }
  if (decoded.length === 0) {
    throw new BadRequestException('Invalid cursor');
  }
  return decoded;
}
