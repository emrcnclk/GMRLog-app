import type { ProfileThemeResponse } from '@gmrlog/types';
import type { ProfileThemePatchInput } from '@gmrlog/validators';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { durableMeta, runOrEnqueueOfflineResult } from '../../../src/offline';
import { queryKeys } from '../../../src/query/query-client';

/**
 * D3.29 — `GET /me/profile-theme`. The server-confirmed baseline the
 * Customize Profile screen (§18) hydrates its draft from; unlike the
 * device-local `useProfileCustomization` store, this is the same value on
 * every device.
 */
export function useProfileTheme() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.profile.theme(),
    queryFn: async () => {
      const envelope = await api.getProfileTheme();
      return envelope.data;
    },
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.profile.theme() });
  }, [queryClient]);

  return {
    theme: query.data ?? null,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    isRefreshing: query.isRefetching,
    refresh,
    refetch: query.refetch,
  };
}

/**
 * `PATCH /me/profile-theme`. Same offline-durable shape as
 * `usePatchAppearance`/`usePatchAccessibility` (`use-settings.ts`): offline,
 * the write is queued for the reconnect flush and the cache is not
 * invalidated (there is nothing newer to fetch yet); online, a real failure
 * surfaces through `mutate`'s `onError` for the caller to show.
 */
export function usePatchProfileTheme() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    meta: durableMeta('profile.theme'),
    mutationFn: async (body: ProfileThemePatchInput) => {
      return runOrEnqueueOfflineResult(
        'profile.theme',
        { ...body },
        async () => {
          const envelope = await api.patchProfileTheme(body);
          return envelope.data;
        },
        () => {
          const cached = queryClient.getQueryData<ProfileThemeResponse>(queryKeys.profile.theme());
          if (!cached) {
            throw new Error('profile theme cache missing while offline');
          }
          return { ...cached, ...body };
        },
      );
    },
    onSuccess: ({ value }) => {
      queryClient.setQueryData(queryKeys.profile.theme(), value);
    },
    onSettled: (result) => {
      // See usePatchAppearance: an offline result hasn't reached the server,
      // so invalidating would refetch the still-stale value and undo the
      // optimistic write the queue exists to preserve.
      if (result?.branch === 'offline') {
        return;
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.theme() });
    },
  });
}
