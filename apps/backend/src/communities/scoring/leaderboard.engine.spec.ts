import { describe, expect, it } from 'vitest';

import {
  COMMUNITY_LEADERBOARD_CONTRIBUTOR_TOP_N,
  COMMUNITY_LEADERBOARD_WEIGHTS,
  computeLeaderboardPoints,
  contributorUserIds,
  leaderboardWindowStart,
  rankLeaderboard,
} from './leaderboard.engine';

describe('computeLeaderboardPoints', () => {
  it('weights a guide post above a plain post', () => {
    const points = computeLeaderboardPoints({
      postCounts: [
        { authorId: 'user-1', postKind: 'text', count: 1 },
        { authorId: 'user-2', postKind: 'guide', count: 1 },
      ],
      replyCounts: [],
      eventHostCounts: [],
    });
    expect(points.get('user-1')).toBe(COMMUNITY_LEADERBOARD_WEIGHTS.post);
    expect(points.get('user-2')).toBe(COMMUNITY_LEADERBOARD_WEIGHTS.guide);
    expect(points.get('user-2')).toBeGreaterThan(points.get('user-1') ?? 0);
  });

  it('sums every source for the same user', () => {
    const points = computeLeaderboardPoints({
      postCounts: [{ authorId: 'user-1', postKind: 'text', count: 2 }],
      replyCounts: [{ authorId: 'user-1', count: 3 }],
      eventHostCounts: [{ userId: 'user-1', count: 1 }],
    });
    const expected =
      COMMUNITY_LEADERBOARD_WEIGHTS.post * 2 +
      COMMUNITY_LEADERBOARD_WEIGHTS.reply * 3 +
      COMMUNITY_LEADERBOARD_WEIGHTS.eventHosted * 1;
    expect(points.get('user-1')).toBe(expected);
  });

  it('returns an empty map for no activity', () => {
    const points = computeLeaderboardPoints({
      postCounts: [],
      replyCounts: [],
      eventHostCounts: [],
    });
    expect(points.size).toBe(0);
  });
});

describe('rankLeaderboard', () => {
  it('ranks highest points first', () => {
    const points = new Map([
      ['user-1', 10],
      ['user-2', 20],
    ]);
    const ranked = rankLeaderboard(points, ['user-1', 'user-2']);
    expect(ranked).toEqual([
      { userId: 'user-2', rank: 1, points: 20 },
      { userId: 'user-1', rank: 2, points: 10 },
    ]);
  });

  it('drops zero-point members — not "on the board"', () => {
    const points = new Map([['user-1', 5]]);
    const ranked = rankLeaderboard(points, ['user-1', 'user-2']);
    expect(ranked.map((row) => row.userId)).toEqual(['user-1']);
  });

  it('excluded (ineligible) members leave no gap in the rank sequence', () => {
    const points = new Map([
      ['user-1', 30],
      ['user-2', 20],
      ['user-3', 10],
    ]);
    // user-2 excluded upstream (deleted/blocked) — never passed as eligible.
    const ranked = rankLeaderboard(points, ['user-1', 'user-3']);
    expect(ranked.map((row) => row.rank)).toEqual([1, 2]);
    expect(ranked.map((row) => row.userId)).toEqual(['user-1', 'user-3']);
  });

  it('breaks exact ties deterministically by userId so ranks stay a dense sequence', () => {
    const points = new Map([
      ['user-b', 10],
      ['user-a', 10],
    ]);
    const ranked = rankLeaderboard(points, ['user-b', 'user-a']);
    expect(ranked.map((row) => row.userId)).toEqual(['user-a', 'user-b']);
    expect(ranked.map((row) => row.rank)).toEqual([1, 2]);
  });
});

describe('contributorUserIds', () => {
  it('is exactly the top-N ranked rows', () => {
    const ranked = Array.from({ length: COMMUNITY_LEADERBOARD_CONTRIBUTOR_TOP_N + 3 }, (_, i) => ({
      userId: `user-${i}`,
      rank: i + 1,
      points: 100 - i,
    }));
    const contributors = contributorUserIds(ranked);
    expect(contributors.size).toBe(COMMUNITY_LEADERBOARD_CONTRIBUTOR_TOP_N);
    expect(contributors.has(`user-${COMMUNITY_LEADERBOARD_CONTRIBUTOR_TOP_N - 1}`)).toBe(true);
    expect(contributors.has(`user-${COMMUNITY_LEADERBOARD_CONTRIBUTOR_TOP_N}`)).toBe(false);
  });
});

describe('leaderboardWindowStart', () => {
  it('subtracts the right number of days for each window', () => {
    const now = new Date('2026-06-01T00:00:00.000Z');
    expect(leaderboardWindowStart('7d', now).toISOString()).toBe('2026-05-25T00:00:00.000Z');
    expect(leaderboardWindowStart('30d', now).toISOString()).toBe('2026-05-02T00:00:00.000Z');
    expect(leaderboardWindowStart('90d', now).toISOString()).toBe('2026-03-03T00:00:00.000Z');
  });
});
