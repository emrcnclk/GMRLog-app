export { SearchScreen } from './search-screen';
export { SearchBar } from './components/search-bar';
export { SearchResultCard } from './components/search-result-card';
export { SearchSectionHeader } from './components/search-section-header';
export { RecentSearchChip, RecentSearches } from './components/recent-search-chip';
export { SearchSkeleton, SearchResultSkeleton } from './components/search-skeleton';
export { EmptySearch } from './components/empty-search';
export { SearchErrorState } from './components/search-error-state';
export { useRecentSearches, useSearchResults } from './hooks/use-search';
export {
  useDebouncedValue,
  SEARCH_DEBOUNCE_MS,
  normalizeSearchQuery,
  resolveSearchScreenView,
  routeForSearchHit,
  searchHitKey,
  type SearchScreenStatus,
} from './hooks/search-model';
export {
  upsertRecentSearch,
  removeRecentSearch,
  loadRecentSearches,
  saveRecentSearches,
  RECENT_SEARCHES_MAX,
} from './storage/recent-searches';
export { TrendingSearches } from './components/trending-searches';
export { SearchSuggestions } from './components/search-suggestions';
export { useTrendingSearches } from './hooks/use-trending-searches';
export {
  buildSearchFacetTabs,
  buildSearchSuggestions,
  buildTrendingSearchTerms,
  countByFacet,
  facetForHitType,
  hitsForFacet,
  resolveActiveFacet,
  shouldRememberQuery,
  SEARCH_FACET_ORDER,
  SEARCH_FACET_LABELS,
  type SearchFacetId,
  type SearchQuerySource,
  type SearchSuggestionGroup,
} from './hooks/search-facets-model';
