import { Injectable } from '@nestjs/common';

import { PrismaService } from '../infrastructure/database/prisma.service';
import { ReputationEngineService } from '../reputation/reputation-engine.service';

/**
 * D3.24 Creator badge eligibility (docs/07_SOCIAL/CREATOR_PROFILE.md).
 * Deterministic thresholds only — never a purchase path. `creatorFeatured`
 * remains an editorial override switch, not a substitute for the rule.
 */
export const CREATOR_ELIGIBILITY_THRESHOLDS = {
  minPublishedGuides: 5,
  minCollectionFollowers: 50,
} as const;

const CREATOR_QUALIFYING_BADGES = ['helpful_reviewer', 'strategy_expert'] as const;

/**
 * Shared eligibility check consumed by both Profile Hero (`creatorBadge`) and
 * the Creator Profile surface (CREATOR_PROFILE.md). One responsibility: decide
 * eligible or not — never renders, never mutates.
 */
@Injectable()
export class CreatorEligibilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reputation: ReputationEngineService,
  ) {}

  /** Caller must have already confirmed the user is active. */
  async isEligible(userId: string): Promise<boolean> {
    const [user, guideCount, maxCollectionFollowers, reputations] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { creatorFeatured: true } }),
      this.countPublishedGuides(userId),
      this.maxCollectionFollowers(userId),
      this.reputation.listForUser(userId),
    ]);

    if (user?.creatorFeatured === true) {
      return true;
    }
    if (guideCount >= CREATOR_ELIGIBILITY_THRESHOLDS.minPublishedGuides) {
      return true;
    }
    if (maxCollectionFollowers >= CREATOR_ELIGIBILITY_THRESHOLDS.minCollectionFollowers) {
      return true;
    }
    return reputations.some((row) =>
      (CREATOR_QUALIFYING_BADGES as readonly string[]).includes(row.badge),
    );
  }

  private countPublishedGuides(userId: string): Promise<number> {
    return this.prisma.post.count({
      where: { authorId: userId, postKind: 'guide', deletedAt: null },
    });
  }

  private async maxCollectionFollowers(userId: string): Promise<number> {
    const rows = await this.prisma.collection.findMany({
      where: { ownerId: userId, deletedAt: null, visibility: 'public' },
      select: { _count: { select: { followers: true } } },
    });
    return rows.reduce((max, row) => Math.max(max, row._count.followers), 0);
  }
}
