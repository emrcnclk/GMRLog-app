import type {
  EventResponse,
  FeedItemResponse,
  GameHubCollectionSummaryResponse,
  GameHubCommunitySummaryResponse,
  GameHubPlayerResponse,
  PostResponse,
} from '@gmrlog/types';
import { ACTIVITY_LIST_DEFAULT_LIMIT } from '@gmrlog/validators';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { getNextPageParam, queryKeys } from '../../../src/query/query-client';

import { resolveListView } from './content-model';

export function useGameTimeline(gameId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: queryKeys.games.feed(gameId),
    enabled: gameId.length > 0,
    queryFn: ({ pageParam }) =>
      api.listGameFeed(gameId, {
        limit: ACTIVITY_LIST_DEFAULT_LIMIT,
        ...(pageParam !== undefined ? { cursor: pageParam } : {}),
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.meta),
  });

  const items: FeedItemResponse[] = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data?.pages],
  );

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.games.feed(gameId) });
  }, [gameId, queryClient]);

  return {
    items,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    refresh,
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) {
        void query.fetchNextPage();
      }
    },
    refetch: query.refetch,
  };
}

function useGameHubList<T>(
  gameId: string,
  queryKey: readonly unknown[],
  fetcher: (id: string) => Promise<{ data: T[] }>,
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey,
    enabled: gameId.length > 0,
    queryFn: async () => {
      const envelope = await fetcher(gameId);
      return envelope.data;
    },
  });

  const items = query.data ?? [];
  const view = resolveListView({
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    items,
    isRefreshing: query.isRefetching,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return { ...view, refresh, refetch: query.refetch };
}

export function useGameGuides(gameId: string) {
  const api = useApiClient();
  return useGameHubList<PostResponse>(gameId, queryKeys.games.guides(gameId), (id) =>
    api.listGameGuides(id),
  );
}

export function useGameScreenshots(gameId: string) {
  const api = useApiClient();
  return useGameHubList<PostResponse>(gameId, queryKeys.games.screenshots(gameId), (id) =>
    api.listGameScreenshots(id),
  );
}

export function useGameHubCollections(gameId: string) {
  const api = useApiClient();
  return useGameHubList<GameHubCollectionSummaryResponse>(
    gameId,
    queryKeys.games.collections(gameId),
    (id) => api.listGameCollections(id),
  );
}

export function useGameHubEvents(gameId: string) {
  const api = useApiClient();
  return useGameHubList<EventResponse>(gameId, queryKeys.games.events(gameId), (id) =>
    api.listGameEvents(id),
  );
}

export function useGameHubCommunities(gameId: string) {
  const api = useApiClient();
  return useGameHubList<GameHubCommunitySummaryResponse>(
    gameId,
    queryKeys.games.communities(gameId),
    (id) => api.listGameCommunities(id),
  );
}

export function useGameHubPlayers(gameId: string) {
  const api = useApiClient();
  return useGameHubList<GameHubPlayerResponse>(gameId, queryKeys.games.players(gameId), (id) =>
    api.listGamePlayers(id),
  );
}
