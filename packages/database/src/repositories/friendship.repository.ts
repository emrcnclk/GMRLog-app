import type { FriendRequest, Friendship, FriendRequestStatus, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

export function friendshipPairIds(a: string, b: string): { userLowId: string; userHighId: string } {
  return a < b ? { userLowId: a, userHighId: b } : { userLowId: b, userHighId: a };
}

export interface FriendRequestListParams {
  limit: number;
  cursor?: { createdAt: Date; id: string };
}

/**
 * Friend request + friendship persistence (D3.21 / SOCIAL_API).
 * Relationship rows hard-delete on remove (S2 §6).
 */
export interface FriendshipRepository {
  createRequest(data: Prisma.FriendRequestCreateInput): Promise<FriendRequest>;
  findRequestById(id: string): Promise<FriendRequest | null>;
  findPendingBetween(senderId: string, receiverId: string): Promise<FriendRequest | null>;
  listIncoming(receiverId: string, params: FriendRequestListParams): Promise<FriendRequest[]>;
  listOutgoing(senderId: string, params: FriendRequestListParams): Promise<FriendRequest[]>;
  updateRequest(id: string, data: Prisma.FriendRequestUpdateInput): Promise<FriendRequest>;
  createFriendship(userA: string, userB: string): Promise<Friendship>;
  findFriendship(userA: string, userB: string): Promise<Friendship | null>;
  listFriendships(userId: string, params: FriendRequestListParams): Promise<Friendship[]>;
  deleteFriendship(userA: string, userB: string): Promise<Friendship | null>;
  countFriends(userId: string): Promise<number>;
  countMutualFriends(userA: string, userB: string): Promise<number>;
  listFriendIds(userId: string): Promise<string[]>;
  searchFriends(userId: string, query: string, limit: number): Promise<Friendship[]>;
}

export class PrismaFriendshipRepository implements FriendshipRepository {
  constructor(private readonly db: DatabaseClient) {}

  createRequest(data: Prisma.FriendRequestCreateInput): Promise<FriendRequest> {
    return this.db.friendRequest.create({ data });
  }

  findRequestById(id: string): Promise<FriendRequest | null> {
    return this.db.friendRequest.findUnique({ where: { id } });
  }

  findPendingBetween(senderId: string, receiverId: string): Promise<FriendRequest | null> {
    return this.db.friendRequest.findFirst({
      where: { senderId, receiverId, status: 'pending' },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  listIncoming(receiverId: string, params: FriendRequestListParams): Promise<FriendRequest[]> {
    return this.db.friendRequest.findMany({
      where: {
        receiverId,
        status: 'pending',
        ...(params.cursor !== undefined
          ? {
              OR: [
                { createdAt: { lt: params.cursor.createdAt } },
                { createdAt: params.cursor.createdAt, id: { lt: params.cursor.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: params.limit,
    });
  }

  listOutgoing(senderId: string, params: FriendRequestListParams): Promise<FriendRequest[]> {
    return this.db.friendRequest.findMany({
      where: {
        senderId,
        status: 'pending',
        ...(params.cursor !== undefined
          ? {
              OR: [
                { createdAt: { lt: params.cursor.createdAt } },
                { createdAt: params.cursor.createdAt, id: { lt: params.cursor.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: params.limit,
    });
  }

  updateRequest(id: string, data: Prisma.FriendRequestUpdateInput): Promise<FriendRequest> {
    return this.db.friendRequest.update({ where: { id }, data });
  }

  createFriendship(userA: string, userB: string): Promise<Friendship> {
    const pair = friendshipPairIds(userA, userB);
    return this.db.friendship.create({
      data: {
        userLow: { connect: { id: pair.userLowId } },
        userHigh: { connect: { id: pair.userHighId } },
      },
    });
  }

  findFriendship(userA: string, userB: string): Promise<Friendship | null> {
    const pair = friendshipPairIds(userA, userB);
    return this.db.friendship.findUnique({
      where: { userLowId_userHighId: pair },
    });
  }

  listFriendships(userId: string, params: FriendRequestListParams): Promise<Friendship[]> {
    return this.db.friendship.findMany({
      where: {
        OR: [{ userLowId: userId }, { userHighId: userId }],
        ...(params.cursor !== undefined
          ? {
              AND: [
                {
                  OR: [
                    { createdAt: { lt: params.cursor.createdAt } },
                    { createdAt: params.cursor.createdAt, id: { lt: params.cursor.id } },
                  ],
                },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: params.limit,
    });
  }

  async deleteFriendship(userA: string, userB: string): Promise<Friendship | null> {
    const existing = await this.findFriendship(userA, userB);
    if (existing == null) {
      return null;
    }
    return this.db.friendship.delete({ where: { id: existing.id } });
  }

  countFriends(userId: string): Promise<number> {
    return this.db.friendship.count({
      where: { OR: [{ userLowId: userId }, { userHighId: userId }] },
    });
  }

  async countMutualFriends(userA: string, userB: string): Promise<number> {
    const [aIds, bIds] = await Promise.all([this.listFriendIds(userA), this.listFriendIds(userB)]);
    const bSet = new Set(bIds);
    return aIds.filter((id) => id !== userB && bSet.has(id)).length;
  }

  async listFriendIds(userId: string): Promise<string[]> {
    const rows = await this.db.friendship.findMany({
      where: { OR: [{ userLowId: userId }, { userHighId: userId }] },
      select: { userLowId: true, userHighId: true },
    });
    return rows.map((row) => (row.userLowId === userId ? row.userHighId : row.userLowId));
  }

  async searchFriends(userId: string, query: string, limit: number): Promise<Friendship[]> {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.length === 0) {
      return this.listFriendships(userId, { limit });
    }
    const friendIds = await this.listFriendIds(userId);
    if (friendIds.length === 0) {
      return [];
    }
    const matchedUsers = await this.db.user.findMany({
      where: {
        id: { in: friendIds },
        deletedAt: null,
        OR: [
          { handle: { contains: trimmed, mode: 'insensitive' } },
          { displayName: { contains: trimmed, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
      take: limit,
    });
    const matched = new Set(matchedUsers.map((user) => user.id));
    const friendships = await this.db.friendship.findMany({
      where: {
        OR: [
          { userLowId: userId, userHighId: { in: [...matched] } },
          { userHighId: userId, userLowId: { in: [...matched] } },
        ],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
    });
    return friendships;
  }
}

export type { FriendRequestStatus };
