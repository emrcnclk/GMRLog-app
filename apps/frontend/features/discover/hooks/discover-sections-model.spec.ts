import type { FeedItemResponse, GameCardResponse, LibraryEntryResponse } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import {
  buildDiscoverRails,
  DISCOVER_PROJECTED_RAILS,
  DISCOVER_RAIL_ORDER,
  DISCOVER_RAIL_TITLES,
  isProjectedRail,
  MIN_RATINGS_FOR_RANKING,
  RECENT_RELEASE_WINDOW_DAYS,
  selectContinuePlaying,
  selectFriendsPlaying,
  selectHighestRated,
  selectIndie,
  selectRecentlyReleased,
  selectUpcoming,
} from './discover-sections-model';

const NOW = Date.parse('2026-08-01T00:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

function game(overrides: Partial<GameCardResponse> & { id: string }): GameCardResponse {
  return {
    slug: overrides.id,
    title: overrides.id,
    coverImageUrl: null,
    coverImage: null,
    heroImageUrl: null,
    heroImage: null,
    summary: null,
    releaseDate: null,
    genres: [],
    platforms: [],
    ratingSummary: { average: null, count: 0 },
    libraryCount: 0,
    ...overrides,
  };
}

function rated(id: string, average: number, count: number): GameCardResponse {
  return game({ id, ratingSummary: { average, count } });
}

function released(id: string, isoDate: string): GameCardResponse {
  return game({ id, releaseDate: isoDate });
}

describe('selectHighestRated', () => {
  it('ignores games without enough ratings to support the claim', () => {
    const picked = selectHighestRated([
      rated('one-perfect-review', 10, MIN_RATINGS_FOR_RANKING - 1),
      rated('well-evidenced', 8.5, 200),
    ]);

    expect(picked.map((g) => g.id)).toEqual(['well-evidenced']);
  });

  it('breaks ties on rating count so the better-evidenced game wins', () => {
    const picked = selectHighestRated([rated('thin', 9, 5), rated('thick', 9, 500)]);

    expect(picked.map((g) => g.id)).toEqual(['thick', 'thin']);
  });

  it('drops games with no average at all', () => {
    expect(selectHighestRated([game({ id: 'unrated' })])).toEqual([]);
  });
});

describe('selectUpcoming', () => {
  it('keeps only future releases, soonest first', () => {
    const picked = selectUpcoming(
      [
        released('past', '2026-01-01'),
        released('far', '2027-01-01'),
        released('near', '2026-09-01'),
        game({ id: 'undated' }),
      ],
      NOW,
    );

    expect(picked.map((g) => g.id)).toEqual(['near', 'far']);
  });

  it('treats an unparseable date as no date rather than as epoch zero', () => {
    expect(selectUpcoming([released('broken', 'not-a-date')], NOW)).toEqual([]);
  });
});

describe('selectRecentlyReleased', () => {
  it('keeps releases inside the window, newest first', () => {
    const inWindow = new Date(NOW - 10 * DAY_MS).toISOString();
    const alsoInWindow = new Date(NOW - 40 * DAY_MS).toISOString();
    const tooOld = new Date(NOW - (RECENT_RELEASE_WINDOW_DAYS + 5) * DAY_MS).toISOString();

    const picked = selectRecentlyReleased(
      [released('old', tooOld), released('older-in', alsoInWindow), released('newest', inWindow)],
      NOW,
    );

    expect(picked.map((g) => g.id)).toEqual(['newest', 'older-in']);
  });

  it('excludes future releases, which belong to the upcoming rail', () => {
    const future = new Date(NOW + 5 * DAY_MS).toISOString();
    expect(selectRecentlyReleased([released('future', future)], NOW)).toEqual([]);
  });

  /** The two date rails must never show the same game — they'd contradict each other. */
  it('never overlaps with the upcoming rail', () => {
    const catalog = [
      released('a', new Date(NOW - DAY_MS).toISOString()),
      released('b', new Date(NOW + DAY_MS).toISOString()),
    ];

    const recentIds = new Set(selectRecentlyReleased(catalog, NOW).map((g) => g.id));
    const upcomingIds = selectUpcoming(catalog, NOW).map((g) => g.id);

    expect(upcomingIds.some((id) => recentIds.has(id))).toBe(false);
  });
});

describe('selectIndie', () => {
  it('matches the genre regardless of provider casing or padding', () => {
    const picked = selectIndie([
      game({ id: 'lower', genres: [{ id: 'g1', name: 'indie', slug: 'indie' }] }),
      game({ id: 'padded', genres: [{ id: 'g2', name: '  Indie ', slug: 'indie' }] }),
      game({ id: 'other', genres: [{ id: 'g3', name: 'Action', slug: 'action' }] }),
    ]);

    expect(picked.map((g) => g.id)).toEqual(['lower', 'padded']);
  });
});

describe('selectContinuePlaying', () => {
  function entry(gameId: string, status: string, updatedAt: string): LibraryEntryResponse {
    return {
      gameId,
      game: { id: gameId, title: gameId, slug: gameId, coverUrl: null },
      status: status as LibraryEntryResponse['status'],
      source: 'manual',
      updatedAt,
    };
  }

  it('takes only the playing shelf, most recently touched first', () => {
    const picked = selectContinuePlaying([
      entry('finished', 'completed', '2026-07-31T00:00:00.000Z'),
      entry('stale', 'playing', '2026-07-01T00:00:00.000Z'),
      entry('fresh', 'playing', '2026-07-30T00:00:00.000Z'),
    ]);

    expect(picked.map((g) => g.id)).toEqual(['fresh', 'stale']);
  });

  /**
   * The library read carries no rating or genre. The card must render nothing
   * for them rather than a fabricated zero that would read as "rated 0".
   */
  it('leaves absent fields empty instead of inventing them', () => {
    const [picked] = selectContinuePlaying([entry('g', 'playing', '2026-07-30T00:00:00.000Z')]);

    expect(picked?.ratingSummary).toEqual({ average: null, count: 0 });
    expect(picked?.genres).toEqual([]);
    expect(picked?.coverImage).toBeNull();
  });
});

describe('selectFriendsPlaying', () => {
  function feedItem(id: string, gameId: string): FeedItemResponse {
    return {
      id,
      kind: 'game_log',
      occurredAt: '2026-07-31T00:00:00.000Z',
      actor: null,
      object: { type: 'game', id: gameId },
      projection: null,
    };
  }

  it('resolves feed references against games already loaded', () => {
    const picked = selectFriendsPlaying(
      [feedItem('f1', 'known'), feedItem('f2', 'unknown')],
      [game({ id: 'known' })],
    );

    expect(picked.map((g) => g.id)).toEqual(['known']);
  });

  it('shows each game once however many friends touched it', () => {
    const picked = selectFriendsPlaying(
      [feedItem('f1', 'same'), feedItem('f2', 'same')],
      [game({ id: 'same' })],
    );

    expect(picked).toHaveLength(1);
  });

  it('ignores feed entries that are not about a game', () => {
    const review: FeedItemResponse = {
      id: 'r1',
      kind: 'review',
      occurredAt: '2026-07-31T00:00:00.000Z',
      actor: null,
      object: { type: 'review', id: 'rev' },
      projection: null,
    };

    expect(selectFriendsPlaying([review], [game({ id: 'rev' })])).toEqual([]);
  });
});

describe('buildDiscoverRails', () => {
  const emptyInput = {
    continuePlaying: [],
    recommended: [],
    friendsFeed: [],
    trending: [],
    popular: [],
    hiddenGems: [],
    catalog: [],
    nowMs: NOW,
  };

  /** A titled shelf with nothing under it reads as broken, not as calm. */
  it('drops every rail that has nothing to show', () => {
    expect(buildDiscoverRails(emptyInput)).toEqual([]);
  });

  it('keeps rails in the declared order', () => {
    const rails = buildDiscoverRails({
      ...emptyInput,
      trending: [game({ id: 't' })],
      recommended: [game({ id: 'r' })],
      hiddenGems: [game({ id: 'h' })],
    });

    expect(rails.map((rail) => rail.id)).toEqual(['recommended', 'trending', 'hidden-gems']);
  });

  it('marks projected rails so the UI can disclose their provenance', () => {
    const rails = buildDiscoverRails({
      ...emptyInput,
      trending: [game({ id: 't' })],
      catalog: [rated('best', 9, 50)],
    });

    const byId = new Map(rails.map((rail) => [rail.id, rail]));
    expect(byId.get('highest-rated')?.isProjection).toBe(true);
    expect(byId.get('trending')?.isProjection).toBe(false);
  });

  it('titles every rail it can build', () => {
    for (const id of DISCOVER_RAIL_ORDER) {
      expect(DISCOVER_RAIL_TITLES[id].length).toBeGreaterThan(0);
    }
  });

  it('agrees with isProjectedRail about which rails are derived', () => {
    for (const id of DISCOVER_RAIL_ORDER) {
      expect(isProjectedRail(id)).toBe(DISCOVER_PROJECTED_RAILS.includes(id));
    }
  });
});
