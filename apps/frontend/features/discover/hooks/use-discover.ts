import type {
  ApiEnvelope,
  CollectionResponse,
  GameCardResponse,
  RecommendedGameResponse,
} from '@gmrlog/types';
import { DISCOVER_LIST_DEFAULT_LIMIT } from '@gmrlog/validators';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { getNextPageParam, queryKeys } from '../../../src/query/query-client';

import { resolveDiscoverHubView, resolveDiscoverListView } from './discover-model';

export function useDiscoverHub() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.discover.hub(),
    queryFn: () => api.getDiscoverHub(),
  });

  const modules = query.data?.data.modules ?? [];
  const view = resolveDiscoverHubView({
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    modules,
    isRefreshing: query.isRefetching,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.discover.hub() });
  }, [queryClient]);

  return { ...view, refresh, refetch: query.refetch };
}

/**
 * `genreId` wires the hub's genre chips (`SCREEN_REDESIGNS.md` §7) to the real
 * `genreId` filter `GET /discover/games` already accepts — omitted, this is
 * the exact unfiltered browse the pre-3.7 screen already used.
 */
export function useDiscoverGames(genreId?: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: queryKeys.discover.games(genreId),
    queryFn: ({ pageParam }) =>
      api.listDiscoverGames({
        limit: DISCOVER_LIST_DEFAULT_LIMIT,
        ...(genreId !== undefined ? { genreId } : {}),
        ...(pageParam !== undefined ? { cursor: pageParam } : {}),
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.meta),
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data?.pages],
  );

  const view = resolveDiscoverListView({
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    items,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.discover.games(genreId) });
  }, [queryClient, genreId]);

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);

  return { ...view, refresh, loadMore, refetch: query.refetch };
}

export function useDiscoverCommunities() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: queryKeys.discover.communities(),
    queryFn: ({ pageParam }) =>
      api.listDiscoverCommunities({
        limit: DISCOVER_LIST_DEFAULT_LIMIT,
        ...(pageParam !== undefined ? { cursor: pageParam } : {}),
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.meta),
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data?.pages],
  );

  const view = resolveDiscoverListView({
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    items,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.discover.communities() });
  }, [queryClient]);

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);

  return { ...view, refresh, loadMore, refetch: query.refetch };
}

export function useDiscoverEvents() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: queryKeys.discover.events(),
    queryFn: ({ pageParam }) =>
      api.listDiscoverEvents({
        limit: DISCOVER_LIST_DEFAULT_LIMIT,
        ...(pageParam !== undefined ? { cursor: pageParam } : {}),
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.meta),
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data?.pages],
  );

  const view = resolveDiscoverListView({
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    items,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.discover.events() });
  }, [queryClient]);

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);

  return { ...view, refresh, loadMore, refetch: query.refetch };
}

function useDiscoverGamesList(
  queryKey: readonly unknown[],
  fetchPage: (cursor: string | undefined) => Promise<ApiEnvelope<GameCardResponse[]>>,
  invalidateKey: readonly unknown[],
) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.meta),
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data?.pages],
  );

  const view = resolveDiscoverListView({
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    items,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: invalidateKey });
  }, [invalidateKey, queryClient]);

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);

  return { ...view, refresh, loadMore, refetch: query.refetch };
}

export function useDiscoverTrending(window: '24h' | '7d' | '30d' = '7d') {
  const api = useApiClient();
  return useDiscoverGamesList(
    queryKeys.discover.trending(window),
    (cursor) =>
      api.listDiscoverTrending({
        window,
        entity: 'games',
        limit: DISCOVER_LIST_DEFAULT_LIMIT,
        ...(cursor !== undefined ? { cursor } : {}),
      }),
    queryKeys.discover.trending(window),
  );
}

export function useDiscoverPopular() {
  const api = useApiClient();
  return useDiscoverGamesList(
    queryKeys.discover.popular(),
    (cursor) =>
      api.listDiscoverPopular({
        limit: DISCOVER_LIST_DEFAULT_LIMIT,
        ...(cursor !== undefined ? { cursor } : {}),
      }),
    queryKeys.discover.popular(),
  );
}

export function useDiscoverHiddenGems() {
  const api = useApiClient();
  return useDiscoverGamesList(
    queryKeys.discover.hiddenGems(),
    (cursor) =>
      api.listDiscoverHiddenGems({
        limit: DISCOVER_LIST_DEFAULT_LIMIT,
        ...(cursor !== undefined ? { cursor } : {}),
      }),
    queryKeys.discover.hiddenGems(),
  );
}

export function useDiscoverRecommended() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: queryKeys.discover.recommended(),
    queryFn: ({ pageParam }) =>
      api.listDiscoverRecommended({
        limit: DISCOVER_LIST_DEFAULT_LIMIT,
        ...(pageParam !== undefined ? { cursor: pageParam } : {}),
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.meta),
  });

  const items = useMemo(
    () =>
      query.data?.pages.flatMap((page: ApiEnvelope<RecommendedGameResponse[]>) =>
        page.data.map((row) => row.game),
      ) ?? [],
    [query.data?.pages],
  );

  const view = resolveDiscoverListView({
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    items,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.discover.recommended() });
  }, [queryClient]);

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);

  return { ...view, refresh, loadMore, refetch: query.refetch };
}

export function useDiscoverCollections() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: queryKeys.discover.collections(),
    queryFn: ({ pageParam }) =>
      api.listDiscoverCollections({
        limit: DISCOVER_LIST_DEFAULT_LIMIT,
        ...(pageParam !== undefined ? { cursor: pageParam } : {}),
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.meta),
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page: ApiEnvelope<CollectionResponse[]>) => page.data) ?? [],
    [query.data?.pages],
  );

  const view = resolveDiscoverListView({
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    items,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.discover.collections() });
  }, [queryClient]);

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);

  return { ...view, refresh, loadMore, refetch: query.refetch };
}

export function useSimilarGames(gameId: string) {
  const api = useApiClient();
  const query = useQuery({
    queryKey: queryKeys.discover.similarGames(gameId),
    queryFn: async () => {
      const envelope = await api.listSimilarGames(gameId, { limit: 8 });
      return envelope.data;
    },
    enabled: gameId.length > 0,
  });

  return {
    items: query.data ?? [],
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useSimilarUsers(userId: string) {
  const api = useApiClient();
  const query = useQuery({
    queryKey: queryKeys.discover.similarUsers(userId),
    queryFn: async () => {
      const envelope = await api.listSimilarUsers(userId, { limit: 8 });
      return envelope.data;
    },
    enabled: userId.length > 0,
  });

  return {
    items: query.data ?? [],
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
