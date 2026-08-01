import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { createIdempotencyKey } from '../../../src/api/idempotency';
import { queryKeys } from '../../../src/query/query-client';

/**
 * Everything a public profile shows, in one parallel round.
 *
 * All seven reads have existed since D3.21–D3.27; none of them were reachable
 * from `app/(app)/user/[id].tsx`, which rendered a placeholder. Like the
 * Discover rails, a single failing section must not blank the page — the screen
 * treats only a failed identity read as fatal, because without a name there is
 * no profile to show.
 */
export function usePublicProfile(userId: string) {
  const api = useApiClient();
  const enabled = userId.length > 0;

  const results = useQueries({
    queries: [
      {
        queryKey: queryKeys.users.publicProfile(userId),
        enabled,
        queryFn: async () => (await api.getUserPublic(userId)).data,
      },
      {
        queryKey: queryKeys.profile.hero(userId),
        enabled,
        queryFn: async () => (await api.getProfileHero(userId)).data,
      },
      {
        queryKey: queryKeys.users.statistics(userId),
        enabled,
        queryFn: async () => (await api.getUserStatistics(userId)).data,
      },
      {
        queryKey: queryKeys.users.achievements(userId),
        enabled,
        queryFn: async () => (await api.getUserAchievements(userId)).data,
      },
      {
        queryKey: queryKeys.users.archetypes(userId),
        enabled,
        queryFn: async () => (await api.getUserArchetypes(userId)).data,
      },
      {
        queryKey: queryKeys.users.relationship(userId),
        enabled,
        queryFn: async () => (await api.getRelationship(userId)).data,
      },
    ],
  });

  const [user, hero, statistics, achievements, archetypes, relationship] = results;

  return {
    user: user.data ?? null,
    hero: hero.data ?? null,
    statistics: statistics.data ?? null,
    achievements: achievements.data ?? [],
    archetypes: archetypes.data ?? [],
    relationship: relationship.data ?? null,
    isPending: user.isPending,
    isError: user.isError,
    error: user.error,
    isRefreshing: results.some((result) => result.isRefetching),
    isSectionPending: {
      achievements: achievements.isPending,
      archetypes: archetypes.isPending,
    },
    refetch: useCallback(() => {
      for (const result of results) {
        void result.refetch();
      }
    }, [results]),
  };
}

/**
 * Send a friend request from a public profile.
 *
 * Idempotent by key so a double-tap on a slow connection cannot queue two
 * requests at the same person. The relationship read is invalidated on success
 * so the button reflects its new state without a manual refresh.
 */
export function useSendFriendRequest(userId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const envelope = await api.sendFriendRequest(userId, {}, createIdempotencyKey('friend'));
      return envelope.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.users.relationship(userId),
      });
    },
  });
}
