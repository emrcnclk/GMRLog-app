import type { AchievementCategoryValue, AchievementResponse } from '@gmrlog/types';
import type { RarityTier } from '@gmrlog/ui';

/**
 * D3.27 Phase 4 — Achievement showcase model.
 *
 * `docs/07_SOCIAL/ACHIEVEMENT_SYSTEM.md` is **LOCKED** on the eleven categories
 * below and they are the wire contract. The sprint brief asked for showcase
 * groups named Social / Review / Collector / Completion / Platform / Community /
 * Founder / Legendary; those are presentation groupings, so they are mapped onto
 * the locked categories here rather than changing the taxonomy.
 *
 * Two brief groups have no locked category behind them and are therefore *not*
 * invented:
 *   - "Platform" — would require a platform-scoped achievement category.
 *   - "Founder"  — would require a founder/tenure category or seeded definition.
 * Both are listed in the D3.27 completion report as backend follow-ups.
 *
 * Covered by `achievement-showcase-model.spec.ts`.
 */

export type ShowcaseGroupId =
  | 'legendary'
  | 'completion'
  | 'review'
  | 'collector'
  | 'social'
  | 'community'
  | 'consistency'
  | 'milestones';

export interface ShowcaseGroup {
  id: ShowcaseGroupId;
  title: string;
  description: string;
  achievements: AchievementResponse[];
  awardedCount: number;
}

const GROUP_TITLES: Record<ShowcaseGroupId, { title: string; description: string }> = {
  legendary: { title: 'Legendary', description: 'Rare and hidden awards' },
  completion: { title: 'Completion', description: 'Logging and finishing games' },
  review: { title: 'Review', description: 'Writing about what you played' },
  collector: { title: 'Collector', description: 'Collections and tier lists' },
  social: { title: 'Social', description: 'Friends and connections' },
  community: { title: 'Community', description: 'Communities you belong to' },
  consistency: { title: 'Consistency', description: 'Showing up over time' },
  milestones: { title: 'Milestones', description: 'Platform landmarks' },
};

/** Locked category → showcase group. Total function over the closed vocabulary. */
const CATEGORY_GROUP: Record<AchievementCategoryValue, ShowcaseGroupId> = {
  rare: 'legendary',
  hidden: 'legendary',
  logging: 'completion',
  playtime: 'completion',
  reviewing: 'review',
  collections: 'collector',
  tier_lists: 'collector',
  friends: 'social',
  communities: 'community',
  consistency: 'consistency',
  milestones: 'milestones',
};

export const SHOWCASE_GROUP_ORDER: readonly ShowcaseGroupId[] = [
  'legendary',
  'completion',
  'review',
  'collector',
  'social',
  'community',
  'consistency',
  'milestones',
];

export function showcaseGroupForCategory(category: AchievementCategoryValue): ShowcaseGroupId {
  return CATEGORY_GROUP[category];
}

/**
 * Rarity for a badge. `isRare` and the hidden category are the locked emphasis
 * flags; everything else is graded by how demanding its target is, which keeps
 * a 500-review badge from looking identical to a 5-review one.
 */
export function achievementRarity(achievement: AchievementResponse): RarityTier {
  if (achievement.isRare && achievement.isHidden) {
    return 'legendary';
  }
  if (achievement.isRare || achievement.category === 'hidden') {
    return 'epic';
  }
  if (achievement.progress.target >= 100) {
    return 'rare';
  }
  if (achievement.progress.target >= 25) {
    return 'uncommon';
  }
  return 'common';
}

/**
 * Hidden achievements stay redacted until awarded — the locked spec requires
 * title and description to be withheld from others while locked. Applied to the
 * viewer's own list too, so a hidden badge keeps its surprise.
 */
export function presentAchievement(achievement: AchievementResponse): AchievementResponse {
  if (!achievement.isHidden || achievement.progress.state === 'awarded') {
    return achievement;
  }
  return {
    ...achievement,
    title: 'Hidden achievement',
    description: 'Unlocks when you discover it.',
  };
}

/**
 * 9.3 — server-rounded to one decimal already; this only formats the string,
 * it never re-rounds (5.3's precedent: the server owns its own rounding).
 */
export function formatHolderPercent(holderPercent: number | null | undefined): string | null {
  if (holderPercent == null) {
    return null;
  }
  return `${holderPercent.toFixed(1)}% of players`;
}

export function formatAwardedAt(iso: string | null): string | null {
  if (iso === null) {
    return null;
  }
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return new Date(parsed).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Group the index for the showcase. Awarded badges sort first within a group,
 * then by how close the player is to unlocking — so the next achievable badge is
 * always the first locked one you see.
 */
export function buildShowcaseGroups(achievements: readonly AchievementResponse[]): ShowcaseGroup[] {
  const byGroup = new Map<ShowcaseGroupId, AchievementResponse[]>();

  for (const achievement of achievements) {
    // A category can ship server-side before the client maps it — the wire type
    // cannot express that, so check membership rather than trusting the type.
    if (!(achievement.category in CATEGORY_GROUP)) {
      continue;
    }
    const group = CATEGORY_GROUP[achievement.category];
    const bucket = byGroup.get(group) ?? [];
    bucket.push(presentAchievement(achievement));
    byGroup.set(group, bucket);
  }

  const ratio = (achievement: AchievementResponse): number =>
    achievement.progress.target > 0
      ? achievement.progress.current / achievement.progress.target
      : 0;

  return SHOWCASE_GROUP_ORDER.flatMap((id) => {
    const items = byGroup.get(id);
    if (items === undefined || items.length === 0) {
      return [];
    }

    const sorted = [...items].sort((a, b) => {
      const aAwarded = a.progress.state === 'awarded';
      const bAwarded = b.progress.state === 'awarded';
      if (aAwarded !== bAwarded) {
        return aAwarded ? -1 : 1;
      }
      return ratio(b) - ratio(a);
    });

    return [
      {
        id,
        title: GROUP_TITLES[id].title,
        description: GROUP_TITLES[id].description,
        achievements: sorted,
        awardedCount: sorted.filter((item) => item.progress.state === 'awarded').length,
      },
    ];
  });
}

export interface AchievementTotals {
  awarded: number;
  total: number;
  percent: number;
}

export function achievementTotals(achievements: readonly AchievementResponse[]): AchievementTotals {
  const total = achievements.length;
  const awarded = achievements.filter((item) => item.progress.state === 'awarded').length;
  return {
    awarded,
    total,
    percent: total === 0 ? 0 : Math.round((awarded / total) * 100),
  };
}
