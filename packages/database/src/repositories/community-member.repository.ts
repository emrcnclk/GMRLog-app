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
