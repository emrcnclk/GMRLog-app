import type { SearchHit, SearchHitType } from '@gmrlog/types';
import type { SegmentedTabItem } from '@gmrlog/ui';

/**
 * D3.28 Search facets, suggestions, and query provenance. Pure functions only —
 * covered by `search-facets-model.spec.ts`.
 *
 * `GET /search` returns one flat, mixed `SearchHit[]` and takes no type filter.
 * Faceting is therefore **client-side over the pages already fetched**, not a
 * narrower server query: switching to "Players" re-groups what is loaded rather
 * than issuing a new search. That is the honest reading of the counts on the
 * tabs — they describe the loaded window, and they grow as more pages arrive.
 */

export type SearchFacetId = 'all' | 'games' | 'players' | 'reviews' | 'collections' | 'communities';

export const SEARCH_FACET_ORDER: readonly SearchFacetId[] = [
  'all',
  'games',
  'players',
  'reviews',
  'collections',
  'communities',
];

export const SEARCH_FACET_LABELS: Record<SearchFacetId, string> = {
  all: 'All',
  games: 'Games',
  players: 'Players',
  reviews: 'Reviews',
  collections: 'Collections',
  communities: 'Communities',
};

/**
 * Which hit types each facet claims.
 *
 * A tier list is a curated ordering of games, so it belongs with collections —
 * a player looking for "someone's list of soulslikes" does not care which of the
 * two shapes it was saved as. Types no facet claims (`post`, `event`,
 * `achievement`, `tag`) are reachable through **All**, which is why All is the
 * default and is never itself a filter.
 */
const FACET_TYPES: Record<Exclude<SearchFacetId, 'all'>, readonly SearchHitType[]> = {
  games: ['game'],
  players: ['user'],
  reviews: ['review'],
  collections: ['collection', 'tier-list'],
  communities: ['community'],
};

export function facetForHitType(type: SearchHitType): SearchFacetId | null {
  for (const facet of SEARCH_FACET_ORDER) {
    if (facet === 'all') {
      continue;
    }
    if (FACET_TYPES[facet].includes(type)) {
      return facet;
    }
  }
  return null;
}

export function hitsForFacet(hits: readonly SearchHit[], facet: SearchFacetId): SearchHit[] {
  if (facet === 'all') {
    return [...hits];
  }
  const types = FACET_TYPES[facet];
  return hits.filter((hit) => types.includes(hit.type));
}

export function countByFacet(hits: readonly SearchHit[]): Record<SearchFacetId, number> {
  const counts: Record<SearchFacetId, number> = {
    all: hits.length,
    games: 0,
    players: 0,
    reviews: 0,
    collections: 0,
    communities: 0,
  };

  for (const hit of hits) {
    const facet = facetForHitType(hit.type);
    if (facet !== null) {
      counts[facet] += 1;
    }
  }

  return counts;
}

/**
 * Tab strip for the facets that actually matched.
 *
 * A facet with nothing in it is dropped rather than shown at zero: an empty tab
 * invites a tap that leads to an empty screen, and five of those make a working
 * search feel broken. **All** always survives so there is never a tabless state.
 */
export function buildSearchFacetTabs(
  hits: readonly SearchHit[],
): SegmentedTabItem<SearchFacetId>[] {
  const counts = countByFacet(hits);

  return SEARCH_FACET_ORDER.flatMap((id) => {
    if (id !== 'all' && counts[id] === 0) {
      return [];
    }
    return [{ id, label: SEARCH_FACET_LABELS[id], count: counts[id] }];
  });
}

/**
 * Keep the selected facet honest as results stream in.
 *
 * Pages arrive after the first render, so a facet that was populated can empty
 * out (a filter change) or a chosen facet can vanish entirely. Rather than
 * leaving the user staring at an empty tab that is still highlighted, fall back
 * to All.
 */
export function resolveActiveFacet(
  requested: SearchFacetId,
  hits: readonly SearchHit[],
): SearchFacetId {
  if (requested === 'all') {
    return 'all';
  }
  return countByFacet(hits)[requested] > 0 ? requested : 'all';
}

export interface SearchSuggestionGroup {
  facet: SearchFacetId;
  label: string;
  hits: SearchHit[];
  /** Hits in this facet beyond the ones shown. */
  overflow: number;
}

/** Instant-suggestion rows per group — enough to orient, not enough to scroll. */
export const SUGGESTIONS_PER_GROUP = 3;

/**
 * Instant suggestions: the strongest few hits per facet, in facet order.
 *
 * This is what shows while the query is still being typed. Grouping matters
 * more than ranking here — seeing "3 games, 2 players" tells you whether to
 * keep typing or to switch tabs, which a flat list of ten mixed rows does not.
 */
export function buildSearchSuggestions(
  hits: readonly SearchHit[],
  perGroup = SUGGESTIONS_PER_GROUP,
): SearchSuggestionGroup[] {
  return SEARCH_FACET_ORDER.flatMap((facet) => {
    if (facet === 'all') {
      return [];
    }
    const matching = hitsForFacet(hits, facet);
    if (matching.length === 0) {
      return [];
    }
    return [
      {
        facet,
        label: SEARCH_FACET_LABELS[facet],
        hits: matching.slice(0, perGroup),
        overflow: Math.max(0, matching.length - perGroup),
      },
    ];
  });
}

/**
 * Where a query came from.
 *
 * Search must not care whether a string was typed, tapped from history, or
 * spoken. Threading the source through instead of assuming the keyboard is what
 * makes a voice entry point a new caller rather than a rewrite — the
 * "voice-ready architecture" the brief asks for. No speech recognition ships in
 * D3.28; this is the seam it would attach to.
 */
export type SearchQuerySource = 'typed' | 'recent' | 'trending' | 'suggestion' | 'voice';

/** A query worth remembering. One character is a keystroke, not an intent. */
export const MIN_REMEMBERED_QUERY_LENGTH = 2;

export function shouldRememberQuery(query: string, source: SearchQuerySource): boolean {
  if (source === 'recent') {
    return false;
  }
  return query.trim().length >= MIN_REMEMBERED_QUERY_LENGTH;
}

/**
 * Trending search terms.
 *
 * There is no trending-queries endpoint and the backend is frozen, so these are
 * the titles of currently trending games — real, current, and searchable. The UI
 * labels the section "Trending on GMRLOG" rather than "Trending searches",
 * because these are not what people searched for and it would be a lie to say
 * they were.
 */
export function buildTrendingSearchTerms(trendingTitles: readonly string[], limit = 8): string[] {
  const seen = new Set<string>();
  const terms: string[] = [];

  for (const title of trendingTitles) {
    const trimmed = title.trim();
    const key = trimmed.toLowerCase();
    if (trimmed.length === 0 || seen.has(key)) {
      continue;
    }
    seen.add(key);
    terms.push(trimmed);
    if (terms.length >= limit) {
      break;
    }
  }

  return terms;
}
