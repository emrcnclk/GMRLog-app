import type {
  AchievementResponse,
  CollectionResponse,
  CreatorProfileResponse,
} from '@gmrlog/types';

/**
 * §25 Creator hub — presentation helpers over real reads.
 *
 * `CreatorProfileService.getProfile` (`apps/backend/src/creator/creator-profile.service.ts`)
 * is the one endpoint this screen leans on beyond identity: it already gates
 * featured posts/guides/collections and `followerCount` behind a deterministic
 * eligibility check (`CreatorEligibilityService`), so `creatorBadge` here is the
 * same real flag §25's "verified seal" describes — not a client-side guess.
 */

export interface CreatorMetricCell {
  key: string;
  value: string;
  label: string;
}

/**
 * §25's strip names four cells: Followers / Lists / Reviews / Partners. Only
 * the first two have a backend source:
 *
 * - **Followers** — `CreatorProfileResponse.followerCount`, a real
 *   `follow.count({ where: { followeeId } })`.
 * - **Lists** — `collections.length`, the creator's real public collections
 *   (capped at 20 server-side, the same cap `featuredLists` below reads).
 * - **Reviews** — `Review.authorId` is a real, indexed relation
 *   (`schema.prisma`), but no endpoint aggregates a review count per user
 *   today. Backend follow-up: a `reviewCount` field on `CreatorProfileResponse`.
 * - **Partners** — no partnership/sponsorship entity exists anywhere in the
 *   schema (confirmed by grepping `schema.prisma` for
 *   `partner|sponsor|disclos`), the same absence 3b.12 recorded for
 *   Publisher's cross-game migration and market-opportunity sections.
 *
 * Dropped rather than shown as a fabricated zero or a client-invented count —
 * the same "cells.push only when real" call `GameMetricStrip` already makes.
 */
export function creatorMetricCells(creator: CreatorProfileResponse | null): CreatorMetricCell[] {
  if (creator === null) {
    return [];
  }
  return [
    { key: 'followers', value: String(creator.followerCount), label: 'Followers' },
    { key: 'lists', value: String(creator.collections.length), label: 'Lists' },
  ];
}

/**
 * §25's "Verified creator since 2024" line. `creatorBadge` is real; the
 * since-year is not — there is no `creatorFeaturedAt`/`creatorSince` timestamp
 * anywhere on `User` (only a plain `creatorFeatured: Boolean`), and
 * `ProfileHeroResponse.memberSince` is the account's creation date, not the
 * date the creator flag was set — using it here would misstate a real field as
 * a different one. Reads "Verified creator" alone when the badge is real,
 * mirroring `TournamentHeader`'s "never fabricate the missing half" call for
 * its own kicker. Backend follow-up: a `creatorSince` timestamp.
 */
export function verifiedCreatorLabel(creator: CreatorProfileResponse | null): string | null {
  if (!creator?.creatorBadge) {
    return null;
  }
  return 'Verified creator';
}

export function featuredLists(creator: CreatorProfileResponse | null): CollectionResponse[] {
  return creator?.collections ?? [];
}

/**
 * §25's "Creator milestones" grid. No creator-specific badge/milestone entity
 * exists (checked `schema.prisma` for `milestone`/`badge` beyond
 * `CommunityMemberBadge`, which is community flair, scoped to a membership, not
 * a creator's own profile) — but real, awarded `Achievement` rows do, with the
 * same rarity ramp §25 asks this grid to reuse ("same rarity geometry as
 * achievements", literally). `achievementRarity`/`presentAchievement`
 * (`features/profile/hooks/achievement-showcase-model.ts`) are reused rather
 * than re-derived, so a hidden achievement stays redacted here too.
 */
export function creatorMilestones(
  achievements: readonly AchievementResponse[],
): AchievementResponse[] {
  return achievements
    .filter((achievement) => achievement.progress.state === 'awarded')
    .sort((a, b) => {
      const aTime = a.awardedAt === null ? 0 : Date.parse(a.awardedAt);
      const bTime = b.awardedAt === null ? 0 : Date.parse(b.awardedAt);
      return bTime - aTime;
    });
}
