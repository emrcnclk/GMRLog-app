import type {
  BlockRepository,
  CollectionRepository,
  Community,
  CommunityMemberRepository,
  CommunityRepository,
  Event,
  EventParticipationRepository,
  EventRepository,
  FollowRepository,
  Game,
  GameRepository,
  LibraryEntry,
  LibraryEntryRepository,
  Post,
  PostKind,
  PostRepository,
  Review,
  ReviewRepository,
  TierListRepository,
  User,
  UserRepository,
} from '@gmrlog/database';
import type {
  EventResponse,
  FeedItemResponse,
  GameHubCollectionSummaryResponse,
  GameHubCommunitySummaryResponse,
  GameHubPlayerResponse,
  GameHubResponse,
  GameHubTierListSummaryResponse,
  PostResponse,
} from '@gmrlog/types';
import { ACTIVITY_LIST_DEFAULT_LIMIT, type GameHubFeedQueryInput } from '@gmrlog/validators';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { isAuthenticatedIdentity, type RequestIdentity } from '../auth/interfaces/identity';
import { BLOCK_REPOSITORY } from '../blocks/blocks.tokens';
import type { EventResponseExtras } from '../events/mappers/event.mapper';
import {
  loadEventResponseExtras,
  toEventParticipationSummary,
  toEventResponse,
} from '../events/mappers/event.mapper';
import { FOLLOW_REPOSITORY } from '../follows/follows.tokens';
import { PaginatedPayload } from '../infrastructure/http/paginated-payload';
import { canViewerReadPost, toPostResponse } from '../posts/mappers/post.mapper';
import { canViewerReadReview } from '../reviews/mappers/review.mapper';

import {
  GAME_HUB_COLLECTION_REPOSITORY,
  GAME_HUB_COMMUNITY_MEMBER_REPOSITORY,
  GAME_HUB_COMMUNITY_REPOSITORY,
  GAME_HUB_EVENT_PARTICIPATION_REPOSITORY,
  GAME_HUB_EVENT_REPOSITORY,
  GAME_HUB_GAME_REPOSITORY,
  GAME_HUB_LIBRARY_REPOSITORY,
  GAME_HUB_POST_REPOSITORY,
  GAME_HUB_REVIEW_REPOSITORY,
  GAME_HUB_TIER_LIST_REPOSITORY,
  GAME_HUB_USER_REPOSITORY,
} from './game-hub.tokens';
import {
  toGameHubCollectionSummary,
  toGameHubCommunitySummary,
  toGameHubEventFeedItem,
  toGameHubPlayerResponse,
  toGameHubPostFeedItem,
  toGameHubReviewFeedItem,
  toGameHubTierListSummary,
} from './mappers/game-hub.mapper';

interface GameHubCursor {
  occurredAt: string;
  id: string;
}

/**
 * Game Hub domain service (F6.3 / D3.24 GAME_HUB.md).
 * Composition facade only — no second source of truth. Every tab is projected
 * live from the existing Post · Review · Collection · TierList · Event ·
 * Community · LibraryEntry repositories, scoped by `gameId`.
 */
@Injectable()
export class GameHubService {
  constructor(
    @Inject(GAME_HUB_GAME_REPOSITORY) private readonly games: GameRepository,
    @Inject(GAME_HUB_POST_REPOSITORY) private readonly posts: PostRepository,
    @Inject(GAME_HUB_REVIEW_REPOSITORY) private readonly reviews: ReviewRepository,
    @Inject(GAME_HUB_COLLECTION_REPOSITORY) private readonly collections: CollectionRepository,
    @Inject(GAME_HUB_TIER_LIST_REPOSITORY) private readonly tierLists: TierListRepository,
    @Inject(GAME_HUB_EVENT_REPOSITORY) private readonly events: EventRepository,
    @Inject(GAME_HUB_EVENT_PARTICIPATION_REPOSITORY)
    private readonly eventParticipations: EventParticipationRepository,
    @Inject(GAME_HUB_COMMUNITY_REPOSITORY) private readonly communities: CommunityRepository,
    @Inject(GAME_HUB_COMMUNITY_MEMBER_REPOSITORY)
    private readonly communityMembers: CommunityMemberRepository,
    @Inject(GAME_HUB_LIBRARY_REPOSITORY) private readonly library: LibraryEntryRepository,
    @Inject(GAME_HUB_USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(FOLLOW_REPOSITORY) private readonly follows: FollowRepository,
    @Inject(BLOCK_REPOSITORY) private readonly blocks: BlockRepository,
  ) {}

  /** `GET /games/:id/hub` — summary + tab counts (GAME_HUB.md § Hub tabs). */
  async getHub(gameId: string, identity: RequestIdentity): Promise<GameHubResponse> {
    const game = await this.requireGame(gameId);
    const viewerId = viewerIdOf(identity);

    const [
      readablePosts,
      reviewCount,
      collectionRows,
      tierListRows,
      eventRows,
      communityRows,
      libraryRows,
    ] = await Promise.all([
      this.readablePosts(gameId, viewerId),
      this.reviews.countByGame(gameId),
      this.collections.listPublicContainingGame(gameId),
      this.tierLists.listPublicContainingGame(gameId),
      this.events.listByGame(gameId),
      this.resolveCommunities(gameId, game),
      this.library.listByGame(gameId),
    ]);

    const readablePlayers = await this.excludeBlockedPairs(libraryRows, viewerId);

    return {
      gameId: game.id,
      title: game.title,
      tabCounts: {
        reviews: reviewCount,
        screenshots: readablePosts.filter((post) => post.postKind === 'screenshot').length,
        guides: readablePosts.filter((post) => post.postKind === 'guide').length,
        collections: collectionRows.length,
        tierLists: tierListRows.length,
        events: eventRows.length,
        communities: communityRows.length,
        players: readablePlayers.length,
      },
    };
  }

  /** `GET /games/:id/feed` — hybrid timeline (post_item + activity_item), cursor-paginated. */
  async getFeed(
    gameId: string,
    identity: RequestIdentity,
    query: GameHubFeedQueryInput = {},
  ): Promise<PaginatedPayload<FeedItemResponse>> {
    await this.requireGame(gameId);
    const viewerId = viewerIdOf(identity);
    const limit = query.limit ?? ACTIVITY_LIST_DEFAULT_LIMIT;
    const from = query.from !== undefined ? new Date(query.from) : undefined;
    const to = query.to !== undefined ? new Date(query.to) : undefined;
    const cursor = query.cursor !== undefined ? decodeGameHubCursor(query.cursor) : undefined;

    const [visiblePosts, visibleReviews, eventRows] = await Promise.all([
      this.readablePosts(gameId, viewerId),
      this.readableReviews(gameId, viewerId),
      this.events.listByGame(gameId),
    ]);

    const authorsById = await this.loadUsersById([
      ...visiblePosts.map((post) => post.authorId),
      ...visibleReviews.map((review) => review.authorId),
    ]);

    const items: FeedItemResponse[] = [];
    for (const post of visiblePosts) {
      const author = authorsById.get(post.authorId);
      if (author !== undefined) {
        items.push(toGameHubPostFeedItem(post, author));
      }
    }
    for (const review of visibleReviews) {
      const author = authorsById.get(review.authorId);
      if (author !== undefined) {
        items.push(toGameHubReviewFeedItem(review, author));
      }
    }
    for (const event of eventRows) {
      const host = await this.findEventHost(event.id);
      items.push(toGameHubEventFeedItem(event, host));
    }

    items.sort(compareFeedItemsDesc);

    const filtered = items.filter((item) => {
      const occurredAt = new Date(item.occurredAt);
      if (from !== undefined && occurredAt < from) {
        return false;
      }
      if (to !== undefined && occurredAt > to) {
        return false;
      }
      if (cursor !== undefined && !isOlderThanCursor(item, cursor)) {
        return false;
      }
      return true;
    });

    const hasMore = filtered.length > limit;
    const page = filtered.slice(0, limit);
    const last = page[page.length - 1];
    const next =
      hasMore && last !== undefined
        ? encodeGameHubCursor({ occurredAt: last.occurredAt, id: last.id })
        : null;

    return new PaginatedPayload(page, { next }, hasMore, limit);
  }

  /** `GET /games/:id/screenshots` — GAME_HUB.md tab (`postKind === 'screenshot'`). */
  listScreenshots(gameId: string, identity: RequestIdentity): Promise<PostResponse[]> {
    return this.listPostsByKind(gameId, identity, 'screenshot');
  }

  /** `GET /games/:id/guides` — GAME_HUB.md tab (`postKind === 'guide'`). */
  listGuides(gameId: string, identity: RequestIdentity): Promise<PostResponse[]> {
    return this.listPostsByKind(gameId, identity, 'guide');
  }

  /** `GET /games/:id/collections` — public collections that include the game. */
  async listCollections(gameId: string): Promise<GameHubCollectionSummaryResponse[]> {
    await this.requireGame(gameId);
    const rows = await this.collections.listPublicContainingGame(gameId);
    if (rows.length === 0) {
      return [];
    }
    const ownersById = await this.loadUsersById(rows.map((collection) => collection.ownerId));
    return rows.flatMap((collection) => {
      const owner = ownersById.get(collection.ownerId);
      return owner === undefined ? [] : [toGameHubCollectionSummary(collection, owner)];
    });
  }

  /** `GET /games/:id/tier-lists` — public tier lists that place the game in any slot. */
  async listTierLists(gameId: string): Promise<GameHubTierListSummaryResponse[]> {
    await this.requireGame(gameId);
    const rows = await this.tierLists.listPublicContainingGame(gameId);
    if (rows.length === 0) {
      return [];
    }
    const ownersById = await this.loadUsersById(rows.map((tierList) => tierList.ownerId));
    return rows.flatMap((tierList) => {
      const owner = ownersById.get(tierList.ownerId);
      return owner === undefined ? [] : [toGameHubTierListSummary(tierList, owner)];
    });
  }

  /** `GET /games/:id/events` — active events with `gameId`. */
  async listEvents(gameId: string, identity: RequestIdentity): Promise<EventResponse[]> {
    await this.requireGame(gameId);
    const rows = await this.events.listByGame(gameId);
    const viewerId = viewerIdOf(identity);
    const extrasByEvent = await loadEventResponseExtras(rows, {
      participations: this.eventParticipations,
      communities: this.communities,
    });
    return Promise.all(
      rows.map((event) => this.projectEvent(event, viewerId, extrasByEvent.get(event.id))),
    );
  }

  /** `GET /games/:id/communities` — name/tag heuristic union community posts about the game. */
  async listCommunities(gameId: string): Promise<GameHubCommunitySummaryResponse[]> {
    const game = await this.requireGame(gameId);
    const rows = await this.resolveCommunities(gameId, game);
    if (rows.length === 0) {
      return [];
    }
    const counts = await Promise.all(
      rows.map((community) => this.communityMembers.countByCommunity(community.id)),
    );
    return rows.map((community, index) => toGameHubCommunitySummary(community, counts[index] ?? 0));
  }

  /** `GET /games/:id/players` — library rows for the game (privacy-aware; block pairs excluded). */
  async listPlayers(gameId: string, identity: RequestIdentity): Promise<GameHubPlayerResponse[]> {
    await this.requireGame(gameId);
    const viewerId = viewerIdOf(identity);
    const rows = await this.excludeBlockedPairs(await this.library.listByGame(gameId), viewerId);
    if (rows.length === 0) {
      return [];
    }
    const usersById = await this.loadUsersById(rows.map((entry) => entry.userId));
    return rows.flatMap((entry) => {
      const user = usersById.get(entry.userId);
      return user === undefined ? [] : [toGameHubPlayerResponse(user, entry.status)];
    });
  }

  private async listPostsByKind(
    gameId: string,
    identity: RequestIdentity,
    postKind: PostKind,
  ): Promise<PostResponse[]> {
    const game = await this.requireGame(gameId);
    const viewerId = viewerIdOf(identity);
    const visible = (await this.readablePosts(gameId, viewerId)).filter(
      (post) => post.postKind === postKind,
    );
    if (visible.length === 0) {
      return [];
    }
    const authorsById = await this.loadUsersById(visible.map((post) => post.authorId));
    return visible.flatMap((post) => {
      const author = authorsById.get(post.authorId);
      return author === undefined ? [] : [toPostResponse(post, author, game)];
    });
  }

  private async projectEvent(
    event: Event,
    viewerId: string | null,
    extras?: EventResponseExtras,
  ): Promise<EventResponse> {
    if (viewerId === null) {
      return toEventResponse(event, null, extras);
    }
    const participation = await this.eventParticipations.findByEventAndUser(event.id, viewerId);
    return toEventResponse(
      event,
      participation !== null ? toEventParticipationSummary(participation) : null,
      extras,
    );
  }

  private async findEventHost(eventId: string): Promise<User | null> {
    const participations = await this.eventParticipations.listByEvent(eventId);
    const hosting = participations.find((participation) => participation.state === 'hosting');
    if (hosting === undefined) {
      return null;
    }
    return this.users.findById(hosting.userId);
  }

  /** GAME_HUB.md § Communities — name/tag heuristic OR communities with posts about the game. */
  private async resolveCommunities(gameId: string, game: Game): Promise<Community[]> {
    const [byNameOrTag, gamePosts] = await Promise.all([
      this.communities.searchByName(game.title),
      this.posts.listByGame(gameId),
    ]);
    const communityIdsFromPosts = [
      ...new Set(gamePosts.flatMap((post) => (post.communityId != null ? [post.communityId] : []))),
    ];
    const byPosts = await this.communities.findManyByIds(communityIdsFromPosts);
    const merged = new Map<string, Community>();
    for (const community of byNameOrTag) {
      merged.set(community.id, community);
    }
    for (const community of byPosts) {
      merged.set(community.id, community);
    }
    return [...merged.values()];
  }

  private async readablePosts(gameId: string, viewerId: string | null): Promise<Post[]> {
    const rows = await this.posts.listByGame(gameId);
    const visible: Post[] = [];
    for (const post of rows) {
      if (await this.isPostReadable(post, viewerId)) {
        visible.push(post);
      }
    }
    return visible;
  }

  private async isPostReadable(post: Post, viewerId: string | null): Promise<boolean> {
    let viewerFollowsAuthor = false;
    if (post.visibility === 'followers' && viewerId != null && viewerId !== post.authorId) {
      viewerFollowsAuthor = await this.follows.exists(viewerId, post.authorId);
    }
    return canViewerReadPost(post.visibility, post.authorId, viewerId, viewerFollowsAuthor);
  }

  private async readableReviews(gameId: string, viewerId: string | null): Promise<Review[]> {
    const rows = await this.reviews.listByGame(gameId);
    const visible: Review[] = [];
    for (const review of rows) {
      if (await this.isReviewReadable(review, viewerId)) {
        visible.push(review);
      }
    }
    return visible;
  }

  private async isReviewReadable(review: Review, viewerId: string | null): Promise<boolean> {
    let viewerFollowsAuthor = false;
    if (review.visibility === 'followers' && viewerId != null && viewerId !== review.authorId) {
      viewerFollowsAuthor = await this.follows.exists(viewerId, review.authorId);
    }
    return canViewerReadReview(review.visibility, review.authorId, viewerId, viewerFollowsAuthor);
  }

  private async excludeBlockedPairs(
    rows: LibraryEntry[],
    viewerId: string | null,
  ): Promise<LibraryEntry[]> {
    if (viewerId === null) {
      return rows;
    }
    const blockedIds = new Set(await this.blocks.listBlockedPairIds(viewerId));
    if (blockedIds.size === 0) {
      return rows;
    }
    return rows.filter((row) => !blockedIds.has(row.userId));
  }

  private async loadUsersById(userIds: string[]): Promise<Map<string, User>> {
    const unique = [...new Set(userIds)];
    if (unique.length === 0) {
      return new Map();
    }
    const loaded = await this.users.findManyByIds(unique);
    return new Map(loaded.filter((user) => user.deletedAt == null).map((user) => [user.id, user]));
  }

  private async requireGame(gameId: string): Promise<Game> {
    const game = await this.games.findById(gameId);
    if (game === null) {
      throw new NotFoundException('Game not found');
    }
    return game;
  }
}

function viewerIdOf(identity: RequestIdentity): string | null {
  return isAuthenticatedIdentity(identity) ? identity.userId : null;
}

function compareFeedItemsDesc(a: FeedItemResponse, b: FeedItemResponse): number {
  if (a.occurredAt !== b.occurredAt) {
    return a.occurredAt < b.occurredAt ? 1 : -1;
  }
  return a.id < b.id ? 1 : -1;
}

function isOlderThanCursor(item: FeedItemResponse, cursor: GameHubCursor): boolean {
  if (item.occurredAt !== cursor.occurredAt) {
    return item.occurredAt < cursor.occurredAt;
  }
  return item.id < cursor.id;
}

function encodeGameHubCursor(cursor: GameHubCursor): string {
  return Buffer.from(`${cursor.occurredAt}|${cursor.id}`, 'utf8').toString('base64url');
}

function decodeGameHubCursor(raw: string): GameHubCursor {
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
  const occurredAt = decoded.slice(0, separator);
  const id = decoded.slice(separator + 1);
  if (Number.isNaN(Date.parse(occurredAt)) || id.length === 0) {
    throw new BadRequestException('Invalid cursor');
  }
  return { occurredAt, id };
}
