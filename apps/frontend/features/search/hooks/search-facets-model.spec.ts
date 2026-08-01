import type { SearchHit, SearchHitType } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import {
  buildSearchFacetTabs,
  buildSearchSuggestions,
  buildTrendingSearchTerms,
  countByFacet,
  facetForHitType,
  hitsForFacet,
  MIN_REMEMBERED_QUERY_LENGTH,
  resolveActiveFacet,
  SEARCH_FACET_LABELS,
  SEARCH_FACET_ORDER,
  shouldRememberQuery,
  SUGGESTIONS_PER_GROUP,
} from './search-facets-model';

/** Minimal well-typed hit per discriminant — summaries are irrelevant here. */
function hit(type: SearchHitType, id: string): SearchHit {
  switch (type) {
    case 'game':
      return {
        type,
        id,
        summary: { title: id, slug: id, coverImageUrl: null, summary: null, genres: [] },
      };
    case 'user':
      return { type, id, summary: { handle: id, displayName: id } };
    case 'review':
      return { type, id, summary: { excerpt: id, gameTitle: id } };
    case 'post':
      return { type, id, summary: { excerpt: id } };
    case 'collection':
      return { type, id, summary: { title: id } };
    case 'tier-list':
      return { type, id, summary: { title: id } };
    case 'community':
      return { type, id, summary: { name: id } };
    case 'event':
      return { type, id, summary: { title: id, kind: 'meetup' } };
    case 'achievement':
      return { type, id, summary: { name: id, category: id } };
    case 'tag':
      return { type, id, summary: { name: id, slug: id } };
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

describe('facetForHitType', () => {
  it('files each headline entity under its own facet', () => {
    expect(facetForHitType('game')).toBe('games');
    expect(facetForHitType('user')).toBe('players');
    expect(facetForHitType('review')).toBe('reviews');
    expect(facetForHitType('community')).toBe('communities');
  });

  /** Both are curated orderings of games; a searcher does not distinguish them. */
  it('treats a tier list as a kind of collection', () => {
    expect(facetForHitType('collection')).toBe('collections');
    expect(facetForHitType('tier-list')).toBe('collections');
  });

  it('leaves unfaceted types to All rather than forcing a home', () => {
    expect(facetForHitType('post')).toBeNull();
    expect(facetForHitType('event')).toBeNull();
    expect(facetForHitType('achievement')).toBeNull();
    expect(facetForHitType('tag')).toBeNull();
  });
});

describe('hitsForFacet', () => {
  const hits = [hit('game', 'g1'), hit('user', 'u1'), hit('tag', 't1'), hit('tier-list', 'tl1')];

  it('returns everything for All, including unfaceted types', () => {
    expect(hitsForFacet(hits, 'all')).toHaveLength(4);
  });

  it('narrows to the facet types only', () => {
    expect(hitsForFacet(hits, 'games').map((h) => h.id)).toEqual(['g1']);
    expect(hitsForFacet(hits, 'collections').map((h) => h.id)).toEqual(['tl1']);
  });

  /** An unfaceted type must stay reachable, which is what All is for. */
  it('keeps unfaceted hits out of every narrow facet', () => {
    for (const facet of SEARCH_FACET_ORDER) {
      if (facet === 'all') {
        continue;
      }
      expect(hitsForFacet([hit('tag', 't1')], facet)).toEqual([]);
    }
    expect(hitsForFacet([hit('tag', 't1')], 'all')).toHaveLength(1);
  });
});

describe('countByFacet', () => {
  it('counts All as the total and each facet as its own share', () => {
    const counts = countByFacet([hit('game', 'g1'), hit('game', 'g2'), hit('post', 'p1')]);

    expect(counts.all).toBe(3);
    expect(counts.games).toBe(2);
    expect(counts.players).toBe(0);
  });
});

describe('buildSearchFacetTabs', () => {
  it('drops facets with nothing in them', () => {
    const tabs = buildSearchFacetTabs([hit('game', 'g1'), hit('user', 'u1')]);

    expect(tabs.map((tab) => tab.id)).toEqual(['all', 'games', 'players']);
  });

  it('always keeps All so the strip is never empty', () => {
    expect(buildSearchFacetTabs([]).map((tab) => tab.id)).toEqual(['all']);
  });

  it('carries counts onto the tabs', () => {
    const tabs = buildSearchFacetTabs([hit('game', 'g1'), hit('game', 'g2')]);
    expect(tabs.find((tab) => tab.id === 'games')?.count).toBe(2);
  });

  it('labels every facet it can render', () => {
    for (const facet of SEARCH_FACET_ORDER) {
      expect(SEARCH_FACET_LABELS[facet].length).toBeGreaterThan(0);
    }
  });
});

describe('resolveActiveFacet', () => {
  /**
   * Pages arrive after the first render. A facet chosen when it had hits can
   * empty out; leaving it selected strands the user on a blank tab.
   */
  it('falls back to All when the chosen facet has emptied', () => {
    expect(resolveActiveFacet('players', [hit('game', 'g1')])).toBe('all');
  });

  it('keeps the chosen facet while it still has hits', () => {
    expect(resolveActiveFacet('games', [hit('game', 'g1')])).toBe('games');
  });

  it('never overrides an explicit All', () => {
    expect(resolveActiveFacet('all', [])).toBe('all');
  });
});

describe('buildSearchSuggestions', () => {
  it('groups by facet in facet order and caps each group', () => {
    const hits = [
      hit('user', 'u1'),
      ...Array.from({ length: SUGGESTIONS_PER_GROUP + 2 }, (_, i) => hit('game', `g${String(i)}`)),
    ];

    const groups = buildSearchSuggestions(hits);

    expect(groups.map((group) => group.facet)).toEqual(['games', 'players']);
    expect(groups[0]?.hits).toHaveLength(SUGGESTIONS_PER_GROUP);
    expect(groups[0]?.overflow).toBe(2);
  });

  it('omits empty groups and reports no overflow for short ones', () => {
    const groups = buildSearchSuggestions([hit('user', 'u1')]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.overflow).toBe(0);
  });

  it('never emits an All group — All is the absence of a filter', () => {
    const groups = buildSearchSuggestions([hit('game', 'g1')]);
    expect(groups.some((group) => group.facet === 'all')).toBe(false);
  });
});

describe('shouldRememberQuery', () => {
  it('ignores a query that is barely a keystroke', () => {
    expect(shouldRememberQuery('a', 'typed')).toBe(false);
    expect(shouldRememberQuery('a'.repeat(MIN_REMEMBERED_QUERY_LENGTH), 'typed')).toBe(true);
  });

  /** Re-running history must not reorder history under the user. */
  it('does not re-remember a query that came from history', () => {
    expect(shouldRememberQuery('hollow knight', 'recent')).toBe(false);
  });

  it('remembers trending, suggestion, and voice queries alike', () => {
    for (const source of ['trending', 'suggestion', 'voice'] as const) {
      expect(shouldRememberQuery('celeste', source)).toBe(true);
    }
  });

  it('treats whitespace as empty', () => {
    expect(shouldRememberQuery('    ', 'typed')).toBe(false);
  });
});

describe('buildTrendingSearchTerms', () => {
  it('de-duplicates case-insensitively and keeps first-seen casing', () => {
    expect(buildTrendingSearchTerms(['Celeste', 'celeste', 'Hades'])).toEqual(['Celeste', 'Hades']);
  });

  it('drops blank titles and honours the limit', () => {
    expect(buildTrendingSearchTerms(['  ', 'A', 'B', 'C'], 2)).toEqual(['A', 'B']);
  });

  it('trims surrounding whitespace so the chip matches the query sent', () => {
    expect(buildTrendingSearchTerms(['  Hades  '])).toEqual(['Hades']);
  });
});
