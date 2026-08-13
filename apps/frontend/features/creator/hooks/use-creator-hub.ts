import { useQueries } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { queryKeys } from '../../../src/query/query-client';

/**
 * Creator hub's three parallel reads: identity (`UserPublicResponse`, the same
 * read `usePublicProfile` uses), the Creator Profile surface
 * (`GET /users/:id/creator`), and the user's real achievement index (reused
 * for §25's milestone grid — see `creator-hub-model.ts`).
 *
 * Only identity failing is fatal, the same rule `usePublicProfile` follows:
 * without a name there is no hub to show, but a failed creator/achievements
 * read still leaves an identity header worth rendering.
 */
export function useCreatorHub(userId: string) {
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
        queryKey: queryKeys.creator.profile(userId),
        enabled,
        queryFn: async () => (await api.getCreatorProfile(userId)).data,
      },
      {
        queryKey: queryKeys.users.achievements(userId),
        enabled,
        queryFn: async () => (await api.getUserAchievements(userId)).data,
      },
    ],
  });

  const [user, creator, achievements] = results;

  return {
    user: user.data ?? null,
    creator: creator.data ?? null,
    achievements: achievements.data ?? [],
    isPending: user.isPending,
    isError: user.isError,
    error: user.error,
    isRefreshing: results.some((result) => result.isRefetching),
    isSectionPending: {
      creator: creator.isPending,
      achievements: achievements.isPending,
    },
    isSectionError: {
      creator: creator.isError,
    },
    refetch: useCallback(() => {
      for (const result of results) {
        void result.refetch();
      }
    }, [results]),
  };
}
