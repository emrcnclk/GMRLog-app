import type { FriendRequestResponse, FriendshipResponse } from '@gmrlog/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { queryKeys } from '../../../src/query/query-client';

import {
  createIdempotencyKey,
  filterIncomingRequests,
  resolveFriendsScreenView,
} from './friends-model';

export function useFriendsList() {
  const api = useApiClient();

  return useQuery({
    queryKey: queryKeys.friends.list(),
    queryFn: async (): Promise<FriendshipResponse[]> => {
      const envelope = await api.listFriends();
      return envelope.data;
    },
  });
}

export function useFriendRequests() {
  const api = useApiClient();

  return useQuery({
    queryKey: queryKeys.friends.requests(),
    queryFn: async (): Promise<FriendRequestResponse[]> => {
      const envelope = await api.listFriendRequests();
      return envelope.data;
    },
  });
}

export function useFriendsScreenData() {
  const queryClient = useQueryClient();
  const friendsQuery = useFriendsList();
  const requestsQuery = useFriendRequests();

  const friends = friendsQuery.data ?? [];
  const requests = useMemo(
    () => filterIncomingRequests(requestsQuery.data ?? []),
    [requestsQuery.data],
  );

  const isRefreshing =
    (friendsQuery.isRefetching || requestsQuery.isRefetching) &&
    !friendsQuery.isPending &&
    !requestsQuery.isPending;

  const view = resolveFriendsScreenView({
    friendsPending: friendsQuery.isPending,
    friendsError: friendsQuery.isError,
    friendsErrorValue: friendsQuery.error,
    friends,
    requestsPending: requestsQuery.isPending,
    requestsError: requestsQuery.isError,
    requestsErrorValue: requestsQuery.error,
    requests,
    isRefreshing,
  });

  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.list() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.requests() }),
    ]);
  }, [queryClient]);

  return {
    ...view,
    refresh,
    refetch: async () => {
      await Promise.all([friendsQuery.refetch(), requestsQuery.refetch()]);
    },
  };
}

async function invalidateFriends(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.friends.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all }),
  ]);
}

export function useAcceptFriendRequest() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const envelope = await api.acceptFriendRequest(
        requestId,
        createIdempotencyKey('friend_accept'),
      );
      return envelope.data;
    },
    onSuccess: async () => {
      await invalidateFriends(queryClient);
    },
  });
}

export function useRejectFriendRequest() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      await api.rejectFriendRequest(requestId);
    },
    onSuccess: async () => {
      await invalidateFriends(queryClient);
    },
  });
}

export function useRemoveFriend() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await api.removeFriend(userId);
    },
    onSuccess: async () => {
      await invalidateFriends(queryClient);
    },
  });
}
