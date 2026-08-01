import type { SearchHit } from '@gmrlog/types';
import { SEARCH_LIST_DEFAULT_LIMIT } from '@gmrlog/validators';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { createExpoSecureStorage } from '../../../lib/storage/expo-secure-storage';
import type { SecureStorage } from '../../../lib/storage/secure-storage';
import { useApiClient } from '../../../src/api/api-provider';
import { getNextPageParam, queryKeys } from '../../../src/query/query-client';
import {
  loadRecentSearches,
  removeRecentSearch,
  saveRecentSearches,
  upsertRecentSearch,
} from '../storage/recent-searches';

import {
  normalizeSearchQuery,
  resolveSearchScreenView,
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from './search-model';

export function useRecentSearches(storage?: SecureStorage) {
  const store = useMemo(() => storage ?? createExpoSecureStorage(), [storage]);
  const [recents, setRecents] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadRecentSearches(store).then((items) => {
      if (!cancelled) {
        setRecents(items);
        setHydrated(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [store]);

  const remember = useCallback(
    async (query: string) => {
      const next = upsertRecentSearch(recents, query);
      setRecents(next);
      await saveRecentSearches(store, next);
    },
    [recents, store],
  );

  const forget = useCallback(
    async (query: string) => {
      const next = removeRecentSearch(recents, query);
      setRecents(next);
      await saveRecentSearches(store, next);
    },
    [recents, store],
  );

  const clear = useCallback(async () => {
    setRecents([]);
    await saveRecentSearches(store, []);
  }, [store]);

  return { recents, hydrated, remember, forget, clear };
}

export function useSearchResults(rawQuery: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const normalizedQuery = normalizeSearchQuery(rawQuery);
  const debouncedQuery = useDebouncedValue(normalizedQuery, SEARCH_DEBOUNCE_MS);
  const isDebouncing = normalizedQuery.length > 0 && normalizedQuery !== debouncedQuery;

  const query = useInfiniteQuery({
    queryKey: queryKeys.search.results(debouncedQuery),
    enabled: debouncedQuery.length > 0,
    queryFn: ({ pageParam, signal }) =>
      api.search(
        {
          q: debouncedQuery,
          limit: SEARCH_LIST_DEFAULT_LIMIT,
          ...(pageParam !== undefined ? { cursor: pageParam } : {}),
        },
        signal,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.meta),
  });

  const items: SearchHit[] = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data?.pages],
  );

  const view = resolveSearchScreenView({
    normalizedQuery,
    isDebouncing,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    items,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
  });

  const refresh = useCallback(async () => {
    if (debouncedQuery.length === 0) {
      return;
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.search.results(debouncedQuery) });
  }, [debouncedQuery, queryClient]);

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);

  return {
    ...view,
    normalizedQuery,
    debouncedQuery,
    refresh,
    loadMore,
    refetch: query.refetch,
  };
}
