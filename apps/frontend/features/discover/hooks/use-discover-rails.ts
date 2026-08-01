import { DISCOVER_LIST_DEFAULT_LIMIT } from '@gmrlog/validators';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { queryKeys } from '../../../src/query/query-client';

import { buildDiscoverRails, RAIL_LIMIT, type DiscoverRailModel } from './discover-sections-model';

export type DiscoverRailsStatus = 'loading' | 'error' | 'empty' | 'ready';

export interface DiscoverRailsViewModel {
  status: DiscoverRailsStatus;
  rails: DiscoverRailModel[];
  error: unknown;
  isRefreshing: boolean;
}

/**
 * Every read behind the Discover rails, issued in parallel.
 *
 * `useQueries` rather than seven `useQuery` calls so the whole shelf resolves in
 * one round of requests instead of a waterfall, and so a single failing rail
 * cannot blank the screen: the hub is in `error` only when *nothing* resolved.
 * A dead recommendation service should cost you that shelf, not Discover.
 *
 * The catalog page is fetched at a larger limit than a rail shows because four
 * rails are projections over it — asking for twelve games and then filtering to
 * "released in the last 90 days" would usually yield nothing.
 */
const CATALOG_PAGE_LIMIT = 60;

export function useDiscoverRails(): DiscoverRailsViewModel & {
  refresh: () => Promise<void>;
  refetch: () => void;
} {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const results = useQueries({
    queries: [
      {
        queryKey: queryKeys.library.entries(),
        queryFn: async () => (await api.listLibraryEntries()).data,
      },
      {
        queryKey: queryKeys.discover.recommended(),
        queryFn: async () =>
          (await api.listDiscoverRecommended({ limit: RAIL_LIMIT })).data.map((row) => row.game),
      },
      {
        queryKey: queryKeys.feed.home('games'),
        queryFn: async () =>
          (await api.listHomeFeed({ limit: DISCOVER_LIST_DEFAULT_LIMIT, filter: 'games' })).data,
      },
      {
        queryKey: queryKeys.discover.trending('7d'),
        queryFn: async () =>
          (await api.listDiscoverTrending({ window: '7d', entity: 'games', limit: RAIL_LIMIT }))
            .data,
      },
      {
        queryKey: queryKeys.discover.popular(),
        queryFn: async () => (await api.listDiscoverPopular({ limit: RAIL_LIMIT })).data,
      },
      {
        queryKey: queryKeys.discover.hiddenGems(),
        queryFn: async () => (await api.listDiscoverHiddenGems({ limit: RAIL_LIMIT })).data,
      },
      {
        queryKey: [...queryKeys.discover.games(), 'rails'] as const,
        queryFn: async () => (await api.listDiscoverGames({ limit: CATALOG_PAGE_LIMIT })).data,
      },
    ],
  });

  const [library, recommended, friendsFeed, trending, popular, hiddenGems, catalog] = results;

  const rails = useMemo(
    () =>
      buildDiscoverRails({
        continuePlaying: library.data ?? [],
        recommended: recommended.data ?? [],
        friendsFeed: friendsFeed.data ?? [],
        trending: trending.data ?? [],
        popular: popular.data ?? [],
        hiddenGems: hiddenGems.data ?? [],
        catalog: catalog.data ?? [],
        nowMs: Date.now(),
      }),
    [
      library.data,
      recommended.data,
      friendsFeed.data,
      trending.data,
      popular.data,
      hiddenGems.data,
      catalog.data,
    ],
  );

  const isPending = results.some((result) => result.isPending);
  const allFailed = results.every((result) => result.isError);
  const firstError = results.find((result) => result.isError)?.error ?? null;
  const isRefreshing = results.some((result) => result.isRefetching) && !isPending;

  const status: DiscoverRailsStatus = allFailed
    ? 'error'
    : isPending && rails.length === 0
      ? 'loading'
      : rails.length === 0
        ? 'empty'
        : 'ready';

  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.discover.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.library.entries() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.home('games') }),
    ]);
  }, [queryClient]);

  const refetch = useCallback(() => {
    for (const result of results) {
      void result.refetch();
    }
  }, [results]);

  return { status, rails, error: firstError, isRefreshing, refresh, refetch };
}
