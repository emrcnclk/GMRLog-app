import type { SearchHit } from '@gmrlog/types';
import { Screen } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { useConnectivityStore } from '../../src/state/stores';

import { EmptySearch } from './components/empty-search';
import { RecentSearches } from './components/recent-search-chip';
import { SearchBar } from './components/search-bar';
import { SearchErrorState } from './components/search-error-state';
import { SearchRefreshContainer } from './components/search-refresh-container';
import { SearchResultsList } from './components/search-results-list';
import { SearchSectionHeader } from './components/search-section-header';
import { SearchSkeleton } from './components/search-skeleton';
import { routeForSearchHit } from './hooks/search-model';
import { useRecentSearches, useSearchResults } from './hooks/use-search';

/**
 * Production Search — GET /search · debounce · recent · cursor pagination.
 */
export function SearchScreen() {
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const [query, setQuery] = useState('');
  const recent = useRecentSearches();
  const search = useSearchResults(query);

  const commitQuery = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      setQuery(trimmed);
      if (trimmed.length > 0) {
        await recent.remember(trimmed);
      }
    },
    [recent],
  );

  const onPressHit = useCallback(
    (hit: SearchHit) => {
      const href = routeForSearchHit(hit);
      if (href) {
        void recent.remember(search.normalizedQuery || query);
        router.push(href);
      }
    },
    [query, recent, router, search.normalizedQuery],
  );

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        onClear={() => {
          setQuery('');
        }}
        onSubmit={() => {
          void commitQuery(query);
        }}
      />

      {search.status === 'recent' ? (
        <>
          <SearchSectionHeader title="Recent searches" />
          <RecentSearches
            items={recent.recents}
            onSelect={(item) => {
              void commitQuery(item);
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
          <SearchSectionHeader title="Results" />
          <SearchResultsList
            items={search.items}
            refreshing={search.isRefreshing}
            onRefresh={search.refresh}
            onEndReached={search.loadMore}
            isFetchingNextPage={search.isFetchingNextPage}
            onPressHit={onPressHit}
          />
        </>
      ) : null}
    </Screen>
  );
}
