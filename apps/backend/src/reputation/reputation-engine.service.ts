import type {
  NotificationRepository,
  UserRepository,
  UserReputationRepository,
} from '@gmrlog/database';
import type { ReputationBadgeValue, UserReputationResponse } from '@gmrlog/types';
import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';

import { PrismaService } from '../infrastructure/database/prisma.service';

import { toUserReputationResponse } from './mappers/reputation.mapper';
import {
  REPUTATION_NOTIFICATION_REPOSITORY,
  REPUTATION_REPOSITORY,
  REPUTATION_USER_REPOSITORY,
} from './reputation.tokens';

/**
 * D3.24 Gaming Reputation thresholds (docs/07_SOCIAL/REPUTATION.md).
 * Versioned product constants — behavior-derived only, never purchasable,
 * never manually granted. Tune here; the engine stays deterministic.
 *
 * helpful_reviewer: ≥5 public reviews (helpful reaction kind preferred when present).
 * strategy_expert: ≥3 guide posts.
 * lore_master: ≥2 wiki edits OR ≥2 long guides.
 * achievement_hunter: ≥10 awarded achievements OR ≥5 rare awards.
 * community_leader: owner/admin/moderator tenure.
 */
export const REPUTATION_THRESHOLDS = {
  helpfulReviewer: { minPublicReviews: 5, minHelpfulReactions: 3 },
  strategyExpert: { minGuides: 3 },
  loreMaster: { minLongFormGuides: 2, longFormMinChars: 800, minWikiPages: 2 },
  achievementHunter: { minAwarded: 10, minRareAwarded: 5 },
  communityLeader: { minTenureDays: 30 },
} as const;

const LEADERSHIP_ROLES = ['moderator', 'owner', 'admin'] as const;
const NOTIFICATION_KIND_REPUTATION = 'reputation_awarded';

interface ReputationSignals {
  publicReviewCount: number;
  helpfulReactionCount: number;
  guideCount: number;
  longFormGuideCount: number;
  wikiPageCount: number;
  awardedAchievementCount: number;
  rareAchievementCount: number;
  hasTenuredLeadershipRole: boolean;
}

/**
 * Gaming Reputation engine (D3.24 / REPUTATION.md). Deterministic rule scores
 * derived from behavior signals only — no AI classifier, no manual grant.
 */
@Injectable()
export class ReputationEngineService {
  constructor(
    @Inject(REPUTATION_REPOSITORY) private readonly reputations: UserReputationRepository,
    @Inject(REPUTATION_USER_REPOSITORY) private readonly users: UserRepository,
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(REPUTATION_NOTIFICATION_REPOSITORY)
    private readonly notifications: NotificationRepository | null = null,
  ) {}

  async listForUser(userId: string): Promise<UserReputationResponse[]> {
    await this.requireActiveUser(userId);
    const rows = await this.reputations.listByUser(userId);
    return rows.map(toUserReputationResponse);
  }

  /**
   * Syncs UserReputation rows from current signals.
   * Call after review / guide / wiki / achievement / community deltas,
   * or via `POST /users/:id/reputation/recompute`.
   */
  async recalculate(userId: string): Promise<UserReputationResponse[]> {
    await this.requireActiveUser(userId);
    const signals = await this.loadSignals(userId);
    const awarded = evaluateBadges(signals);

    const existing = await this.reputations.listByUser(userId);
    const existingBadges = new Set(existing.map((row) => row.badge));
    const awardedBadges = new Set(awarded);

    for (const badge of awarded) {
      if (!existingBadges.has(badge)) {
        await this.reputations.create({
          user: { connect: { id: userId } },
          badge,
          evidence: signalsToEvidence(signals),
        });
        if (this.notifications !== null) {
          await this.notifications.create({
            recipient: { connect: { id: userId } },
            kind: NOTIFICATION_KIND_REPUTATION,
            objectType: 'user',
            objectId: userId,
          });
        }
      }
    }
    for (const row of existing) {
      if (!awardedBadges.has(row.badge)) {
        await this.reputations.delete(row.id);
      }
    }

    const rows = await this.reputations.listByUser(userId);
    return rows.map(toUserReputationResponse);
  }

  private async loadSignals(userId: string): Promise<ReputationSignals> {
    const [
      publicReviews,
      guides,
      wikiPageCount,
      awardedAchievementCount,
      rareAchievementCount,
      leadershipMemberships,
    ] = await Promise.all([
      this.prisma.review.findMany({
        where: { authorId: userId, deletedAt: null, visibility: 'public' },
        select: { id: true },
      }),
      this.prisma.post.findMany({
        where: { authorId: userId, postKind: 'guide', deletedAt: null },
        select: { id: true, body: true },
      }),
      this.prisma.communityWikiPage.count({ where: { updatedById: userId } }),
      this.prisma.achievementProgress.count({
        where: { userId, state: 'awarded' },
      }),
      this.prisma.achievementProgress.count({
        where: { userId, state: 'awarded', achievement: { isRare: true } },
      }),
      this.prisma.communityMember.findMany({
        where: { userId, role: { in: [...LEADERSHIP_ROLES] } },
        select: { joinedAt: true },
      }),
    ]);

    const reviewIds = publicReviews.map((row) => row.id);
    const helpfulReactionCount =
      reviewIds.length === 0
        ? 0
        : await this.prisma.reaction.count({
            where: {
              targetType: 'review',
              targetId: { in: reviewIds },
              kind: 'helpful',
            },
          });

    const longFormGuideCount = guides.filter(
      (row) => row.body.length >= REPUTATION_THRESHOLDS.loreMaster.longFormMinChars,
    ).length;

    const now = Date.now();
    const hasTenuredLeadershipRole = leadershipMemberships.some(
      (row) =>
        (now - row.joinedAt.getTime()) / 86_400_000 >=
        REPUTATION_THRESHOLDS.communityLeader.minTenureDays,
    );

    return {
      publicReviewCount: publicReviews.length,
      helpfulReactionCount,
      guideCount: guides.length,
      longFormGuideCount,
      wikiPageCount,
      awardedAchievementCount,
      rareAchievementCount,
      hasTenuredLeadershipRole,
    };
  }

  private async requireActiveUser(userId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (user == null || user.deletedAt != null) {
      throw new NotFoundException('User not found');
    }
  }
}

function evaluateBadges(signals: ReputationSignals): ReputationBadgeValue[] {
  const badges: ReputationBadgeValue[] = [];

  // Prefer helpful signals when present; otherwise ≥5 public reviews.
  if (
    signals.helpfulReactionCount >= REPUTATION_THRESHOLDS.helpfulReviewer.minHelpfulReactions ||
    signals.publicReviewCount >= REPUTATION_THRESHOLDS.helpfulReviewer.minPublicReviews
  ) {
    badges.push('helpful_reviewer');
  }

  if (signals.guideCount >= REPUTATION_THRESHOLDS.strategyExpert.minGuides) {
    badges.push('strategy_expert');
  }

  if (
    signals.longFormGuideCount >= REPUTATION_THRESHOLDS.loreMaster.minLongFormGuides ||
    signals.wikiPageCount >= REPUTATION_THRESHOLDS.loreMaster.minWikiPages
  ) {
    badges.push('lore_master');
  }

  if (
    signals.awardedAchievementCount >= REPUTATION_THRESHOLDS.achievementHunter.minAwarded ||
    signals.rareAchievementCount >= REPUTATION_THRESHOLDS.achievementHunter.minRareAwarded
  ) {
    badges.push('achievement_hunter');
  }

  if (signals.hasTenuredLeadershipRole) {
    badges.push('community_leader');
  }

  return badges;
}

function signalsToEvidence(signals: ReputationSignals): Record<string, number | boolean> {
  return {
    publicReviewCount: signals.publicReviewCount,
    helpfulReactionCount: signals.helpfulReactionCount,
    guideCount: signals.guideCount,
    longFormGuideCount: signals.longFormGuideCount,
    wikiPageCount: signals.wikiPageCount,
    awardedAchievementCount: signals.awardedAchievementCount,
    rareAchievementCount: signals.rareAchievementCount,
    hasTenuredLeadershipRole: signals.hasTenuredLeadershipRole,
  };
}
