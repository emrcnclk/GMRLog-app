import type { SearchHit } from '@gmrlog/types';
import { Screen, SegmentedTabs, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';

import { useConnectivityStore } from '../../src/state/stores';

import { EmptySearch } from './components/empty-search';
import { RecentSearches } from './components/recent-search-chip';
import { SearchBar } from './components/search-bar';
import { SearchErrorState } from './components/search-error-state';
import { SearchRefreshContainer } from './components/search-refresh-container';
import { SearchResultsList } from './components/search-results-list';
import { SearchSectionHeader } from './components/search-section-header';
import { SearchSkeleton } from './components/search-skeleton';
import { SearchSuggestions } from './components/search-suggestions';
import { TrendingSearches } from './components/trending-searches';
import {
  buildSearchFacetTabs,
  buildSearchSuggestions,
  hitsForFacet,
  resolveActiveFacet,
  shouldRememberQuery,
  type SearchFacetId,
  type SearchQuerySource,
} from './hooks/search-facets-model';
import { routeForSearchHit } from './hooks/search-model';
import { useRecentSearches, useSearchResults } from './hooks/use-search';
import { useTrendingSearches } from './hooks/use-trending-searches';

/**
 * Universal search — one query, every entity, grouped (D3.28 Phase 2).
 *
 * `GET /search` returns a flat mixed list and takes no type filter, so faceting
 * happens client-side over the loaded pages. That is why the tab counts describe
 * what is loaded rather than what exists, and why switching tabs is instant
 * instead of issuing another request.
 */
export function SearchScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const [query, setQuery] = useState('');
  const [requestedFacet, setRequestedFacet] = useState<SearchFacetId>('all');

  const recent = useRecentSearches();
  const trending = useTrendingSearches();
  const search = useSearchResults(query);

  /**
   * The single entry point for "search for this".
   *
   * Every caller — typing, a recent chip, a trending chip, a suggestion, and in
   * future a spoken phrase — arrives here with its provenance attached. Nothing
   * downstream knows or cares which it was, which is what makes adding voice a
   * new call site rather than a refactor.
   */
  const submitQuery = useCallback(
    (value: string, source: SearchQuerySource) => {
      const trimmed = value.trim();
      setQuery(trimmed);
      setRequestedFacet('all');
      if (shouldRememberQuery(trimmed, source)) {
        void recent.remember(trimmed);
      }
    },
    [recent],
  );

  const activeFacet = resolveActiveFacet(requestedFacet, search.items);
  const facetTabs = useMemo(() => buildSearchFacetTabs(search.items), [search.items]);
  const facetHits = useMemo(
    () => hitsForFacet(search.items, activeFacet),
    [search.items, activeFacet],
  );
  const suggestions = useMemo(() => buildSearchSuggestions(search.items), [search.items]);

  const onPressHit = useCallback(
    (hit: SearchHit) => {
      const href = routeForSearchHit(hit);
      if (href) {
        if (shouldRememberQuery(search.normalizedQuery, 'typed')) {
          void recent.remember(search.normalizedQuery);
        }
        router.push(href);
      }
    },
    [recent, router, search.normalizedQuery],
  );

  /**
   * Suggestions show only until the query settles. Once results are real, the
   * faceted list is the better surface — keeping both would mean two competing
   * answers to the same question.
   */
  const showSuggestions =
    search.status === 'results' && search.normalizedQuery !== search.debouncedQuery;

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        onClear={() => {
          setQuery('');
          setRequestedFacet('all');
        }}
        onSubmit={() => {
          submitQuery(query, 'typed');
        }}
      />

      {search.status === 'recent' ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: theme.space('space.8') }}
        >
          {recent.recents.length > 0 ? (
            <>
              <SearchSectionHeader title="Recent searches" />
              <RecentSearches
                items={recent.recents}
                onSelect={(item) => {
                  submitQuery(item, 'recent');
                }}
                onRemove={(item) => {
                  void recent.forget(item);
                }}
                onClearAll={() => {
                  void recent.clear();
                }}
              />
            </>
          ) : null}

          <SearchSectionHeader title="Trending on GMRLOG" />
          <TrendingSearches
            terms={trending.terms}
            isPending={trending.isPending}
            onSelect={(term) => {
              submitQuery(term, 'trending');
            }}
          />

          {recent.recents.length === 0 && trending.terms.length === 0 && !trending.isPending ? (
            <EmptySearch />
          ) : null}
        </ScrollView>
      ) : null}

      {search.status === 'searching' ? <SearchSkeleton /> : null}

      {search.status === 'error' ? (
        <SearchRefreshContainer refreshing={search.isRefreshing} onRefresh={search.refresh}>
          <SearchErrorState
            isOffline={!isOnline}
            onRetry={() => {
              void search.refetch();
            }}
          />
        </SearchRefreshContainer>
      ) : null}

      {search.status === 'empty' ? (
        <SearchRefreshContainer refreshing={search.isRefreshing} onRefresh={search.refresh}>
          <EmptySearch query={search.debouncedQuery} />
        </SearchRefreshContainer>
      ) : null}

      {search.status === 'results' ? (
        <>
          <SegmentedTabs
            items={facetTabs}
            activeId={activeFacet}
            onChange={setRequestedFacet}
            variant="pill"
            accessibilityLabel="Filter results by type"
          />

          {showSuggestions ? (
            <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
              <SearchSuggestions
                groups={suggestions}
                onPressHit={onPressHit}
                onSeeAll={setRequestedFacet}
              />
            </ScrollView>
          ) : (
            <SearchResultsList
              items={facetHits}
              refreshing={search.isRefreshing}
              onRefresh={search.refresh}
              // Paginating a client-side facet would fetch pages the active tab
              // may discard, so only the unfiltered view drives the cursor.
              onEndReached={activeFacet === 'all' ? search.loadMore : () => undefined}
              isFetchingNextPage={search.isFetchingNextPage}
              onPressHit={onPressHit}
            />
          )}
        </>
      ) : null}
    </Screen>
  );
}
