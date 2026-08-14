import type { Achievement, AchievementProgress, AchievementState, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

export interface AchievementDefinitionWrite {
  key: string;
  title: string;
  description: string;
  criteriaRef: string;
  category: string;
  isHidden?: boolean;
  isRare?: boolean;
  target: number;
}

export interface AchievementRepository {
  listDefinitions(): Promise<Achievement[]>;
  findByKey(key: string): Promise<Achievement | null>;
  findById(id: string): Promise<Achievement | null>;
  upsertDefinition(data: AchievementDefinitionWrite): Promise<Achievement>;
  listProgressByUser(userId: string): Promise<AchievementProgress[]>;
  findProgress(achievementId: string, userId: string): Promise<AchievementProgress | null>;
  upsertProgress(data: {
    achievementId: string;
    userId: string;
    current: number;
    target: number;
    state: AchievementState;
    awardedAt?: Date | null;
  }): Promise<AchievementProgress>;
  countAwarded(userId: string): Promise<number>;
  /**
   * 9.3 — one query, however many ids are passed. Holders are restricted to
   * active, individual accounts (same exclusion as `countEligiblePlayers`),
   * so the numerator and denominator of `holderPercent` never disagree about
   * who counts as a player.
   */
  countHoldersByAchievementIds(achievementIds: string[]): Promise<Map<string, number>>;
  /**
   * 9.3's denominator: active, individual accounts with at least one library
   * entry — an account that could never unlock anything is excluded so it
   * doesn't make every achievement look rarer than it is.
   */
  countEligiblePlayers(): Promise<number>;
}

export class PrismaAchievementRepository implements AchievementRepository {
  constructor(private readonly db: DatabaseClient) {}

  listDefinitions(): Promise<Achievement[]> {
    return this.db.achievement.findMany({ orderBy: [{ category: 'asc' }, { key: 'asc' }] });
  }

  findByKey(key: string): Promise<Achievement | null> {
    return this.db.achievement.findUnique({ where: { key } });
  }

  findById(id: string): Promise<Achievement | null> {
    return this.db.achievement.findUnique({ where: { id } });
  }

  upsertDefinition(data: AchievementDefinitionWrite): Promise<Achievement> {
    return this.db.achievement.upsert({
      where: { key: data.key },
      create: {
        key: data.key,
        title: data.title,
        description: data.description,
        criteriaRef: data.criteriaRef,
        category: data.category,
        isHidden: data.isHidden ?? false,
        isRare: data.isRare ?? false,
        target: data.target,
      },
      update: {
        title: data.title,
        description: data.description,
        criteriaRef: data.criteriaRef,
        category: data.category,
        isHidden: data.isHidden ?? false,
        isRare: data.isRare ?? false,
        target: data.target,
      },
    });
  }

  listProgressByUser(userId: string): Promise<AchievementProgress[]> {
    return this.db.achievementProgress.findMany({
      where: { userId },
      orderBy: [{ awardedAt: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  findProgress(achievementId: string, userId: string): Promise<AchievementProgress | null> {
    return this.db.achievementProgress.findUnique({
      where: { achievementId_userId: { achievementId, userId } },
    });
  }

  upsertProgress(data: {
    achievementId: string;
    userId: string;
    current: number;
    target: number;
    state: AchievementState;
    awardedAt?: Date | null;
  }): Promise<AchievementProgress> {
    return this.db.achievementProgress.upsert({
      where: {
        achievementId_userId: {
          achievementId: data.achievementId,
          userId: data.userId,
        },
      },
      create: {
        achievement: { connect: { id: data.achievementId } },
        user: { connect: { id: data.userId } },
        current: data.current,
        target: data.target,
        state: data.state,
        awardedAt: data.awardedAt ?? null,
      },
      update: {
        current: data.current,
        target: data.target,
        state: data.state,
        ...(data.awardedAt !== undefined ? { awardedAt: data.awardedAt } : {}),
      },
    });
  }

  countAwarded(userId: string): Promise<number> {
    return this.db.achievementProgress.count({
      where: { userId, state: 'awarded' },
    });
  }

  async countHoldersByAchievementIds(achievementIds: string[]): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (achievementIds.length === 0) {
      return counts;
    }
    const rows = await this.db.achievementProgress.groupBy({
      by: ['achievementId'],
      where: {
        achievementId: { in: achievementIds },
        state: 'awarded',
        user: { accountKind: 'individual', deletedAt: null },
      },
      _count: { _all: true },
    });
    for (const row of rows) {
      counts.set(row.achievementId, row._count._all);
    }
    return counts;
  }

  countEligiblePlayers(): Promise<number> {
    return this.db.user.count({
      where: {
        accountKind: 'individual',
        deletedAt: null,
        libraryEntries: { some: {} },
      },
    });
  }
}

export type { Prisma };
