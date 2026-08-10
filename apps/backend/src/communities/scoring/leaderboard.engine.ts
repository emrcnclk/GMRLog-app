import type { CommunityLeaderboardWindowValue } from '@gmrlog/types';

/**
 * Pure community leaderboard scoring (7.1 / BACKEND_CHANGES.md §5).
 * No AI, no framework dependency — mirrors `discover/scoring/similarity.engine.ts`'s
 * shape: weights as one exported, tunable constant next to the functions that
 * read them.
 *
 * §5 names four point sources — "posts, replies, accepted guides, events
 * hosted" — and asks for the weights to be picked with the product owner.
 * No product owner is reachable from a coding session, so these are a
 * documented, defensible starting point, not a placeholder: a guide is more
 * effort than a text post (3x), hosting an event is the highest-effort
 * contribution a member can make (5x), and a plain post or a reply to one
 * count the same (1x) — both are one unit of showing up. Revisit with real
 * usage data before calling these final.
 *
 * "Accepted guides" has no acceptance mechanism anywhere in the schema — no
 * `Post` field, no separate model. Every `guide`-kind post counts at the
 * guide weight; there is nothing to gate on. Same class of doc-vs-code gap
 * as 3.1's `holderPercent` and 3.4's `unreadCount` — documented, not invented.
 */
export const COMMUNITY_LEADERBOARD_WEIGHTS = {
  post: 1,
  guide: 3,
  reply: 1,
  eventHosted: 5,
} as const;

/** §5's own example is `?window=90d`; 7d/30d added as the other two common report windows. */
const WINDOW_DAYS: Record<CommunityLeaderboardWindowValue, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export function leaderboardWindowStart(
  window: CommunityLeaderboardWindowValue,
  now: Date = new Date(),
): Date {
  return new Date(now.getTime() - WINDOW_DAYS[window] * 24 * 60 * 60 * 1000);
}

export interface LeaderboardPostCountRow {
  authorId: string;
  postKind: string;
  count: number;
}

export interface LeaderboardAuthorCountRow {
  authorId: string;
  count: number;
}

export interface LeaderboardUserCountRow {
  userId: string;
  count: number;
}

/**
 * Sums weighted points per user. Never negative, never derived client-side —
 * this is the one place the four raw counts become a score.
 */
export function computeLeaderboardPoints(input: {
  postCounts: readonly LeaderboardPostCountRow[];
  replyCounts: readonly LeaderboardAuthorCountRow[];
  eventHostCounts: readonly LeaderboardUserCountRow[];
}): Map<string, number> {
  const points = new Map<string, number>();
  const add = (userId: string, delta: number): void => {
    points.set(userId, (points.get(userId) ?? 0) + delta);
  };

  for (const row of input.postCounts) {
    const weight =
      row.postKind === 'guide'
        ? COMMUNITY_LEADERBOARD_WEIGHTS.guide
        : COMMUNITY_LEADERBOARD_WEIGHTS.post;
    add(row.authorId, weight * row.count);
  }
  for (const row of input.replyCounts) {
    add(row.authorId, COMMUNITY_LEADERBOARD_WEIGHTS.reply * row.count);
  }
  for (const row of input.eventHostCounts) {
    add(row.userId, COMMUNITY_LEADERBOARD_WEIGHTS.eventHosted * row.count);
  }
  return points;
}

export interface RankedLeaderboardRow {
  userId: string;
  rank: number;
  points: number;
}

/**
 * Ranks eligible members by points, highest first, deterministic tie-break
 * (`userId` ascending) so rank is always a dense 1..N sequence — "ranks
 * close up, no gaps" from an excluded (deleted/blocked) member falls out of
 * this by construction, since exclusion happens before ranking, not after.
 * Zero-point members are not "on the board" and are dropped.
 */
export function rankLeaderboard(
  points: ReadonlyMap<string, number>,
  eligibleUserIds: readonly string[],
): RankedLeaderboardRow[] {
  return eligibleUserIds
    .map((userId) => ({ userId, points: points.get(userId) ?? 0 }))
    .filter((row) => row.points > 0)
    .sort((a, b) =>
      b.points !== a.points ? b.points - a.points : a.userId.localeCompare(b.userId),
    )
    .map((row, index) => ({ userId: row.userId, rank: index + 1, points: row.points }));
}

/** §5: "top N by contribution points in the window" derives `isContributor`. */
export const COMMUNITY_LEADERBOARD_CONTRIBUTOR_TOP_N = 10;

export function contributorUserIds(ranked: readonly RankedLeaderboardRow[]): ReadonlySet<string> {
  return new Set(ranked.slice(0, COMMUNITY_LEADERBOARD_CONTRIBUTOR_TOP_N).map((row) => row.userId));
}
