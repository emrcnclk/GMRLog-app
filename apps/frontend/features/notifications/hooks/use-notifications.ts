import type { NotificationResponse } from '@gmrlog/types';
import { NOTIFICATION_LIST_DEFAULT_LIMIT, notificationsReadSchema } from '@gmrlog/validators';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { durableMeta, runOrEnqueueOffline } from '../../../src/offline';
import { getNextPageParam, queryKeys } from '../../../src/query/query-client';

import {
  markAllNotificationsReadInCache,
  markNotificationReadInCache,
  resolveNotificationsView,
  type NotificationsInfiniteData,
} from './notification-model';

export function useNotifications() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: ({ pageParam }) =>
      api.listNotifications({
        limit: NOTIFICATION_LIST_DEFAULT_LIMIT,
        ...(pageParam !== undefined ? { cursor: pageParam } : {}),
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.meta),
  });

  const items: NotificationResponse[] = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data?.pages],
  );

  const view = resolveNotificationsView({
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    items,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
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

export function useMarkNotificationRead() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const listKey = queryKeys.notifications.list();

  return useMutation({
    meta: durableMeta('notifications.markRead'),
    mutationFn: async (notificationId: string) => {
      const body = notificationsReadSchema.parse({ ids: [notificationId] });
      await runOrEnqueueOffline('notifications.markRead', { ids: [notificationId] }, async () => {
        await api.markNotificationsRead(body);
      });
      return notificationId;
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<NotificationsInfiniteData>(listKey);
      const readAt = new Date().toISOString();
      queryClient.setQueryData(
        listKey,
        markNotificationReadInCache(previous, notificationId, readAt),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listKey, context.previous);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: listKey });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const listKey = queryKeys.notifications.list();

  return useMutation({
    meta: durableMeta('notifications.markAllRead'),
    mutationFn: async () => {
      const body = notificationsReadSchema.parse({ all: true });
      await runOrEnqueueOffline('notifications.markAllRead', { all: true }, async () => {
        await api.markNotificationsRead(body);
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<NotificationsInfiniteData>(listKey);
      const readAt = new Date().toISOString();
      queryClient.setQueryData(listKey, markAllNotificationsReadInCache(previous, readAt));
      return { previous };
    },
    onError: (_error, _void, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listKey, context.previous);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: listKey });
    },
  });
}
