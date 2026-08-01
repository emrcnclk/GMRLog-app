import type {
  ActivityFeedRow,
  ActivityListCursor,
  ActivityRepository,
  BlockRepository,
  FollowRepository,
  FriendRequest,
  Friendship,
  FriendshipRepository,
  NotificationRepository,
  PresenceRepository,
  User,
  UserRepository,
} from '@gmrlog/database';
import type {
  ActivityItemResponse,
  FriendRequestResponse,
  FriendshipResponse,
  OnlineFriendResponse,
  PresenceResponse,
  UserPublicResponse,
  UserRelationshipResponse,
} from '@gmrlog/types';
import type {
  ActivityQueryInput,
  FriendRequestCreateInput,
  FriendsListQueryInput,
  FriendsSearchQueryInput,
  PresenceUpdateInput,
} from '@gmrlog/validators';
import { ACTIVITY_LIST_DEFAULT_LIMIT, FRIENDS_LIST_DEFAULT_LIMIT } from '@gmrlog/validators';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';

import { AchievementsService } from '../achievements/achievements.service';
import { toActivityItemResponse } from '../activity/mappers/activity.mapper';
import { PaginatedPayload } from '../infrastructure/http/paginated-payload';

import {
  FRIENDS_ACTIVITY_REPOSITORY,
  FRIENDS_BLOCK_REPOSITORY,
  FRIENDS_FOLLOW_REPOSITORY,
  FRIENDS_NOTIFICATION_REPOSITORY,
  FRIENDS_USER_REPOSITORY,
  FRIENDSHIP_REPOSITORY,
  PRESENCE_REPOSITORY,
} from './friends.tokens';
import {
  friendIdOf,
  toFriendRequestResponse,
  toFriendshipResponse,
  toOfflinePresenceResponse,
  toOnlineFriendResponse,
  toPresenceResponse,
  toUserPublicResponse,
} from './mappers/friend.mapper';

const NOTIFICATION_KIND_FRIEND_REQUEST = 'friend_request';
const NOTIFICATION_KIND_FRIEND_ACCEPTED = 'friend_accepted';

/**
 * Friends + presence domain (D3.21 / SOCIAL_API).
 * Requests · friendships · relationship projection · presence stub · friend activity.
 */
@Injectable()
export class FriendsService {
  private readonly logger = new Logger(FriendsService.name);

  constructor(
    @Inject(FRIENDSHIP_REPOSITORY) private readonly friendships: FriendshipRepository,
    @Inject(PRESENCE_REPOSITORY) private readonly presence: PresenceRepository,
    @Inject(FRIENDS_USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(FRIENDS_BLOCK_REPOSITORY) private readonly blocks: BlockRepository,
    @Inject(FRIENDS_FOLLOW_REPOSITORY) private readonly follows: FollowRepository,
    @Inject(FRIENDS_NOTIFICATION_REPOSITORY)
    private readonly notifications: NotificationRepository,
    @Inject(FRIENDS_ACTIVITY_REPOSITORY) private readonly activity: ActivityRepository,
    @Optional() private readonly achievements?: AchievementsService,
  ) {}

  async sendFriendRequest(
    actorId: string,
    receiverId: string,
    input: FriendRequestCreateInput = {},
  ): Promise<FriendRequestResponse> {
    if (actorId === receiverId) {
      throw new BadRequestException('Cannot send a friend request to yourself');
    }

    const receiver = await this.requireActiveUser(receiverId);
    await this.requireActiveUser(actorId);
    await this.assertNotBlocked(actorId, receiverId);

    const existingFriendship = await this.friendships.findFriendship(actorId, receiverId);
    if (existingFriendship != null) {
      throw new ConflictException('Already friends with this user');
    }

    const pendingOut = await this.friendships.findPendingBetween(actorId, receiverId);
    if (pendingOut != null) {
      throw new ConflictException('Friend request already pending');
    }
    const pendingIn = await this.friendships.findPendingBetween(receiverId, actorId);
    if (pendingIn != null) {
      throw new ConflictException('Friend request already pending');
    }

    const created = await this.friendships.createRequest({
      sender: { connect: { id: actorId } },
      receiver: { connect: { id: receiverId } },
      ...(input.message !== undefined ? { message: input.message } : {}),
    });

    await this.notifications.create({
      recipient: { connect: { id: receiverId } },
      kind: NOTIFICATION_KIND_FRIEND_REQUEST,
      objectType: 'user',
      objectId: actorId,
    });

    const sender = await this.requireActiveUser(actorId);
    return toFriendRequestResponse(created, sender, receiver);
  }

  async listIncomingRequests(
    actorId: string,
    query: FriendsListQueryInput = {},
  ): Promise<PaginatedPayload<FriendRequestResponse>> {
    await this.requireActiveUser(actorId);
    const limit = query.limit ?? FRIENDS_LIST_DEFAULT_LIMIT;
    const cursor = query.cursor !== undefined ? decodeCreatedAtCursor(query.cursor) : undefined;
    const rows = await this.friendships.listIncoming(actorId, {
      limit: limit + 1,
      ...(cursor !== undefined ? { cursor } : {}),
    });
    return this.pageFriendRequests(rows, limit);
  }

  async acceptFriendRequest(actorId: string, requestId: string): Promise<void> {
    const request = await this.requirePendingRequest(requestId);
    if (request.receiverId !== actorId) {
      throw new ForbiddenException('Only the receiver can accept this friend request');
    }

    await this.assertNotBlocked(actorId, request.senderId);

    const existingFriendship = await this.friendships.findFriendship(
      request.senderId,
      request.receiverId,
    );
    if (existingFriendship == null) {
      await this.friendships.createFriendship(request.senderId, request.receiverId);
    }

    const now = new Date();
    await this.friendships.updateRequest(request.id, {
      status: 'accepted',
      respondedAt: now,
    });

    const reversePending = await this.friendships.findPendingBetween(
      request.receiverId,
      request.senderId,
    );
    if (reversePending != null) {
      await this.friendships.updateRequest(reversePending.id, {
        status: 'cancelled',
        respondedAt: now,
      });
    }

    await this.notifications.create({
      recipient: { connect: { id: request.senderId } },
      kind: NOTIFICATION_KIND_FRIEND_ACCEPTED,
      objectType: 'user',
      objectId: actorId,
    });

    await this.activity.create({
      kind: 'friend',
      actor: { connect: { id: actorId } },
      objectType: 'user',
      objectId: request.senderId,
      occurredAt: now,
    });

    await this.refreshAchievements(request.senderId);
    await this.refreshAchievements(request.receiverId);
  }

  private async refreshAchievements(userId: string): Promise<void> {
    if (this.achievements == null) {
      return;
    }
    try {
      await this.achievements.recalculate(userId);
    } catch (error: unknown) {
      this.logger.warn(
        `Achievement recalculation after friendship failed for ${userId}: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
    }
  }

  async rejectFriendRequest(actorId: string, requestId: string): Promise<void> {
    const request = await this.requirePendingRequest(requestId);
    if (request.receiverId !== actorId) {
      throw new ForbiddenException('Only the receiver can reject this friend request');
    }
    await this.friendships.updateRequest(request.id, {
      status: 'rejected',
      respondedAt: new Date(),
    });
  }

  async cancelFriendRequest(actorId: string, requestId: string): Promise<void> {
    const request = await this.requirePendingRequest(requestId);
    if (request.senderId !== actorId) {
      throw new ForbiddenException('Only the sender can cancel this friend request');
    }
    await this.friendships.updateRequest(request.id, {
      status: 'cancelled',
      respondedAt: new Date(),
    });
  }

  async listFriends(
    actorId: string,
    query: FriendsListQueryInput = {},
  ): Promise<PaginatedPayload<FriendshipResponse>> {
    await this.requireActiveUser(actorId);
    const limit = query.limit ?? FRIENDS_LIST_DEFAULT_LIMIT;
    const search = query.q?.trim();

    if (search !== undefined && search.length > 0) {
      const rows = await this.friendships.searchFriends(actorId, search, limit + 1);
      return this.pageFriendships(actorId, rows, limit);
    }

    const cursor = query.cursor !== undefined ? decodeCreatedAtCursor(query.cursor) : undefined;
    const rows = await this.friendships.listFriendships(actorId, {
      limit: limit + 1,
      ...(cursor !== undefined ? { cursor } : {}),
    });
    return this.pageFriendships(actorId, rows, limit);
  }

  async searchFriends(
    actorId: string,
    query: FriendsSearchQueryInput,
  ): Promise<PaginatedPayload<FriendshipResponse>> {
    return this.listFriends(actorId, {
      q: query.q,
      ...(query.cursor !== undefined ? { cursor: query.cursor } : {}),
      ...(query.limit !== undefined ? { limit: query.limit } : {}),
    });
  }

  async removeFriend(actorId: string, friendUserId: string): Promise<void> {
    await this.requireActiveUser(friendUserId);
    const deleted = await this.friendships.deleteFriendship(actorId, friendUserId);
    if (deleted == null) {
      throw new NotFoundException('Friendship not found');
    }
  }

  async listMutualFriends(
    actorId: string,
    otherUserId: string,
    query: FriendsListQueryInput = {},
  ): Promise<PaginatedPayload<UserPublicResponse>> {
    await this.requireActiveUser(actorId);
    await this.requireActiveUser(otherUserId);
    await this.assertNotBlocked(actorId, otherUserId);

    const [aIds, bIds] = await Promise.all([
      this.friendships.listFriendIds(actorId),
      this.friendships.listFriendIds(otherUserId),
    ]);
    const bSet = new Set(bIds);
    const mutualIds = aIds.filter((id) => id !== otherUserId && bSet.has(id));

    const limit = query.limit ?? FRIENDS_LIST_DEFAULT_LIMIT;
    const offset = query.cursor !== undefined ? decodeOffsetCursor(query.cursor) : 0;
    const pageIds = mutualIds.slice(offset, offset + limit + 1);
    const hasMore = pageIds.length > limit;
    const page = hasMore ? pageIds.slice(0, limit) : pageIds;
    const users = await this.projectUsers(page);
    const next = hasMore ? encodeOffsetCursor(offset + limit) : null;
    return new PaginatedPayload(users, { next }, hasMore, limit);
  }

  async getRelationship(actorId: string, otherUserId: string): Promise<UserRelationshipResponse> {
    if (actorId === otherUserId) {
      throw new BadRequestException('Cannot compute relationship with yourself');
    }
    await this.requireActiveUser(otherUserId);
    await this.requireActiveUser(actorId);

    const [
      isFollowing,
      followsYou,
      friendship,
      requestSent,
      requestReceived,
      isBlocked,
      blockedBy,
      mutualFriends,
    ] = await Promise.all([
      this.follows.exists(actorId, otherUserId),
      this.follows.exists(otherUserId, actorId),
      this.friendships.findFriendship(actorId, otherUserId),
      this.friendships.findPendingBetween(actorId, otherUserId),
      this.friendships.findPendingBetween(otherUserId, actorId),
      this.blocks.exists(actorId, otherUserId),
      this.blocks.exists(otherUserId, actorId),
      this.friendships.countMutualFriends(actorId, otherUserId),
    ]);

    return {
      isFollowing,
      followsYou,
      isFriend: friendship != null,
      requestSent: requestSent != null,
      requestReceived: requestReceived != null,
      isBlocked,
      blockedBy,
      mutualFriends,
    };
  }

  async listFriendActivity(
    actorId: string,
    query: ActivityQueryInput = {},
  ): Promise<PaginatedPayload<ActivityItemResponse>> {
    await this.requireActiveUser(actorId);
    const friendIds = await this.friendships.listFriendIds(actorId);
    const limit = query.limit ?? ACTIVITY_LIST_DEFAULT_LIMIT;
    const from = query.from !== undefined ? new Date(query.from) : undefined;
    const to = query.to !== undefined ? new Date(query.to) : undefined;
    const cursor = query.cursor !== undefined ? decodeActivityCursor(query.cursor) : undefined;

    const rows = await this.activity.listByActorIds(friendIds, {
      limit: limit + 1,
      ...(cursor !== undefined ? { cursor } : {}),
      ...(from !== undefined ? { from } : {}),
      ...(to !== undefined ? { to } : {}),
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const next =
      hasMore && last !== undefined
        ? encodeActivityCursor({
            occurredAt: last.activityItem.occurredAt,
            id: last.activityItem.id,
          })
        : null;

    return new PaginatedPayload(
      page.map((row: ActivityFeedRow) => toActivityItemResponse(row)),
      { next },
      hasMore,
      limit,
    );
  }

  async listOnlineFriends(actorId: string): Promise<OnlineFriendResponse[]> {
    await this.requireActiveUser(actorId);
    const friendIds = await this.friendships.listFriendIds(actorId);
    if (friendIds.length === 0) {
      return [];
    }

    const [presenceRows, users] = await Promise.all([
      this.presence.findManyByUserIds(friendIds),
      this.users.findManyByIds(friendIds),
    ]);
    const presenceByUser = new Map(presenceRows.map((row) => [row.userId, row]));
    const userById = new Map(users.map((user) => [user.id, user]));

    const online: OnlineFriendResponse[] = [];
    for (const friendId of friendIds) {
      const user = userById.get(friendId);
      if (user == null || user.deletedAt != null) {
        continue;
      }
      const row = presenceByUser.get(friendId);
      if (row == null) {
        continue;
      }
      if (row.status !== 'online' && row.status !== 'away') {
        continue;
      }
      online.push(toOnlineFriendResponse(user, toPresenceResponse(row)));
    }
    return online;
  }

  async getMyPresence(actorId: string): Promise<PresenceResponse> {
    await this.requireActiveUser(actorId);
    const row = await this.presence.findByUserId(actorId);
    if (row == null) {
      return toOfflinePresenceResponse(actorId);
    }
    return toPresenceResponse(row);
  }

  async updateMyPresence(actorId: string, input: PresenceUpdateInput): Promise<PresenceResponse> {
    await this.requireActiveUser(actorId);
    const row = await this.presence.upsert(actorId, input.status);
    return toPresenceResponse(row);
  }

  async getUserPresence(viewerId: string | null, userId: string): Promise<PresenceResponse> {
    await this.requireActiveUser(userId);
    if (viewerId != null && viewerId !== userId) {
      await this.assertNotBlocked(viewerId, userId);
    }
    const row = await this.presence.findByUserId(userId);
    if (row == null) {
      return toOfflinePresenceResponse(userId);
    }
    const isSelf = viewerId === userId;
    return toPresenceResponse(row, { maskInvisible: !isSelf });
  }

  private async pageFriendRequests(
    rows: FriendRequest[],
    limit: number,
  ): Promise<PaginatedPayload<FriendRequestResponse>> {
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const userIds = new Set<string>();
    for (const row of page) {
      userIds.add(row.senderId);
      userIds.add(row.receiverId);
    }
    const loaded = await this.users.findManyByIds([...userIds]);
    const byId = new Map(loaded.map((user) => [user.id, user]));

    const items: FriendRequestResponse[] = [];
    for (const row of page) {
      const sender = byId.get(row.senderId);
      const receiver = byId.get(row.receiverId);
      if (sender == null || receiver == null) {
        continue;
      }
      items.push(toFriendRequestResponse(row, sender, receiver));
    }

    const last = page[page.length - 1];
    const next =
      hasMore && last !== undefined
        ? encodeCreatedAtCursor({ createdAt: last.createdAt, id: last.id })
        : null;
    return new PaginatedPayload(items, { next }, hasMore, limit);
  }

  private async pageFriendships(
    actorId: string,
    rows: Friendship[],
    limit: number,
  ): Promise<PaginatedPayload<FriendshipResponse>> {
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const friendIds = page.map((row) => friendIdOf(row, actorId));
    const users = await this.users.findManyByIds(friendIds);
    const byId = new Map(users.map((user) => [user.id, user]));

    const items: FriendshipResponse[] = [];
    for (const row of page) {
      const friendId = friendIdOf(row, actorId);
      const friend = byId.get(friendId);
      if (friend == null || friend.deletedAt != null) {
        continue;
      }
      const mutualFriendsCount = await this.friendships.countMutualFriends(actorId, friendId);
      items.push(toFriendshipResponse(row, friend, mutualFriendsCount));
    }

    const last = page[page.length - 1];
    const next =
      hasMore && last !== undefined
        ? encodeCreatedAtCursor({ createdAt: last.createdAt, id: last.id })
        : null;
    return new PaginatedPayload(items, { next }, hasMore, limit);
  }

  private async requirePendingRequest(requestId: string): Promise<FriendRequest> {
    const request = await this.friendships.findRequestById(requestId);
    if (request == null) {
      throw new NotFoundException('Friend request not found');
    }
    if (request.status !== 'pending') {
      throw new NotFoundException('Friend request not found');
    }
    return request;
  }

  private async assertNotBlocked(actorId: string, otherUserId: string): Promise<void> {
    const [blocked, blockedBy] = await Promise.all([
      this.blocks.exists(actorId, otherUserId),
      this.blocks.exists(otherUserId, actorId),
    ]);
    if (blocked || blockedBy) {
      throw new ConflictException('Cannot interact with a blocked user');
    }
  }

  private async requireActiveUser(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (user == null || user.deletedAt != null) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private async projectUsers(userIds: string[]): Promise<UserPublicResponse[]> {
    if (userIds.length === 0) {
      return [];
    }
    const loaded = await this.users.findManyByIds(userIds);
    const byId = new Map(loaded.map((user) => [user.id, user]));
    return userIds.flatMap((id) => {
      const user = byId.get(id);
      if (user == null || user.deletedAt != null) {
        return [];
      }
      return [toUserPublicResponse(user)];
    });
  }
}

interface CreatedAtCursor {
  createdAt: Date;
  id: string;
}

function encodeCreatedAtCursor(cursor: CreatedAtCursor): string {
  const payload = `${cursor.createdAt.toISOString()}|${cursor.id}`;
  return Buffer.from(payload, 'utf8').toString('base64url');
}

function decodeCreatedAtCursor(raw: string): CreatedAtCursor {
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

function encodeOffsetCursor(offset: number): string {
  return Buffer.from(`offset|${String(offset)}`, 'utf8').toString('base64url');
}

function decodeOffsetCursor(raw: string): number {
  let decoded: string;
  try {
    decoded = Buffer.from(raw, 'base64url').toString('utf8');
  } catch {
    throw new BadRequestException('Invalid cursor');
  }
  if (!decoded.startsWith('offset|')) {
    throw new BadRequestException('Invalid cursor');
  }
  const offset = Number.parseInt(decoded.slice('offset|'.length), 10);
  if (!Number.isFinite(offset) || offset < 0) {
    throw new BadRequestException('Invalid cursor');
  }
  return offset;
}

function encodeActivityCursor(cursor: ActivityListCursor): string {
  const payload = `${cursor.occurredAt.toISOString()}|${cursor.id}`;
  return Buffer.from(payload, 'utf8').toString('base64url');
}

function decodeActivityCursor(raw: string): ActivityListCursor {
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
