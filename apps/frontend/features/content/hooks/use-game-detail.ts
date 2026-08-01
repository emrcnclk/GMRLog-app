import type { GameMediaResponse, GameRelatedGameResponse, GameResponse } from '@gmrlog/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { queryKeys } from '../../../src/query/query-client';

/**
 * `GET /games/{id}` — full catalog detail (D3.25 metadata included).
 * The Game Hub header renders from this; `/games/{id}/hub` only carries tab counts.
 */
export function useGameDetail(gameId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.games.detail(gameId),
    enabled: gameId.length > 0,
    queryFn: async () => {
      const envelope = await api.getGame(gameId);
      return envelope.data;
    },
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.games.detail(gameId) });
  }, [gameId, queryClient]);

  return {
    game: query.data ?? null,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    isRefreshing: query.isRefetching,
    refresh,
    refetch: query.refetch,
  };
}

/**
 * `GET /games/{id}/media` — mirrored artwork. Screenshots also arrive inline on
 * `GameResponse`; this read carries the full set including video and artwork kinds.
 */
export function useGameMedia(gameId: string) {
  const api = useApiClient();

  const query = useQuery({
    queryKey: queryKeys.games.media(gameId),
    enabled: gameId.length > 0,
    queryFn: async () => {
      const envelope = await api.listGameMedia(gameId);
      return envelope.data;
    },
  });

  return {
    media: query.data ?? [],
    isPending: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/** `GET /games/{id}/similar` — provider-declared related games (D3.25). */
export function useGameRelated(gameId: string) {
  const api = useApiClient();

  const query = useQuery({
    queryKey: queryKeys.games.related(gameId),
    enabled: gameId.length > 0,
    queryFn: async () => {
      const envelope = await api.listGameRelated(gameId);
      return envelope.data;
    },
  });

  return {
    related: query.data ?? [],
    isPending: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export type { GameMediaResponse, GameRelatedGameResponse, GameResponse };
