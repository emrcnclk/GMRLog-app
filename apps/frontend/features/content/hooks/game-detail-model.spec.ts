import type {
  GameHubResponse,
  GameMediaResponse,
  GameResponse,
  ReviewResponse,
} from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import {
  GAME_HUB_BLOCK_TABS,
  GAME_HUB_TAB_ORDER,
  bucketGameMedia,
  bucketReviewDistribution,
  buildGameHubTabs,
  formatAttribution,
  formatCommunityRating,
  formatCompanies,
  formatCompletionPercent,
  formatCriticScore,
  formatReleaseYear,
  gameHubEmptyCopy,
  isGameHubBlockTab,
  isGameHubTabId,
  resolveHeroArtwork,
} from './game-detail-model';

function media(
  id: string,
  kind: GameMediaResponse['kind'],
  url: string | null,
  sortOrder = 0,
): GameMediaResponse {
  return { id, kind, url, width: null, height: null, sortOrder };
}

const hub: GameHubResponse = {
  gameId: 'g1',
  title: 'Elden Ring',
  tabCounts: {
    reviews: 12,
    screenshots: 4,
    guides: 2,
    collections: 7,
    tierLists: 1,
    events: 0,
    communities: 3,
    players: 88,
  },
};

describe('isGameHubTabId', () => {
  it('accepts known tabs and rejects anything else', () => {
    expect(isGameHubTabId('about')).toBe(true);
    expect(isGameHubTabId('recommendations')).toBe(true);
    expect(isGameHubTabId('overview')).toBe(false);
  });
});

describe('buildGameHubTabs', () => {
  it('omits counts entirely while the hub read is pending', () => {
    const tabs = buildGameHubTabs({ hub: null, recommendationCount: 0 });
    expect(tabs.every((tab) => tab.count === undefined)).toBe(true);
  });

  it('surfaces hub counts on the tabs that have them', () => {
    const tabs = buildGameHubTabs({ hub, recommendationCount: 5 });
    const byId = new Map(tabs.map((tab) => [tab.id, tab.count]));
    expect(byId.get('reviews')).toBe(12);
    expect(byId.get('workshop')).toBe(2);
    expect(byId.get('players')).toBe(88);
    expect(byId.get('recommendations')).toBe(5);
    expect(byId.get('about')).toBeUndefined();
    expect(byId.get('community')).toBeUndefined();
  });

  it('hides a zero recommendation count rather than advertising emptiness', () => {
    const tabs = buildGameHubTabs({ hub, recommendationCount: 0 });
    const byId = new Map(tabs.map((tab) => [tab.id, tab.count]));
    expect(byId.get('recommendations')).toBeUndefined();
  });

  it('always returns every tab in a stable order', () => {
    const tabs = buildGameHubTabs({ hub, recommendationCount: 1 });
    expect(tabs.map((tab) => tab.id)).toEqual([
      'about',
      'reviews',
      'community',
      'workshop',
      'players',
      'recommendations',
    ]);
  });
});

describe('formatting helpers', () => {
  it('extracts the release year and rejects unusable dates', () => {
    expect(formatReleaseYear('2022-02-25')).toBe('2022');
    expect(formatReleaseYear(null)).toBeNull();
    expect(formatReleaseYear('22')).toBeNull();
    expect(formatReleaseYear('abcd-01-01')).toBeNull();
  });

  it('rounds the critic score and keeps it off the 1-10 scale', () => {
    expect(formatCriticScore({ externalRating: 94.6 })).toBe('95');
    expect(formatCriticScore({ externalRating: null })).toBeNull();
  });

  it('renders the community average against the documented maximum', () => {
    expect(
      formatCommunityRating({ stats: { ratingAverage: 8.44, ratingCount: 10, libraryCount: 5 } }),
    ).toBe('8.4 / 10');
    expect(
      formatCommunityRating({ stats: { ratingAverage: null, ratingCount: 0, libraryCount: 0 } }),
    ).toBeNull();
    expect(formatCommunityRating({ stats: null })).toBeNull();
  });

  it('caps company lists and reports the remainder', () => {
    expect(formatCompanies([])).toBeNull();
    expect(formatCompanies([{ name: 'FromSoftware' }])).toBe('FromSoftware');
    expect(formatCompanies([{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }])).toBe(
      'A, B, C +1',
    );
  });

  it('passes attribution through and treats blanks as absent', () => {
    expect(
      formatAttribution({
        metadata: {
          status: 'complete',
          provider: 'igdb',
          refreshedAt: null,
          attribution: 'Data by IGDB',
        },
      }),
    ).toBe('Data by IGDB');
    expect(
      formatAttribution({
        metadata: { status: 'pending', provider: null, refreshedAt: null, attribution: '' },
      }),
    ).toBeNull();
    expect(formatAttribution(null)).toBeNull();
  });
});

describe('resolveHeroArtwork', () => {
  const game = { heroUrl: null, coverUrl: 'cover.jpg' } as Pick<
    GameResponse,
    'heroUrl' | 'coverUrl'
  >;

  it('prefers an explicit hero url', () => {
    expect(resolveHeroArtwork({ heroUrl: 'hero.jpg', coverUrl: 'cover.jpg' }, [])).toBe('hero.jpg');
  });

  it('falls back through banner, artwork, screenshot, then cover', () => {
    expect(resolveHeroArtwork(game, [media('m1', 'banner', 'banner.jpg')])).toBe('banner.jpg');
    expect(resolveHeroArtwork(game, [media('m2', 'artwork', 'art.jpg')])).toBe('art.jpg');
    expect(resolveHeroArtwork(game, [media('m3', 'screenshot', 'shot.jpg')])).toBe('shot.jpg');
    expect(resolveHeroArtwork(game, [])).toBe('cover.jpg');
  });

  it('returns null when nothing at all is available', () => {
    expect(resolveHeroArtwork({ heroUrl: null, coverUrl: null }, [])).toBeNull();
    expect(resolveHeroArtwork(null, [])).toBeNull();
  });

  it('ignores media rows whose mirroring has not finished', () => {
    expect(resolveHeroArtwork(game, [media('m4', 'banner', null)])).toBe('cover.jpg');
  });
});

describe('bucketGameMedia', () => {
  it('splits screenshots and videos and drops url-less rows', () => {
    const buckets = bucketGameMedia([
      media('1', 'screenshot', 'a.jpg', 2),
      media('2', 'video', 'v.mp4', 0),
      media('3', 'screenshot', null, 1),
      media('4', 'trailer', 't.mp4', 1),
      media('5', 'cover', 'c.jpg', 0),
    ]);
    expect(buckets.screenshots.map((item) => item.id)).toEqual(['1']);
    expect(buckets.videos.map((item) => item.id)).toEqual(['2', '4']);
  });

  it('merges inline screenshots without duplicating by id', () => {
    const shared = media('1', 'screenshot', 'a.jpg');
    const buckets = bucketGameMedia([shared], [shared, media('9', 'screenshot', 'b.jpg')]);
    expect(buckets.screenshots.map((item) => item.id)).toEqual(['1', '9']);
  });

  it('sorts each bucket by sortOrder', () => {
    const buckets = bucketGameMedia([
      media('a', 'screenshot', 'a.jpg', 3),
      media('b', 'screenshot', 'b.jpg', 1),
    ]);
    expect(buckets.screenshots.map((item) => item.id)).toEqual(['b', 'a']);
  });

  it('treats artwork as a screenshot for display purposes', () => {
    const buckets = bucketGameMedia([media('x', 'artwork', 'art.jpg')]);
    expect(buckets.screenshots).toHaveLength(1);
  });
});

describe('game hub tab classification', () => {
  it('classifies every tab as either a block or a list, never both or neither', () => {
    const listTabs = GAME_HUB_TAB_ORDER.filter((tab) => !isGameHubBlockTab(tab));

    expect(GAME_HUB_BLOCK_TABS).toEqual(['about', 'community', 'recommendations']);
    expect(listTabs).toEqual(['reviews', 'workshop', 'players']);
    expect(GAME_HUB_BLOCK_TABS.length + listTabs.length).toBe(GAME_HUB_TAB_ORDER.length);
  });

  /**
   * A block tab renders its own empty copy inside its component. If the hub also
   * fired the list-level empty state for one, the screen would show two "nothing
   * here" messages at once.
   */
  it('keeps every block tab out of the list-level empty state', () => {
    for (const tab of GAME_HUB_BLOCK_TABS) {
      expect(isGameHubBlockTab(tab)).toBe(true);
    }
  });
});

describe('gameHubEmptyCopy', () => {
  it('names the action that fills the tab rather than restating its emptiness', () => {
    expect(gameHubEmptyCopy('reviews', 'Hollow Knight')).toEqual({
      icon: 'star',
      description: 'Be the first to write about Hollow Knight.',
    });
    expect(gameHubEmptyCopy('workshop', 'Hollow Knight').description).toContain('guide');
  });

  it('gives every list tab a distinct icon so the states do not read alike', () => {
    const icons = GAME_HUB_TAB_ORDER.filter((tab) => !isGameHubBlockTab(tab)).map(
      (tab) => gameHubEmptyCopy(tab, 'Game').icon,
    );
    expect(new Set(icons).size).toBe(icons.length);
  });

  it('always carries the game title into the copy', () => {
    for (const tab of GAME_HUB_TAB_ORDER) {
      expect(gameHubEmptyCopy(tab, 'Celeste').description).toContain('Celeste');
    }
  });
});

describe('bucketReviewDistribution', () => {
  function review(rating: number): Pick<ReviewResponse, 'rating'> {
    return { rating };
  }

  it('bins ratings into five bands, rounding to the nearest whole point', () => {
    const rows = bucketReviewDistribution([
      review(10),
      review(9.6),
      review(7),
      review(5.2),
      review(3),
      review(1),
      review(1.4),
    ]);
    expect(rows.map((row) => row.label)).toEqual(['9–10', '7–8', '5–6', '3–4', '1–2']);
    expect(rows.map((row) => row.count)).toEqual([2, 1, 1, 1, 2]);
  });

  it('returns every band at zero rather than omitting empty ones', () => {
    const rows = bucketReviewDistribution([]);
    expect(rows.every((row) => row.count === 0)).toBe(true);
    expect(rows).toHaveLength(5);
  });
});

describe('formatCompletionPercent (13.1)', () => {
  // Null is 'not said' and zero is an answer. Collapsing the two would make an
  // unanswered question look like a claim of no progress.
  it('draws nothing when the player has not said', () => {
    expect(formatCompletionPercent(null)).toBeNull();
    expect(formatCompletionPercent(undefined)).toBeNull();
  });

  it('draws zero, because zero is a real answer', () => {
    expect(formatCompletionPercent(0)).toBe('0% complete');
  });

  it('names a full hundred rather than measuring it', () => {
    expect(formatCompletionPercent(100)).toBe('Platinum');
    expect(formatCompletionPercent(99)).toBe('99% complete');
  });
});
