import type { ActivityItemResponse, FeedItemResponse } from '@gmrlog/types';
import { ACTIVITY_LIST_DEFAULT_LIMIT } from '@gmrlog/validators';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { getNextPageParam, queryKeys } from '../../../src/query/query-client';

import { resolveHomeFeedView } from './activity-feed-model';

export {
  ACTIVITY_KIND_MESSAGE,
  activityKindIconName,
  formatActivityTime,
  resolveActivityMessage,
  resolveHomeFeedView,
  type HomeFeedStatus,
  type HomeFeedViewModel,
} from './activity-feed-model';

/** Map hybrid FeedItem → ActivityItem shape for shared Home cards. */
function feedItemToActivity(item: FeedItemResponse): ActivityItemResponse {
  return {
    id: item.id,
    kind: item.kind,
    createdAt: item.occurredAt,
    readAt: null,
    actor: item.actor,
    objectRef: item.object,
    messageKey: item.kind,
  };
}

export function useActivityFeed(filter?: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const feedFilter =
    filter === 'following' ||
    filter === 'games' ||
    filter === 'reviews' ||
    filter === 'media' ||
    filter === 'communities' ||
    filter === 'events'
      ? filter
      : 'for_you';

  const query = useInfiniteQuery({
    queryKey: queryKeys.feed.home(feedFilter),
    queryFn: ({ pageParam }) =>
      api.listHomeFeed({
        limit: ACTIVITY_LIST_DEFAULT_LIMIT,
        filter: feedFilter,
        ...(pageParam !== undefined ? { cursor: pageParam } : {}),
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.meta),
  });

  const items: ActivityItemResponse[] = useMemo(
    () => query.data?.pages.flatMap((page) => page.data.map(feedItemToActivity)) ?? [],
    [query.data?.pages],
  );

  const view = resolveHomeFeedView({
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    items,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.feed.all });
  }, [queryClient]);

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);

  return {
    ...view,
    refresh,
    loadMore,
    refetch: query.refetch,
  };
}
