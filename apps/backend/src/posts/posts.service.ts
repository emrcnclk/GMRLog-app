import type {
  CommunityMemberRepository,
  CommunityRepository,
  FollowRepository,
  Game,
  GameRepository,
  NotificationRepository,
  Poll,
  PollRepository,
  PollVoteRepository,
  Post,
  PostBookmark,
  PostBookmarkRepository,
  PostRepository,
  Prisma,
  Repost,
  RepostRepository,
  User,
  UserRepository,
} from '@gmrlog/database';
import type {
  BookmarkResponse,
  PollOptionResponse,
  PollResponse,
  PostResponse,
  RepostResponse,
} from '@gmrlog/types';
import {
  BOOKMARK_LIST_DEFAULT_LIMIT,
  type BookmarkListQueryInput,
  type PostCreateInput,
  type PostPatchInput,
} from '@gmrlog/validators';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';

import { isAuthenticatedIdentity, type RequestIdentity } from '../auth/interfaces/identity';
import { CommunitiesService } from '../communities/communities.service';
import { FOLLOW_REPOSITORY } from '../follows/follows.tokens';
import { PaginatedPayload } from '../infrastructure/http/paginated-payload';
import { FeedFanoutPublisher } from '../infrastructure/jobs/feed-fanout.publisher';
import { SearchIndexPublisher } from '../infrastructure/jobs/search-index.publisher';
import { FeedCacheService } from '../infrastructure/redis/feed-cache.service';
import { notifyMentions } from '../notifications/notify-mentions';

import { canViewerReadPost, toPostResponse, toUserPublicResponse } from './mappers/post.mapper';
import {
  POST_BOOKMARK_REPOSITORY,
  POST_COMMUNITY_MEMBER_REPOSITORY,
  POST_COMMUNITY_REPOSITORY,
  POST_GAME_REPOSITORY,
  POST_NOTIFICATION_REPOSITORY,
  POST_POLL_REPOSITORY,
  POST_POLL_VOTE_REPOSITORY,
  POST_REPOSITORY,
  POST_REPOST_REPOSITORY,
  POST_USER_REPOSITORY,
} from './posts.tokens';

const NOTIFICATION_KIND_REPOST = 'repost';

/**
 * Post domain service (F6.3 / D2.7 · D3.18 · D3.24). Owns post CRUD, soft-delete,
 * visibility gating, optional game · community association, and the D3.24 social
 * action surface (repost · bookmark · pin · poll). Media attachments remain
 * deferred until S2 post-media storage exists.
 */
@Injectable()
export class PostsService {
  constructor(
    @Inject(POST_REPOSITORY) private readonly posts: PostRepository,
    @Inject(POST_GAME_REPOSITORY) private readonly games: GameRepository,
    @Inject(POST_USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(FOLLOW_REPOSITORY) private readonly follows: FollowRepository,
    @Inject(POST_COMMUNITY_REPOSITORY) private readonly communities: CommunityRepository,
    @Inject(POST_COMMUNITY_MEMBER_REPOSITORY)
    private readonly communityMembers: CommunityMemberRepository,
    private readonly feedFanout: FeedFanoutPublisher,
    private readonly searchIndex: SearchIndexPublisher,
    @Inject(POST_REPOST_REPOSITORY) private readonly reposts: RepostRepository,
    @Inject(POST_POLL_REPOSITORY) private readonly polls: PollRepository,
    @Inject(POST_POLL_VOTE_REPOSITORY) private readonly pollVotes: PollVoteRepository,
    @Inject(POST_BOOKMARK_REPOSITORY) private readonly bookmarks: PostBookmarkRepository,
    @Inject(POST_NOTIFICATION_REPOSITORY) private readonly notifications: NotificationRepository,
    @Optional() private readonly feedCache: FeedCacheService | null = null,
    /** D3.24 COMMUNITIES_2.md Top Contributor — recompute after a community post. */
    @Optional() private readonly communityBadges: CommunitiesService | null = null,
  ) {}

  async getPost(postId: string, identity: RequestIdentity): Promise<PostResponse> {
    const post = await this.requireActivePost(postId);
    await this.assertReadable(post, identity);
    return this.project(post, viewerIdOf(identity));
  }

  async listGamePosts(gameId: string, identity: RequestIdentity): Promise<PostResponse[]> {
    await this.requireGame(gameId);
    const rows = await this.posts.listByGame(gameId);
    const viewerId = viewerIdOf(identity);
    const visible: Post[] = [];
    for (const post of rows) {
      if (await this.isReadable(post.visibility, post.authorId, viewerId)) {
        visible.push(post);
      }
    }
    if (visible.length === 0) {
      return [];
    }
    const authorsById = await this.loadUsersById(visible.map((row) => row.authorId));
    const game = await this.games.findById(gameId);
    return visible.map((row) =>
      toPostResponse(row, this.requireLoadedUser(authorsById, row.authorId), game ?? undefined),
    );
  }

  async createPost(authorId: string, input: PostCreateInput): Promise<PostResponse> {
    this.rejectDeferredMedia(input.mediaUploadIds);

    if (input.gameId !== undefined) {
      await this.requireGame(input.gameId);
    }
    if (input.communityId !== undefined) {
      await this.requireMembershipCommunity(input.communityId, authorId);
    }
    if (input.postKind === 'poll' && input.poll === undefined) {
      throw new BadRequestException('postKind "poll" requires a poll payload');
    }

    const created = await this.posts.create({
      author: { connect: { id: authorId } },
      body: input.body,
      visibility: input.visibility ?? 'public',
      ...(input.postKind !== undefined ? { postKind: input.postKind } : {}),
      ...(input.containsSpoilers !== undefined ? { containsSpoilers: input.containsSpoilers } : {}),
      ...(input.gameId !== undefined ? { game: { connect: { id: input.gameId } } } : {}),
      ...(input.communityId !== undefined
        ? { community: { connect: { id: input.communityId } } }
        : {}),
    });

    if (input.poll !== undefined) {
      await this.polls.create({
        post: { connect: { id: created.id } },
        question: input.poll.question,
        options: input.poll.options,
        ...(input.poll.endsAt !== undefined ? { endsAt: new Date(input.poll.endsAt) } : {}),
      });
    }

    await this.writePostActivity(authorId, created);
    await this.searchIndex.publishUpsert('post', created.id);
    await notifyMentions({
      body: created.body,
      actorId: authorId,
      objectType: 'post',
      objectId: created.id,
      users: this.users,
      notifications: this.notifications,
    });
    if (created.communityId != null) {
      await this.communityBadges?.syncBadgesForCommunity(created.communityId);
    }
    return this.project(created, authorId);
  }

  /** D3.24 SOCIAL_ACTIONS — amplify without body. Idempotent per (actor, post). */
  async repostPost(actorId: string, postId: string): Promise<RepostResponse> {
    const post = await this.requireActivePost(postId);
    const existing = await this.reposts.findActiveByActorAndPost(actorId, postId);
    if (existing !== null) {
      throw new ConflictException('Post already reposted');
    }
    const created = await this.reposts.create({
      actor: { connect: { id: actorId } },
      originalPost: { connect: { id: postId } },
    });
    if (post.authorId !== actorId) {
      await this.notifications.create({
        recipient: { connect: { id: post.authorId } },
        kind: NOTIFICATION_KIND_REPOST,
        objectType: 'post',
        objectId: postId,
      });
    }
    const actor = await this.requireUser(actorId);
    return this.toRepostResponse(created, actor);
  }

  /** Un-repost — soft delete only, never a hard row delete (audit trail). */
  async undoRepost(actorId: string, postId: string): Promise<void> {
    const existing = await this.reposts.findActiveByActorAndPost(actorId, postId);
    if (existing === null) {
      throw new NotFoundException('Repost not found');
    }
    await this.reposts.softDelete(existing.id);
  }

  /** D3.24 SOCIAL_ACTIONS — 1 pinned post per user on profile; clears any other. */
  async pinPost(actorId: string, postId: string): Promise<PostResponse> {
    const post = await this.requireActivePost(postId);
    this.assertAuthor(post, actorId);

    const currentlyPinned = await this.posts.findPinnedByAuthor(actorId);
    if (currentlyPinned !== null && currentlyPinned.id !== post.id) {
      await this.posts.update(currentlyPinned.id, { pinnedAt: null });
    }
    const updated = await this.posts.update(post.id, { pinnedAt: new Date() });
    // Profile pin is self-owned; notify followers is engagement-farm — skip.
    // Community pins notify content owners separately.
    return this.project(updated, actorId);
  }

  async unpinPost(actorId: string, postId: string): Promise<PostResponse> {
    const post = await this.requireActivePost(postId);
    this.assertAuthor(post, actorId);
    const updated = await this.posts.update(post.id, { pinnedAt: null });
    return this.project(updated, actorId);
  }

  /**
   * D3.24 SOCIAL_ACTIONS — private save. Idempotent per (actor, post);
   * never notifies the author (`NOTIFICATION_MATRIX.md` — default OFF).
   */
  async bookmarkPost(actorId: string, postId: string): Promise<BookmarkResponse> {
    const post = await this.requireActivePost(postId);
    if (!(await this.isReadable(post.visibility, post.authorId, actorId))) {
      throw new NotFoundException('Post not found');
    }
    const existing = await this.bookmarks.findByUserAndPost(actorId, postId);
    if (existing !== null) {
      return this.toBookmarkResponse(existing);
    }
    const created = await this.bookmarks.create({
      user: { connect: { id: actorId } },
      post: { connect: { id: postId } },
    });
    return this.toBookmarkResponse(created);
  }

  async unbookmarkPost(actorId: string, postId: string): Promise<void> {
    const deleted = await this.bookmarks.deleteByUserAndPost(actorId, postId);
    if (deleted === null) {
      throw new NotFoundException('Bookmark not found');
    }
  }

  /** D3.24 SOCIAL_ACTIONS — `GET /bookmarks`, private and viewer-owned only. */
  async listBookmarks(
    actorId: string,
    query: BookmarkListQueryInput = {},
  ): Promise<PaginatedPayload<BookmarkResponse>> {
    const limit = query.limit ?? BOOKMARK_LIST_DEFAULT_LIMIT;
    const cursor = query.cursor !== undefined ? decodeBookmarkCursor(query.cursor) : undefined;
    const rows = await this.bookmarks.listByUser(actorId, {
      limit: limit + 1,
      ...(cursor !== undefined ? { cursor } : {}),
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const next =
      hasMore && last !== undefined
        ? encodeBookmarkCursor({ createdAt: last.createdAt, id: last.id })
        : null;
    return new PaginatedPayload(
      page.map((row) => this.toBookmarkResponse(row)),
      { next },
      hasMore,
      limit,
    );
  }

  /**
   * D3.24 Composer++ — one vote per user (`poll_votes` unique constraint);
   * rejected once `endsAt` has elapsed. Returns the aggregated poll.
   */
  async votePoll(actorId: string, postId: string, optionIndex: number): Promise<PollResponse> {
    const post = await this.requireActivePost(postId);
    if (!(await this.isReadable(post.visibility, post.authorId, actorId))) {
      throw new NotFoundException('Post not found');
    }
    const poll = await this.polls.findByPostId(postId);
    if (poll === null) {
      throw new NotFoundException('Poll not found');
    }
    if (poll.endsAt !== null && poll.endsAt.getTime() <= Date.now()) {
      throw new BadRequestException('Poll is closed');
    }
    if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= poll.options.length) {
      throw new BadRequestException('Invalid poll option');
    }
    const existingVote = await this.pollVotes.findByPollAndUser(poll.id, actorId);
    if (existingVote !== null) {
      throw new ConflictException('Already voted on this poll');
    }
    await this.pollVotes.create({
      poll: { connect: { id: poll.id } },
      user: { connect: { id: actorId } },
      optionIndex,
    });
    return this.buildPollResponse(poll, actorId);
  }

  /** D3.24 Composer++ — author early-close; sets `endsAt` to now (idempotent). */
  async closePoll(actorId: string, postId: string): Promise<PollResponse> {
    const post = await this.requireActivePost(postId);
    this.assertAuthor(post, actorId);
    const poll = await this.polls.findByPostId(postId);
    if (poll === null) {
      throw new NotFoundException('Poll not found');
    }
    if (poll.endsAt !== null && poll.endsAt.getTime() <= Date.now()) {
      return this.buildPollResponse(poll, actorId);
    }
    const closed = await this.polls.update(poll.id, { endsAt: new Date() });
    return this.buildPollResponse(closed, actorId);
  }

  /** D3.24 — poll results for a readable post (aggregation SoT). */
  async getPoll(viewerId: string | null, postId: string): Promise<PollResponse> {
    const post = await this.requireActivePost(postId);
    if (!(await this.isReadable(post.visibility, post.authorId, viewerId))) {
      throw new NotFoundException('Post not found');
    }
    const poll = await this.polls.findByPostId(postId);
    if (poll === null) {
      throw new NotFoundException('Poll not found');
    }
    return this.buildPollResponse(poll, viewerId);
  }

  private toBookmarkResponse(bookmark: PostBookmark): BookmarkResponse {
    return {
      id: bookmark.id,
      postId: bookmark.postId,
      createdAt: bookmark.createdAt.toISOString(),
    };
  }

  /** Results visibility = post visibility (`SOCIAL_POSTS_V2.md` § Polls). */
  private async buildPollResponse(poll: Poll, viewerId: string | null): Promise<PollResponse> {
    const counts = await this.pollVotes.countByOption(poll.id);
    const options: PollOptionResponse[] = poll.options.map((label, index) => ({
      index,
      label,
      voteCount: counts.get(index) ?? 0,
    }));
    const totalVotes = options.reduce((sum, option) => sum + option.voteCount, 0);
    const viewerVote =
      viewerId !== null ? await this.pollVotes.findByPollAndUser(poll.id, viewerId) : null;
    return {
      id: poll.id,
      postId: poll.postId,
      question: poll.question,
      options,
      endsAt: poll.endsAt !== null ? poll.endsAt.toISOString() : null,
      viewerVoteIndex: viewerVote !== null ? viewerVote.optionIndex : null,
      totalVotes,
    };
  }

  private toRepostResponse(repost: Repost, actor: User): RepostResponse {
    return {
      id: repost.id,
      actor: toUserPublicResponse(actor),
      originalPostId: repost.originalPostId,
      createdAt: repost.createdAt.toISOString(),
    };
  }

  async updatePost(postId: string, actorId: string, input: PostPatchInput): Promise<PostResponse> {
    const post = await this.requireActivePost(postId);
    this.assertAuthor(post, actorId);
    this.rejectDeferredMedia(input.mediaUploadIds);

    const data: Prisma.PostUpdateInput = {};
    if (input.body !== undefined) {
      data.body = input.body;
    }
    if (input.visibility !== undefined) {
      data.visibility = input.visibility;
    }
    if (input.gameId !== undefined) {
      if (input.gameId === null) {
        data.game = { disconnect: true };
      } else {
        await this.requireGame(input.gameId);
        data.game = { connect: { id: input.gameId } };
      }
    }
    if (input.communityId !== undefined) {
      if (input.communityId === null) {
        data.community = { disconnect: true };
      } else {
        await this.requireMembershipCommunity(input.communityId, actorId);
        data.community = { connect: { id: input.communityId } };
      }
    }

    if (Object.keys(data).length === 0) {
      return this.project(post, actorId);
    }

    const updated = await this.posts.update(post.id, data);
    await this.searchIndex.publishUpsert('post', updated.id);
    return this.project(updated, actorId);
  }

  /** S2 §13 — soft-delete. Comments remain; no cascade here. */
  async deletePost(postId: string, actorId: string): Promise<void> {
    const post = await this.requireActivePost(postId);
    this.assertAuthor(post, actorId);
    await this.posts.softDelete(post.id);
    await this.searchIndex.publishDelete('post', post.id);
  }

  /**
   * Post media requires S2 attachment storage (UploadPurpose `post_media` exists;
   * Post has no media fields). Fail honestly until amended.
   */
  private rejectDeferredMedia(mediaUploadIds: string[] | undefined): void {
    if (mediaUploadIds !== undefined && mediaUploadIds.length > 0) {
      throw new BadRequestException('Referenced upload is not a confirmed upload');
    }
  }

  private async writePostActivity(authorId: string, created: Post): Promise<void> {
    await this.feedFanout.publish({
      kind: 'post',
      objectId: created.id,
      actorId: authorId,
      occurredAt: created.createdAt,
      ...(created.communityId != null ? { communityId: created.communityId } : {}),
    });
    if (this.feedCache !== null) {
      await this.feedCache.invalidateHome(authorId);
      if (created.gameId != null) {
        await this.feedCache.invalidateGame(created.gameId);
      }
      if (created.communityId != null) {
        await this.feedCache.invalidateCommunity(created.communityId);
      }
    }
  }

  private async requireMembershipCommunity(communityId: string, actorId: string): Promise<void> {
    const community = await this.communities.findActiveById(communityId);
    if (community == null) {
      throw new NotFoundException('Community not found');
    }
    const membership = await this.communityMembers.findByCommunityAndUser(communityId, actorId);
    if (membership == null) {
      throw new ForbiddenException('Must be a community member to associate a post');
    }
  }

  /** `viewerId` drives `poll.viewerVoteIndex` — omitted for anonymous/unrelated projections. */
  private async project(post: Post, viewerId: string | null = null): Promise<PostResponse> {
    const [author, game] = await Promise.all([
      this.requireUser(post.authorId),
      post.gameId != null ? this.games.findById(post.gameId) : Promise.resolve(null),
    ]);
    const base = toPostResponse(post, author, game ?? undefined);
    if (post.postKind !== 'poll') {
      return base;
    }
    const poll = await this.polls.findByPostId(post.id);
    if (poll === null) {
      return base;
    }
    return { ...base, poll: await this.buildPollResponse(poll, viewerId) };
  }

  private async requireActivePost(postId: string): Promise<Post> {
    const post = await this.posts.findActiveById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  private async requireGame(gameId: string): Promise<Game> {
    const game = await this.games.findById(gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    return game;
  }

  private async requireUser(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (user == null || user.deletedAt != null) {
      throw new NotFoundException('Author not found');
    }
    return user;
  }

  private async loadUsersById(userIds: string[]): Promise<Map<string, User>> {
    const unique = [...new Set(userIds)];
    const loaded = await this.users.findManyByIds(unique);
    return new Map(loaded.map((user) => [user.id, user]));
  }

  private requireLoadedUser(usersById: Map<string, User>, userId: string): User {
    const user = usersById.get(userId);
    if (!user) {
      throw new NotFoundException('Author not found');
    }
    return user;
  }

  private assertAuthor(post: Post, actorId: string): void {
    if (post.authorId !== actorId) {
      throw new ForbiddenException('Only the author may modify this post');
    }
  }

  private async assertReadable(post: Post, identity: RequestIdentity): Promise<void> {
    if (!(await this.isReadable(post.visibility, post.authorId, viewerIdOf(identity)))) {
      throw new NotFoundException('Post not found');
    }
  }

  private async isReadable(
    visibility: Post['visibility'],
    authorId: string,
    viewerId: string | null,
  ): Promise<boolean> {
    let viewerFollowsAuthor = false;
    if (visibility === 'followers' && viewerId != null && viewerId !== authorId) {
      viewerFollowsAuthor = await this.follows.exists(viewerId, authorId);
    }
    return canViewerReadPost(visibility, authorId, viewerId, viewerFollowsAuthor);
  }
}

function viewerIdOf(identity: RequestIdentity): string | null {
  return isAuthenticatedIdentity(identity) ? identity.userId : null;
}

interface BookmarkListCursor {
  createdAt: Date;
  id: string;
}

function encodeBookmarkCursor(cursor: BookmarkListCursor): string {
  const payload = `${cursor.createdAt.toISOString()}|${cursor.id}`;
  return Buffer.from(payload, 'utf8').toString('base64url');
}

function decodeBookmarkCursor(raw: string): BookmarkListCursor {
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
  const createdAtRaw = decoded.slice(0, separator);
  const id = decoded.slice(separator + 1);
  const createdAt = new Date(createdAtRaw);
  if (Number.isNaN(createdAt.getTime()) || id.length === 0) {
    throw new BadRequestException('Invalid cursor');
  }
  return { createdAt, id };
}
