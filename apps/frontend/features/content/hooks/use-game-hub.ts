import type { GameHubResponse } from '@gmrlog/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { queryKeys } from '../../../src/query/query-client';

export function useGameHub(gameId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.games.hub(gameId),
    enabled: gameId.length > 0,
    queryFn: async () => {
      const envelope = await api.getGameHub(gameId);
      return envelope.data;
    },
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.games.hub(gameId) });
  }, [gameId, queryClient]);

  return {
    hub: query.data ?? null,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    isRefreshing: query.isRefetching,
    refresh,
    refetch: query.refetch,
  };
}

export type { GameHubResponse };
