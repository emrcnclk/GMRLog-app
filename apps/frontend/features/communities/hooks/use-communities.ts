import type { CommunityResponse } from '@gmrlog/types';
import type { CommunityCreateInput, CommunityPatchInput } from '@gmrlog/validators';
import { COMMUNITY_LIST_DEFAULT_LIMIT } from '@gmrlog/validators';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { durableMeta, runOrEnqueueOffline } from '../../../src/offline';
import { getNextPageParam, queryKeys } from '../../../src/query/query-client';

import { optimisticJoin, optimisticLeave, resolveListView } from './community-model';

/**
 * `GET /communities`, one page at a time (3b.1a).
 *
 * The endpoint used to return every discoverable community in a single array
 * and took 111,603 ms to do it — past the client's own 30s timeout, so this
 * hook never resolved. It is an infinite query now, the same shape the discover
 * lists already use, and the screen asks for the next page as it scrolls.
 */
export function useCommunities() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: queryKeys.communities.list(),
    queryFn: ({ pageParam }) =>
      api.listCommunities({
        limit: COMMUNITY_LIST_DEFAULT_LIMIT,
        ...(pageParam !== undefined ? { cursor: pageParam } : {}),
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.meta),
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data?.pages],
  );

  const view = resolveListView({
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    items,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.communities.list() });
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
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    refetch: query.refetch,
  };
}

export function useCommunity(communityId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.communities.detail(communityId),
    enabled: communityId.length > 0,
    queryFn: async () => {
      const envelope = await api.getCommunity(communityId);
      return envelope.data;
    },
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.communities.detail(communityId),
    });
  }, [communityId, queryClient]);

  return {
    community: query.data ?? null,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    isRefreshing: query.isRefetching,
    refresh,
    refetch: query.refetch,
  };
}

/**
 * §14's Feed tab — `GET /communities/{id}/feed`.
 *
 * Paginated from the start, in the shape 3b.1a settled on: the directory's
 * unpaginated list is the reason that task existed, and a community feed grows
 * the same way.
 */
export function useCommunityFeed(communityId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: queryKeys.communities.feed(communityId),
    enabled: communityId.length > 0,
    queryFn: ({ pageParam }) =>
      api.listCommunityFeed(communityId, {
        ...(pageParam !== undefined ? { cursor: pageParam } : {}),
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.meta),
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data?.pages],
  );

  const view = resolveListView({
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    items,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.communities.feed(communityId) });
  }, [communityId, queryClient]);

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);

  return {
    ...view,
    refresh,
    loadMore,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
  };
}

export function useCommunityMembers(communityId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.communities.members(communityId),
    enabled: communityId.length > 0,
    queryFn: async () => {
      const envelope = await api.listCommunityMembers(communityId);
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
    await queryClient.invalidateQueries({
      queryKey: queryKeys.communities.members(communityId),
    });
  }, [communityId, queryClient]);

  return { ...view, refresh, refetch: query.refetch };
}

export function useCreateCommunity() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CommunityCreateInput) => {
      const envelope = await api.createCommunity(input);
      return envelope.data;
    },
    onSuccess: (community) => {
      queryClient.setQueryData(queryKeys.communities.detail(community.id), community);
      void queryClient.invalidateQueries({ queryKey: queryKeys.communities.list() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.discover.communities() });
    },
  });
}

export function useUpdateCommunity(communityId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CommunityPatchInput) => {
      const envelope = await api.patchCommunity(communityId, input);
      return envelope.data;
    },
    onMutate: async (input) => {
      const key = queryKeys.communities.detail(communityId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CommunityResponse>(key);
      if (previous) {
        const optimistic: CommunityResponse = {
          ...previous,
          name: input.name ?? previous.name,
          description: input.description === undefined ? previous.description : input.description,
        };
        queryClient.setQueryData(key, optimistic);
        patchListItem(queryClient, optimistic);
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.communities.detail(communityId), context.previous);
        patchListItem(queryClient, context.previous);
      }
    },
    onSuccess: (community) => {
      queryClient.setQueryData(queryKeys.communities.detail(community.id), community);
      void queryClient.invalidateQueries({ queryKey: queryKeys.communities.list() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.discover.communities() });
    },
  });
}

export function useDeleteCommunity() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (communityId: string) => {
      await api.deleteCommunity(communityId);
      return communityId;
    },
    onMutate: async (communityId) => {
      const listKey = queryKeys.communities.list();
      const detailKey = queryKeys.communities.detail(communityId);
      await queryClient.cancelQueries({ queryKey: listKey });
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<CommunityListCache>(listKey);
      const previousDetail = queryClient.getQueryData<CommunityResponse>(detailKey);
      if (previous) {
        queryClient.setQueryData(
          listKey,
          mapListPages(previous, (page) => page.filter((item) => item.id !== communityId)),
        );
      }
      queryClient.removeQueries({ queryKey: detailKey });
      return { previous, previousDetail, detailKey };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.communities.list(), context.previous);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(context.detailKey, context.previousDetail);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.communities.list() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.discover.communities() });
    },
  });
}

export function useJoinCommunity(communityId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    meta: durableMeta('community.join'),
    mutationFn: async () => {
      await runOrEnqueueOffline('community.join', { communityId }, async () => {
        await api.joinCommunity(communityId);
      });
    },
    onMutate: async () => {
      const key = queryKeys.communities.detail(communityId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CommunityResponse>(key);
      if (previous) {
        const next = optimisticJoin(previous);
        queryClient.setQueryData(key, next);
        patchListItem(queryClient, next);
      }
      return { previous };
    },
    onError: (_error, _void, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.communities.detail(communityId), context.previous);
        patchListItem(queryClient, context.previous);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.communities.detail(communityId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.communities.members(communityId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.communities.list() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.discover.communities() });
    },
  });
}

export function useLeaveCommunity(communityId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    meta: durableMeta('community.leave'),
    mutationFn: async () => {
      await runOrEnqueueOffline('community.leave', { communityId }, async () => {
        await api.leaveCommunity(communityId);
      });
    },
    onMutate: async () => {
      const key = queryKeys.communities.detail(communityId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CommunityResponse>(key);
      if (previous) {
        const next = optimisticLeave(previous);
        queryClient.setQueryData(key, next);
        patchListItem(queryClient, next);
      }
      return { previous };
    },
    onError: (_error, _void, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.communities.detail(communityId), context.previous);
        patchListItem(queryClient, context.previous);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.communities.detail(communityId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.communities.members(communityId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.communities.list() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.discover.communities() });
    },
  });
}

/**
 * The directory cache is an infinite query since 3b.1a, so every optimistic
 * writer edits pages rather than one flat array. Getting this wrong is silent:
 * `getQueryData` would hand back `{ pages }` and `.map` would be undefined.
 */
interface CommunityListCache {
  pages: { data: CommunityResponse[]; meta: unknown }[];
  pageParams: unknown[];
}

function mapListPages(
  cache: CommunityListCache,
  update: (page: CommunityResponse[]) => CommunityResponse[],
): CommunityListCache {
  return {
    ...cache,
    pages: cache.pages.map((page) => ({ ...page, data: update(page.data) })),
  };
}

function patchListItem(
  queryClient: ReturnType<typeof useQueryClient>,
  community: CommunityResponse,
): void {
  const listKey = queryKeys.communities.list();
  const cache = queryClient.getQueryData<CommunityListCache>(listKey);
  if (!cache) {
    return;
  }
  queryClient.setQueryData(
    listKey,
    mapListPages(cache, (page) =>
      page.map((item) => (item.id === community.id ? community : item)),
    ),
  );
}

export type { CommunityResponse };
