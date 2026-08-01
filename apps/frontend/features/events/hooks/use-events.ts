import type { ApiEnvelope, EventResponse } from '@gmrlog/types';
import { DISCOVER_LIST_DEFAULT_LIMIT } from '@gmrlog/validators';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { durableMeta, runOrEnqueueOffline } from '../../../src/offline';
import { getNextPageParam, queryKeys } from '../../../src/query/query-client';

import {
  optimisticJoin,
  optimisticLeave,
  optimisticRsvp,
  patchEventInDiscoverPages,
  resolveEventsView,
} from './event-model';

type DiscoverEventsData = InfiniteData<ApiEnvelope<EventResponse[]>>;

/** Events list — `GET /discover/events` (cursor). */
export function useEvents() {
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

  const view = resolveEventsView({
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

export function useEvent(eventId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.events.detail(eventId),
    enabled: eventId.length > 0,
    queryFn: async () => {
      const envelope = await api.getEvent(eventId);
      return envelope.data;
    },
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
  }, [eventId, queryClient]);

  return {
    event: query.data ?? null,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    isRefreshing: query.isRefetching,
    refresh,
    refetch: query.refetch,
  };
}

export function useRsvpEvent(eventId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (state: import('@gmrlog/types').EventParticipationStateValue) => {
      const envelope = await api.rsvpEvent(eventId, { state });
      return envelope.data;
    },
    onMutate: async (state) => {
      const detailKey = queryKeys.events.detail(eventId);
      const listKey = queryKeys.discover.events();
      await queryClient.cancelQueries({ queryKey: detailKey });
      await queryClient.cancelQueries({ queryKey: listKey });
      const previousDetail = queryClient.getQueryData<EventResponse>(detailKey);
      const previousList = queryClient.getQueryData<DiscoverEventsData>(listKey);
      if (previousDetail) {
        const next = optimisticRsvp(previousDetail, state);
        queryClient.setQueryData(detailKey, next);
        if (previousList) {
          queryClient.setQueryData(listKey, {
            ...previousList,
            pages: patchEventInDiscoverPages(previousList.pages, next) ?? previousList.pages,
          });
        }
      }
      return { previousDetail, previousList };
    },
    onError: (_error, _state, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(queryKeys.events.detail(eventId), context.previousDetail);
      }
      if (context?.previousList) {
        queryClient.setQueryData(queryKeys.discover.events(), context.previousList);
      }
    },
    onSuccess: (event) => {
      queryClient.setQueryData(queryKeys.events.detail(eventId), event);
      void queryClient.invalidateQueries({ queryKey: queryKeys.discover.events() });
      if (event.gameId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.games.events(event.gameId) });
      }
    },
  });
}

export function useJoinEvent(eventId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    meta: durableMeta('event.join'),
    mutationFn: async () => {
      await runOrEnqueueOffline('event.join', { eventId }, async () => {
        await api.joinEvent(eventId);
      });
    },
    onMutate: async () => {
      const detailKey = queryKeys.events.detail(eventId);
      const listKey = queryKeys.discover.events();
      await queryClient.cancelQueries({ queryKey: detailKey });
      await queryClient.cancelQueries({ queryKey: listKey });
      const previousDetail = queryClient.getQueryData<EventResponse>(detailKey);
      const previousList = queryClient.getQueryData<DiscoverEventsData>(listKey);
      if (previousDetail) {
        const next = optimisticJoin(previousDetail);
        queryClient.setQueryData(detailKey, next);
        if (previousList) {
          queryClient.setQueryData(listKey, {
            ...previousList,
            pages: patchEventInDiscoverPages(previousList.pages, next) ?? previousList.pages,
          });
        }
      }
      return { previousDetail, previousList };
    },
    onError: (_error, _void, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(queryKeys.events.detail(eventId), context.previousDetail);
      }
      if (context?.previousList) {
        queryClient.setQueryData(queryKeys.discover.events(), context.previousList);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.discover.events() });
    },
  });
}

export function useLeaveEvent(eventId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    meta: durableMeta('event.leave'),
    mutationFn: async () => {
      await runOrEnqueueOffline('event.leave', { eventId }, async () => {
        await api.leaveEvent(eventId);
      });
    },
    onMutate: async () => {
      const detailKey = queryKeys.events.detail(eventId);
      const listKey = queryKeys.discover.events();
      await queryClient.cancelQueries({ queryKey: detailKey });
      await queryClient.cancelQueries({ queryKey: listKey });
      const previousDetail = queryClient.getQueryData<EventResponse>(detailKey);
      const previousList = queryClient.getQueryData<DiscoverEventsData>(listKey);
      if (previousDetail) {
        const next = optimisticLeave(previousDetail);
        queryClient.setQueryData(detailKey, next);
        if (previousList) {
          queryClient.setQueryData(listKey, {
            ...previousList,
            pages: patchEventInDiscoverPages(previousList.pages, next) ?? previousList.pages,
          });
        }
      }
      return { previousDetail, previousList };
    },
    onError: (_error, _void, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(queryKeys.events.detail(eventId), context.previousDetail);
      }
      if (context?.previousList) {
        queryClient.setQueryData(queryKeys.discover.events(), context.previousList);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.discover.events() });
    },
  });
}
