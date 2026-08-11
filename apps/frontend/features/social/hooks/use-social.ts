import type {
  ApiEnvelope,
  BlockResponse,
  ReportReasonValue,
  UserPublicResponse,
} from '@gmrlog/types';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { getNextPageParam, queryKeys } from '../../../src/query/query-client';

import { createIdempotencyKey, removeBlockedUser, resolveListView } from './social-model';

type InfiniteBlocksData = InfiniteData<ApiEnvelope<BlockResponse[]>>;

/** `GET /me/followers` — not paginated (3b.3's own measurement of the endpoint). */
export function useMyFollowers() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.social.followers(),
    queryFn: async (): Promise<UserPublicResponse[]> => {
      const envelope = await api.listMyFollowers();
      return envelope.data;
    },
  });

  const view = resolveListView({
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    items: query.data ?? [],
    isRefreshing: query.isRefetching,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.social.followers() });
  }, [queryClient]);

  return { ...view, refresh, refetch: query.refetch };
}

/** `GET /me/following` — also the source of each Followers row's Follow/Following state. */
export function useMyFollowing() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.social.following(),
    queryFn: async (): Promise<UserPublicResponse[]> => {
      const envelope = await api.listMyFollowing();
      return envelope.data;
    },
  });

  const view = resolveListView({
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    items: query.data ?? [],
    isRefreshing: query.isRefetching,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.social.following() });
  }, [queryClient]);

  return { ...view, refresh, refetch: query.refetch };
}

async function invalidateSocial(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.social.followers() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.social.following() }),
  ]);
}

export function useFollowUser() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await api.followUser(userId, createIdempotencyKey('follow'));
    },
    onSuccess: async () => {
      await invalidateSocial(queryClient);
    },
  });
}

/**
 * Removes the row from `/me/following`'s cache immediately — the Following
 * tab's own list is exactly what "Following" pressed should empty out of,
 * and waiting on a refetch reads as the tap not having registered.
 */
export function useUnfollowUser() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await api.unfollowUser(userId);
      return userId;
    },
    onMutate: async (userId: string) => {
      const key = queryKeys.social.following();
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<UserPublicResponse[]>(key);
      if (previous) {
        queryClient.setQueryData(
          key,
          previous.filter((user) => user.id !== userId),
        );
      }
      return { previous };
    },
    onError: (_error, _userId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.social.following(), context.previous);
      }
    },
    onSuccess: async () => {
      await invalidateSocial(queryClient);
    },
  });
}

export function useMuteUser() {
  const api = useApiClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await api.muteUser(userId, createIdempotencyKey('mute'));
    },
  });
}

/**
 * Blocking also removes the follow relationship server-side, so both cached
 * lists drop the row rather than waiting for a refetch to notice.
 */
export function useBlockUser() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await api.blockUser(userId, createIdempotencyKey('block'));
      return userId;
    },
    onMutate: async (userId: string) => {
      const followersKey = queryKeys.social.followers();
      const followingKey = queryKeys.social.following();
      await Promise.all([
        queryClient.cancelQueries({ queryKey: followersKey }),
        queryClient.cancelQueries({ queryKey: followingKey }),
      ]);
      const previousFollowers = queryClient.getQueryData<UserPublicResponse[]>(followersKey);
      const previousFollowing = queryClient.getQueryData<UserPublicResponse[]>(followingKey);
      if (previousFollowers) {
        queryClient.setQueryData(
          followersKey,
          previousFollowers.filter((user) => user.id !== userId),
        );
      }
      if (previousFollowing) {
        queryClient.setQueryData(
          followingKey,
          previousFollowing.filter((user) => user.id !== userId),
        );
      }
      return { previousFollowers, previousFollowing };
    },
    onError: (_error, _userId, context) => {
      if (context?.previousFollowers) {
        queryClient.setQueryData(queryKeys.social.followers(), context.previousFollowers);
      }
      if (context?.previousFollowing) {
        queryClient.setQueryData(queryKeys.social.following(), context.previousFollowing);
      }
    },
    onSuccess: async () => {
      await invalidateSocial(queryClient);
    },
  });
}

/**
 * `GET /blocks` — the viewer's blocked users (§15, 3b.3a). Cursor-paginated,
 * unlike `useMyFollowers`/`useMyFollowing`: a block list has no measured
 * small-and-unpaginated precedent, so it follows the app's one cursor
 * dialect (`useCommunityEvents`, `useEvents`) instead.
 */
export function useMyBlocked() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: queryKeys.social.blocked(),
    queryFn: ({ pageParam }) =>
      api.listBlocks({
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
    await queryClient.invalidateQueries({ queryKey: queryKeys.social.blocked() });
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
    refetch: query.refetch,
  };
}

/** `DELETE /blocks/{userId}` — unblock. Removes the row from the Blocked page optimistically. */
export function useUnblockUser() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await api.unblockUser(userId);
      return userId;
    },
    onMutate: async (userId: string) => {
      const key = queryKeys.social.blocked();
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<InfiniteBlocksData>(key);
      if (previous) {
        queryClient.setQueryData(key, {
          ...previous,
          pages: removeBlockedUser(previous.pages, userId),
        });
      }
      return { previous };
    },
    onError: (_error, _userId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.social.blocked(), context.previous);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.social.blocked() });
    },
  });
}

export function useReportUser() {
  const api = useApiClient();

  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: ReportReasonValue }) => {
      await api.reportUser(userId, reason, createIdempotencyKey('report'));
    },
  });
}
