import type {
  LibraryEntryResponse,
  StatisticsHistoryResponse,
  UserStatisticsResponse,
} from '@gmrlog/types';
import type { HeatmapDay } from '@gmrlog/ui';

/**
 * D3.27 Phase 2 — Gaming Insights derivations.
 *
 * Every value here is computed from `UserStatisticsResponse` /
 * `StatisticsHistoryResponse`, both of which the backend already serves. Nothing
 * is invented: where the platform has no data the function returns `null` and
 * the section does not render.
 *
 * Covered by `profile-insights-model.spec.ts`.
 */

// ---------------------------------------------------------------------------
// Player level
// ---------------------------------------------------------------------------

/**
 * GMRLOG has no server-side XP column, so level is a *deterministic projection*
 * of platform counts rather than a stored score. It is derived, not awarded —
 * the UI labels it "Level" but never claims it is a persisted balance, and the
 * same inputs always yield the same level on any device.
 *
 * Weights favour finishing and writing over hoarding, matching the North Star's
 * "Community Before Monetization" and the archetype engine's own bias.
 */
export const XP_WEIGHTS = {
  gameCompleted: 40,
  gameLogged: 6,
  review: 25,
  post: 4,
  comment: 2,
  collection: 15,
  tierList: 15,
  achievement: 30,
  friend: 5,
  community: 8,
} as const;

export interface PlayerLevel {
  level: number;
  /** Total derived points. */
  points: number;
  /** Points at the current level's floor. */
  levelFloor: number;
  /** Points required to reach the next level. */
  nextLevelAt: number;
  /** Progress through the current level, 0–1. */
  progress: number;
  /** Rank name for the level band. */
  rank: string;
}

/**
 * Level bands. Thresholds grow quadratically so early levels arrive quickly and
 * later ones stay meaningful — level N starts at `50 * N * (N - 1)` points.
 */
function levelFloorPoints(level: number): number {
  return 50 * level * (level - 1);
}

/** Rank names per level band. Cosmetic identity, never a permission. */
const RANK_BANDS: readonly { minLevel: number; name: string }[] = [
  { minLevel: 60, name: 'Legend' },
  { minLevel: 45, name: 'Master' },
  { minLevel: 32, name: 'Veteran' },
  { minLevel: 22, name: 'Curator' },
  { minLevel: 14, name: 'Enthusiast' },
  { minLevel: 8, name: 'Regular' },
  { minLevel: 4, name: 'Explorer' },
  { minLevel: 1, name: 'Newcomer' },
];

export function rankForLevel(level: number): string {
  return RANK_BANDS.find((band) => level >= band.minLevel)?.name ?? 'Newcomer';
}

export function derivePlayerPoints(stats: UserStatisticsResponse): number {
  return (
    stats.gamesCompleted * XP_WEIGHTS.gameCompleted +
    stats.gamesLogged * XP_WEIGHTS.gameLogged +
    stats.reviewCount * XP_WEIGHTS.review +
    stats.postCount * XP_WEIGHTS.post +
    stats.commentCount * XP_WEIGHTS.comment +
    stats.collectionCount * XP_WEIGHTS.collection +
    stats.tierListCount * XP_WEIGHTS.tierList +
    stats.achievementCount * XP_WEIGHTS.achievement +
    stats.friendCount * XP_WEIGHTS.friend +
    stats.communityCount * XP_WEIGHTS.community
  );
}

export function derivePlayerLevel(stats: UserStatisticsResponse | null): PlayerLevel | null {
  if (stats === null) {
    return null;
  }

  const points = derivePlayerPoints(stats);

  // Walk up while the next floor is still reachable. Bounded so a corrupt or
  // absurd stat payload cannot spin here.
  let level = 1;
  while (level < 100 && points >= levelFloorPoints(level + 1)) {
    level += 1;
  }

  const levelFloor = levelFloorPoints(level);
  const nextLevelAt = levelFloorPoints(level + 1);
  const span = nextLevelAt - levelFloor;

  return {
    level,
    points,
    levelFloor,
    nextLevelAt,
    progress: span <= 0 ? 1 : Math.max(0, Math.min(1, (points - levelFloor) / span)),
    rank: rankForLevel(level),
  };
}

// ---------------------------------------------------------------------------
// Insights
// ---------------------------------------------------------------------------

export interface ProfileInsight {
  key: string;
  label: string;
  value: string;
  caption?: string;
}

/** Whole-percent completion, formatted. */
export function formatCompletionRate(stats: UserStatisticsResponse | null): string | null {
  if (stats === null) {
    return null;
  }
  return `${String(Math.round(stats.completionPercent))}%`;
}

/** Average review score on the documented 1–10 scale. */
export function formatAverageRating(stats: UserStatisticsResponse | null): string | null {
  if (stats?.averageRating == null) {
    return null;
  }
  return stats.averageRating.toFixed(1);
}

export function formatHours(hours: number | null | undefined): string | null {
  if (hours == null || hours <= 0) {
    return null;
  }
  if (hours < 1) {
    return '<1h';
  }
  return `${String(Math.round(hours))}h`;
}

/**
 * The insight tiles rendered under "Gaming Insights". Tiles with no underlying
 * data are dropped rather than shown as a dash — an empty tile is noise.
 */
export function buildGamingInsights(stats: UserStatisticsResponse | null): ProfileInsight[] {
  if (stats === null) {
    return [];
  }

  const insights: ProfileInsight[] = [];

  const completion = formatCompletionRate(stats);
  if (completion !== null) {
    insights.push({
      key: 'completion',
      label: 'Completion rate',
      value: completion,
      caption: `${String(stats.gamesCompleted)} of ${String(stats.gamesLogged)} logged`,
    });
  }

  const average = formatAverageRating(stats);
  if (average !== null) {
    insights.push({
      key: 'average-rating',
      label: 'Average rating',
      value: average,
      caption: `across ${String(stats.reviewCount)} reviews`,
    });
  }

  const hours = formatHours(stats.hoursPlayed);
  if (hours !== null) {
    insights.push({ key: 'hours', label: 'Hours played', value: hours });
  }

  if (stats.favoritePlatform !== null && stats.favoritePlatform.length > 0) {
    insights.push({
      key: 'platform',
      label: 'Favourite platform',
      value: stats.favoritePlatform,
    });
  }

  if (stats.favoriteDeveloper !== null && stats.favoriteDeveloper.length > 0) {
    insights.push({
      key: 'developer',
      label: 'Most played studio',
      value: stats.favoriteDeveloper,
    });
  }

  if (stats.backlogSize > 0) {
    insights.push({
      key: 'backlog',
      label: 'Backlog',
      value: String(stats.backlogSize),
      caption: stats.wishlistSize > 0 ? `+${String(stats.wishlistSize)} wishlisted` : undefined,
    });
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Heatmap + most played year
// ---------------------------------------------------------------------------

/**
 * Fold the history series into heatmap days. `completions` is the honest signal
 * for "did this player do something with games that day" — review and collection
 * growth are added because they are equally deliberate acts.
 */
export function buildHeatmapDays(history: StatisticsHistoryResponse | null): HeatmapDay[] {
  if (history === null) {
    return [];
  }

  const totals = new Map<string, number>();
  const add = (points: readonly { date: string; value: number }[]): void => {
    for (const point of points) {
      const key = point.date.slice(0, 10);
      totals.set(key, (totals.get(key) ?? 0) + Math.max(0, point.value));
    }
  };

  add(history.completions);
  add(history.reviewGrowth);
  add(history.collectionGrowth);

  return [...totals.entries()]
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface MostActiveYear {
  year: string;
  count: number;
}

/**
 * Busiest calendar year by completions. Derived from the same history series, so
 * it agrees with the heatmap above it.
 */
export function findMostActiveYear(
  history: StatisticsHistoryResponse | null,
): MostActiveYear | null {
  if (history === null || history.completions.length === 0) {
    return null;
  }

  const byYear = new Map<string, number>();
  for (const point of history.completions) {
    const year = point.date.slice(0, 4);
    if (year.length !== 4) {
      continue;
    }
    byYear.set(year, (byYear.get(year) ?? 0) + Math.max(0, point.value));
  }

  let best: MostActiveYear | null = null;
  for (const [year, count] of byYear) {
    if (count > 0 && (best === null || count > best.count)) {
      best = { year, count };
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Library shelves (Phase 6)
// ---------------------------------------------------------------------------

export interface GameShelf {
  key: string;
  title: string;
  entries: LibraryEntryResponse[];
}

/**
 * Steam-style shelves over the *closed* LibraryStatus vocabulary. No shelf is
 * invented: `hidden` is intentionally excluded from the profile showcase, and
 * "Recently played" is a recency slice of `playing`, not a new status.
 */
export function buildGameShelves(entries: readonly LibraryEntryResponse[]): GameShelf[] {
  const byStatus = new Map<string, LibraryEntryResponse[]>();
  for (const entry of entries) {
    const bucket = byStatus.get(entry.status) ?? [];
    bucket.push(entry);
    byStatus.set(entry.status, bucket);
  }

  const newestFirst = (a: LibraryEntryResponse, b: LibraryEntryResponse): number =>
    b.updatedAt.localeCompare(a.updatedAt);

  const take = (status: string): LibraryEntryResponse[] =>
    [...(byStatus.get(status) ?? [])].sort(newestFirst);

  const playing = take('playing');
  const completed = take('completed');

  const shelves: GameShelf[] = [
    { key: 'playing', title: 'Currently playing', entries: playing },
    { key: 'recent', title: 'Recently played', entries: playing.slice(0, 10) },
    { key: 'completed', title: 'Recently finished', entries: completed.slice(0, 10) },
    { key: 'completed-all', title: 'Completed', entries: completed },
    { key: 'backlog', title: 'Backlog', entries: take('backlog') },
    { key: 'wishlist', title: 'Wishlist', entries: take('wishlist') },
    { key: 'owned', title: 'Owned', entries: take('owned') },
    { key: 'dropped', title: 'Dropped', entries: take('dropped') },
  ];

  return shelves.filter((shelf) => shelf.entries.length > 0);
}

/** Shelves shown as rails on the profile overview, in display order. */
export const OVERVIEW_SHELF_KEYS: readonly string[] = [
  'playing',
  'completed',
  'wishlist',
  'backlog',
];
