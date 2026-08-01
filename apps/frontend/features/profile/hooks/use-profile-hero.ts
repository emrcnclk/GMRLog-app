import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { queryKeys } from '../../../src/query/query-client';

export function useProfileHero(userId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.profile.hero(userId),
    enabled: userId.length > 0,
    queryFn: async () => {
      const envelope = await api.getProfileHero(userId);
      return envelope.data;
    },
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.profile.hero(userId) });
  }, [queryClient, userId]);

  return {
    hero: query.data ?? null,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    isRefreshing: query.isRefetching,
    refresh,
    refetch: query.refetch,
  };
}
