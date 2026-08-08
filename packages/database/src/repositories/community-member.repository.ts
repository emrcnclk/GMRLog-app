import type { CommunityMember, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * Community membership persistence (S2 §10.6). Unique per (communityId, userId).
 * Leave = hard delete of the membership row (§6 relationship policy).
 * Lists ordered oldest → newest by `joinedAt`.
 */
export interface CommunityMemberRepository {
  create(data: Prisma.CommunityMemberCreateInput): Promise<CommunityMember>;
  findByCommunityAndUser(communityId: string, userId: string): Promise<CommunityMember | null>;
  findById(id: string): Promise<CommunityMember | null>;
  listByCommunity(communityId: string): Promise<CommunityMember[]>;
  listCommunityIdsByUser(userId: string): Promise<string[]>;
  countByCommunity(communityId: string): Promise<number>;
  /**
   * Member counts for a page of communities in one `groupBy`. A list projecting
   * counts row by row is the N+1 that made `GET /communities` unusable.
   * Communities with no members are absent from the map, not zero.
   */
  countByCommunityIds(communityIds: readonly string[]): Promise<Map<string, number>>;
  /** One viewer's memberships across a page of communities, in one query. */
  listByCommunityIdsAndUser(
    communityIds: readonly string[],
    userId: string,
  ): Promise<CommunityMember[]>;
  /**
   * How many of `userIds` belong to each community, in one `groupBy` — 3b.1b's
   * "N friends here". Communities with none are absent from the map.
   */
  countByCommunityIdsForUsers(
    communityIds: readonly string[],
    userIds: readonly string[],
  ): Promise<Map<string, number>>;
  /** The owner row of each community in a page, in one query. */
  listOwnersByCommunityIds(communityIds: readonly string[]): Promise<CommunityMember[]>;
  update(id: string, data: Prisma.CommunityMemberUpdateInput): Promise<CommunityMember>;
  delete(id: string): Promise<CommunityMember>;
  deleteByCommunityAndUser(communityId: string, userId: string): Promise<CommunityMember | null>;
}

export class PrismaCommunityMemberRepository implements CommunityMemberRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.CommunityMemberCreateInput): Promise<CommunityMember> {
    return this.db.communityMember.create({ data });
  }

  findByCommunityAndUser(communityId: string, userId: string): Promise<CommunityMember | null> {
    return this.db.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
  }

  findById(id: string): Promise<CommunityMember | null> {
    return this.db.communityMember.findUnique({ where: { id } });
  }

  listByCommunity(communityId: string): Promise<CommunityMember[]> {
    return this.db.communityMember.findMany({
      where: { communityId },
      orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }],
    });
  }

  async listCommunityIdsByUser(userId: string): Promise<string[]> {
    const rows = await this.db.communityMember.findMany({
      where: { userId },
      select: { communityId: true },
      orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }],
    });
    return rows.map((row) => row.communityId);
  }

  async countByCommunity(communityId: string): Promise<number> {
    return this.db.communityMember.count({ where: { communityId } });
  }

  async countByCommunityIds(communityIds: readonly string[]): Promise<Map<string, number>> {
    if (communityIds.length === 0) {
      return new Map();
    }
    const rows = await this.db.communityMember.groupBy({
      by: ['communityId'],
      where: { communityId: { in: [...communityIds] } },
      _count: { _all: true },
    });
    return new Map(rows.map((row) => [row.communityId, row._count._all]));
  }

  listByCommunityIdsAndUser(
    communityIds: readonly string[],
    userId: string,
  ): Promise<CommunityMember[]> {
    if (communityIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.db.communityMember.findMany({
      where: { communityId: { in: [...communityIds] }, userId },
    });
  }

  async countByCommunityIdsForUsers(
    communityIds: readonly string[],
    userIds: readonly string[],
  ): Promise<Map<string, number>> {
    if (communityIds.length === 0 || userIds.length === 0) {
      return new Map();
    }
    const rows = await this.db.communityMember.groupBy({
      by: ['communityId'],
      where: { communityId: { in: [...communityIds] }, userId: { in: [...userIds] } },
      _count: { _all: true },
    });
    return new Map(rows.map((row) => [row.communityId, row._count._all]));
  }

  listOwnersByCommunityIds(communityIds: readonly string[]): Promise<CommunityMember[]> {
    if (communityIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.db.communityMember.findMany({
      where: { communityId: { in: [...communityIds] }, role: 'owner' },
    });
  }

  update(id: string, data: Prisma.CommunityMemberUpdateInput): Promise<CommunityMember> {
    return this.db.communityMember.update({ where: { id }, data });
  }

  delete(id: string): Promise<CommunityMember> {
    return this.db.communityMember.delete({ where: { id } });
  }

  async deleteByCommunityAndUser(
    communityId: string,
    userId: string,
  ): Promise<CommunityMember | null> {
    const existing = await this.findByCommunityAndUser(communityId, userId);
    if (!existing) {
      return null;
    }
    return this.delete(existing.id);
  }
}
