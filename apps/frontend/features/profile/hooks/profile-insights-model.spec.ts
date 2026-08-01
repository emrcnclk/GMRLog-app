import type {
  LibraryEntryResponse,
  StatisticsHistoryResponse,
  UserStatisticsResponse,
} from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import {
  buildGameShelves,
  buildGamingInsights,
  buildHeatmapDays,
  derivePlayerLevel,
  derivePlayerPoints,
  findMostActiveYear,
  formatAverageRating,
  formatCompletionRate,
  formatHours,
  rankForLevel,
} from './profile-insights-model';

function stats(overrides: Partial<UserStatisticsResponse> = {}): UserStatisticsResponse {
  return {
    gamesLogged: 0,
    gamesPlayed: 0,
    gamesCompleted: 0,
    gamesDropped: 0,
    backlogSize: 0,
    wishlistSize: 0,
    hoursPlayed: 0,
    averageRating: null,
    completionPercent: 0,
    reviewCount: 0,
    postCount: 0,
    commentCount: 0,
    followerCount: 0,
    followingCount: 0,
    friendCount: 0,
    communityCount: 0,
    collectionCount: 0,
    tierListCount: 0,
    achievementCount: 0,
    favoriteGenres: [],
    favoritePlatform: null,
    favoriteDeveloper: null,
    favoritePublisher: null,
    profileCompletionPercent: 0,
    period: 'lifetime',
    joinedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function entry(
  gameId: string,
  status: LibraryEntryResponse['status'],
  updatedAt: string,
): LibraryEntryResponse {
  return {
    gameId,
    game: { id: gameId, title: `Game ${gameId}`, slug: gameId, coverUrl: null },
    status,
    source: 'manual',
    updatedAt,
  };
}

describe('derivePlayerLevel', () => {
  it('returns null without statistics', () => {
    expect(derivePlayerLevel(null)).toBeNull();
  });

  it('starts a brand new player at level 1 with zero progress', () => {
    const level = derivePlayerLevel(stats());
    expect(level).not.toBeNull();
    expect(level?.level).toBe(1);
    expect(level?.points).toBe(0);
    expect(level?.progress).toBe(0);
    expect(level?.rank).toBe('Newcomer');
  });

  it('weights completions and reviews above raw logging', () => {
    const completer = derivePlayerPoints(stats({ gamesCompleted: 10 }));
    const logger = derivePlayerPoints(stats({ gamesLogged: 10 }));
    expect(completer).toBeGreaterThan(logger);
  });

  it('keeps progress inside the current level band', () => {
    const level = derivePlayerLevel(stats({ gamesCompleted: 12, reviewCount: 8 }));
    expect(level).not.toBeNull();
    expect(level?.progress).toBeGreaterThanOrEqual(0);
    expect(level?.progress).toBeLessThanOrEqual(1);
    expect(level?.points).toBeGreaterThanOrEqual(level?.levelFloor ?? 0);
    expect(level?.points).toBeLessThan(level?.nextLevelAt ?? 0);
  });

  it('is deterministic for identical inputs', () => {
    const input = stats({ gamesCompleted: 7, reviewCount: 3, achievementCount: 5 });
    expect(derivePlayerLevel(input)).toEqual(derivePlayerLevel(input));
  });

  it('never exceeds the level ceiling for absurd inputs', () => {
    const level = derivePlayerLevel(stats({ gamesCompleted: 10_000_000 }));
    expect(level?.level).toBeLessThanOrEqual(100);
  });

  it('maps level bands to rank names', () => {
    expect(rankForLevel(1)).toBe('Newcomer');
    expect(rankForLevel(4)).toBe('Explorer');
    expect(rankForLevel(60)).toBe('Legend');
    expect(rankForLevel(999)).toBe('Legend');
  });
});

describe('insight formatting', () => {
  it('rounds completion and fixes average rating to one decimal', () => {
    expect(formatCompletionRate(stats({ completionPercent: 67.4 }))).toBe('67%');
    expect(formatAverageRating(stats({ averageRating: 8.26 }))).toBe('8.3');
    expect(formatAverageRating(stats())).toBeNull();
    expect(formatCompletionRate(null)).toBeNull();
  });

  it('formats hours and drops non-positive values', () => {
    expect(formatHours(0)).toBeNull();
    expect(formatHours(null)).toBeNull();
    expect(formatHours(0.5)).toBe('<1h');
    expect(formatHours(42.6)).toBe('43h');
  });

  it('omits tiles with no underlying data', () => {
    expect(buildGamingInsights(null)).toEqual([]);
    const insights = buildGamingInsights(stats({ completionPercent: 50, gamesLogged: 4 }));
    expect(insights.some((item) => item.key === 'completion')).toBe(true);
    expect(insights.some((item) => item.key === 'average-rating')).toBe(false);
    expect(insights.some((item) => item.key === 'platform')).toBe(false);
  });
});

describe('buildHeatmapDays', () => {
  const history: StatisticsHistoryResponse = {
    period: 'daily',
    completions: [
      { date: '2026-01-01', value: 2 },
      { date: '2026-01-02', value: 1 },
    ],
    ratings: [{ date: '2026-01-01', value: 9 }],
    collectionGrowth: [{ date: '2026-01-01', value: 1 }],
    reviewGrowth: [{ date: '2026-01-02', value: 3 }],
  };

  it('returns nothing without history', () => {
    expect(buildHeatmapDays(null)).toEqual([]);
  });

  it('sums deliberate acts per day and excludes the ratings series', () => {
    const days = buildHeatmapDays(history);
    // 2 completions + 1 collection; the rating value of 9 must not leak in.
    expect(days).toContainEqual({ date: '2026-01-01', value: 3 });
    expect(days).toContainEqual({ date: '2026-01-02', value: 4 });
  });

  it('returns days sorted ascending', () => {
    const days = buildHeatmapDays(history);
    expect(days.map((day) => day.date)).toEqual([...days.map((day) => day.date)].sort());
  });
});

describe('findMostActiveYear', () => {
  it('returns null when there is nothing to rank', () => {
    expect(findMostActiveYear(null)).toBeNull();
    expect(
      findMostActiveYear({
        period: 'daily',
        completions: [],
        ratings: [],
        collectionGrowth: [],
        reviewGrowth: [],
      }),
    ).toBeNull();
  });

  it('picks the busiest calendar year by completions', () => {
    const result = findMostActiveYear({
      period: 'daily',
      completions: [
        { date: '2024-05-01', value: 3 },
        { date: '2025-05-01', value: 7 },
        { date: '2025-06-01', value: 2 },
      ],
      ratings: [],
      collectionGrowth: [],
      reviewGrowth: [],
    });
    expect(result).toEqual({ year: '2025', count: 9 });
  });
});

describe('buildGameShelves', () => {
  const entries: LibraryEntryResponse[] = [
    entry('a', 'playing', '2026-01-03T00:00:00.000Z'),
    entry('b', 'completed', '2026-01-02T00:00:00.000Z'),
    entry('c', 'completed', '2026-01-05T00:00:00.000Z'),
    entry('d', 'wishlist', '2026-01-01T00:00:00.000Z'),
    entry('e', 'hidden', '2026-01-04T00:00:00.000Z'),
  ];

  it('never exposes the hidden shelf', () => {
    const shelves = buildGameShelves(entries);
    expect(shelves.some((shelf) => shelf.entries.some((item) => item.status === 'hidden'))).toBe(
      false,
    );
  });

  it('drops shelves with no entries', () => {
    const shelves = buildGameShelves(entries);
    expect(shelves.every((shelf) => shelf.entries.length > 0)).toBe(true);
    expect(shelves.some((shelf) => shelf.key === 'dropped')).toBe(false);
  });

  it('orders each shelf newest first', () => {
    const completed = buildGameShelves(entries).find((shelf) => shelf.key === 'completed-all');
    expect(completed?.entries.map((item) => item.gameId)).toEqual(['c', 'b']);
  });

  it('returns nothing for an empty library', () => {
    expect(buildGameShelves([])).toEqual([]);
  });
});
