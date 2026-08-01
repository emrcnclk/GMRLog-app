import type { Prisma, ReputationBadge, UserReputation } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * UserReputation persistence (D3.24 · docs/07_SOCIAL/REPUTATION.md).
 * Behavior-derived badges only — never purchasable. Unique per (userId, badge).
 */
export interface UserReputationRepository {
  create(data: Prisma.UserReputationCreateInput): Promise<UserReputation>;
  findByUserAndBadge(userId: string, badge: ReputationBadge): Promise<UserReputation | null>;
  listByUser(userId: string): Promise<UserReputation[]>;
  delete(id: string): Promise<UserReputation>;
}

export class PrismaUserReputationRepository implements UserReputationRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.UserReputationCreateInput): Promise<UserReputation> {
    return this.db.userReputation.create({ data });
  }

  findByUserAndBadge(userId: string, badge: ReputationBadge): Promise<UserReputation | null> {
    return this.db.userReputation.findUnique({ where: { userId_badge: { userId, badge } } });
  }

  listByUser(userId: string): Promise<UserReputation[]> {
    return this.db.userReputation.findMany({
      where: { userId },
      orderBy: { awardedAt: 'desc' },
    });
  }

  delete(id: string): Promise<UserReputation> {
    return this.db.userReputation.delete({ where: { id } });
  }
}
