import type {
  AchievementResponse,
  PlayerArchetypeResponse,
  ProfilePinResponse,
  UserStatisticsResponse,
} from '@gmrlog/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { FrontendApiError } from '../../../src/api/axios-client';
import { queryKeys } from '../../../src/query/query-client';

import { filterAwardedAchievements, sortArchetypes } from './profile-model';

function isMissingRoute(error: unknown): boolean {
  return error instanceof FrontendApiError && (error.status === 404 || error.status === 501);
}

/** `GET /me/statistics` — null when route not mounted yet. */
export function useMeStatistics() {
  const api = useApiClient();

  const query = useQuery({
    queryKey: queryKeys.statistics.me(),
    queryFn: async (): Promise<UserStatisticsResponse | null> => {
      try {
        const envelope = await api.getMeStatistics();
        return envelope.data;
      } catch (error) {
        if (isMissingRoute(error)) {
          return null;
        }
        throw error;
      }
    },
  });

  return {
    statistics: query.data ?? null,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    isRefreshing: query.isRefetching,
    refetch: query.refetch,
  };
}

/** `GET /me/achievements` — empty when route missing. */
export function useMeAchievements() {
  const api = useApiClient();

  const query = useQuery({
    queryKey: queryKeys.achievements.me(),
    queryFn: async (): Promise<AchievementResponse[]> => {
      try {
        const envelope = await api.getMeAchievements();
        return envelope.data;
      } catch (error) {
        if (isMissingRoute(error)) {
          return [];
        }
        throw error;
      }
    },
  });

  const awarded = useMemo(() => filterAwardedAchievements(query.data ?? []), [query.data]);

  return {
    items: query.data ?? [],
    awarded,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    isRefreshing: query.isRefetching,
    refetch: query.refetch,
  };
}

/** `GET /me/archetypes` — empty when route missing. */
export function useMeArchetypes() {
  const api = useApiClient();

  const query = useQuery({
    queryKey: queryKeys.archetypes.me(),
    queryFn: async (): Promise<PlayerArchetypeResponse[]> => {
      try {
        const envelope = await api.getMeArchetypes();
        return envelope.data;
      } catch (error) {
        if (isMissingRoute(error)) {
          return [];
        }
        throw error;
      }
    },
  });

  const sorted = useMemo(() => sortArchetypes(query.data ?? []), [query.data]);

  return {
    items: sorted,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    isRefreshing: query.isRefetching,
    refetch: query.refetch,
  };
}

/** 9.5d — `GET /me/pins`, empty when route missing (same degrade as the two above). */
export function useMePins() {
  const api = useApiClient();

  const query = useQuery({
    queryKey: queryKeys.pins.me(),
    queryFn: async (): Promise<ProfilePinResponse[]> => {
      try {
        const envelope = await api.getMyPins();
        return envelope.data;
      } catch (error) {
        if (isMissingRoute(error)) {
          return [];
        }
        throw error;
      }
    },
  });

  return {
    items: query.data ?? [],
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    isRefreshing: query.isRefetching,
    refetch: query.refetch,
  };
}

/**
 * 9.5e — `PUT /me/pins`, `kind: 'achievement'`. Equips a badge or re-positions
 * an already-equipped one; the same endpoint does both (9.5d). Not
 * offline-durable like `usePatchProfileTheme` — the picker only makes sense
 * online (it renders the achievement list itself), so a real failure (the
 * cap, an org account, a race with the achievement being un-awarded) surfaces
 * through `mutate`'s `onError` for the caller to show verbatim rather than
 * queuing a write nothing yet confirmed was valid.
 */
export function useEquipAchievementPin() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { achievementId: string; position: number }) => {
      const envelope = await api.putMyPin({
        kind: 'achievement',
        objectId: input.achievementId,
        position: input.position,
      });
      return envelope.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.pins.me() });
    },
  });
}

/** 9.5e — `DELETE /me/pins`, `kind: 'achievement'`. Unequips a badge. */
export function useUnequipAchievementPin() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (achievementId: string) => {
      await api.deleteMyPin('achievement', achievementId);
      return achievementId;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.pins.me() });
    },
  });
}
