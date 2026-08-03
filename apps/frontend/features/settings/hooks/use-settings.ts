import type { SettingsResponse } from '@gmrlog/types';
import type {
  SettingsAccessibilityPatchInput,
  SettingsAppearancePatchInput,
} from '@gmrlog/validators';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { durableMeta, runOrEnqueueOfflineResult } from '../../../src/offline';
import { queryKeys } from '../../../src/query/query-client';
import { useThemeStore } from '../../../src/state/stores';
import { resolveSettingsView } from '../model/settings-model';

export function useSettings() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const setPreference = useThemeStore((s) => s.setPreference);
  const pendingPreference = useThemeStore((s) => s.pendingPreference);

  const query = useQuery({
    queryKey: queryKeys.settings,
    queryFn: async () => {
      const envelope = await api.settings();
      return envelope.data;
    },
  });

  useEffect(() => {
    // A pending offline write hasn't reached the server yet, so any fetch
    // landing while it's outstanding is reading the value that write is about
    // to replace. Syncing from it here would revert the optimism the offline
    // queue exists to preserve.
    if (query.data?.appearance.theme && pendingPreference === null) {
      setPreference(query.data.appearance.theme);
    }
  }, [query.data?.appearance.theme, pendingPreference, setPreference]);

  const view = resolveSettingsView({
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    settings: query.data,
    isRefreshing: query.isRefetching,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.settings });
  }, [queryClient]);

  return {
    ...view,
    refresh,
    refetch: query.refetch,
  };
}

export function usePatchAppearance() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const setPreference = useThemeStore((s) => s.setPreference);
  const setPendingPreference = useThemeStore((s) => s.setPendingPreference);

  return useMutation({
    meta: durableMeta('settings.appearance'),
    mutationFn: async (body: SettingsAppearancePatchInput) => {
      return runOrEnqueueOfflineResult(
        'settings.appearance',
        { ...body },
        async () => {
          const envelope = await api.patchSettingsAppearance(body);
          return envelope.data;
        },
        () => {
          const cached = queryClient.getQueryData<SettingsResponse>(queryKeys.settings);
          if (!cached) {
            throw new Error('settings cache missing while offline');
          }
          return cached;
        },
      );
    },
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.settings });
      const previous = queryClient.getQueryData<SettingsResponse>(queryKeys.settings);
      if (previous && body.theme !== undefined && body.theme !== null) {
        queryClient.setQueryData<SettingsResponse>(queryKeys.settings, {
          ...previous,
          appearance: {
            ...previous.appearance,
            theme: body.theme,
            ...(body.locale !== undefined ? { locale: body.locale } : {}),
          },
        });
        setPreference(body.theme);
      } else if (previous && body.locale !== undefined) {
        queryClient.setQueryData<SettingsResponse>(queryKeys.settings, {
          ...previous,
          appearance: { ...previous.appearance, locale: body.locale },
        });
      }
      return { previous };
    },
    onError: (_error, body, context) => {
      if (body.theme !== undefined && body.theme !== null) {
        setPendingPreference(null);
      }
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.settings, context.previous);
        setPreference(context.previous.appearance.theme);
      }
    },
    onSuccess: ({ value: settings, branch }, body) => {
      queryClient.setQueryData(queryKeys.settings, settings);
      setPreference(settings.appearance.theme);
      // Only an online round-trip confirms the write. An enqueued one is
      // still pending until the reconnect flush lands, so the theme store
      // stays marked — the resync effect in useSettings reads this and won't
      // clobber the optimistic value with the still-stale server response.
      if (body.theme !== undefined && body.theme !== null) {
        setPendingPreference(branch === 'offline' ? body.theme : null);
      }
    },
    onSettled: (result) => {
      // Invalidating after an offline result refetches the server's
      // still-stale value and immediately undoes the optimistic write the
      // queue exists to preserve. Only reconcile after a real round-trip.
      if (result?.branch === 'offline') {
        return;
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
  });
}

export function usePatchAccessibility() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    meta: durableMeta('settings.accessibility'),
    mutationFn: async (body: SettingsAccessibilityPatchInput) => {
      return runOrEnqueueOfflineResult(
        'settings.accessibility',
        { ...body },
        async () => {
          const envelope = await api.patchSettingsAccessibility(body);
          return envelope.data;
        },
        () => {
          const cached = queryClient.getQueryData<SettingsResponse>(queryKeys.settings);
          if (!cached) {
            throw new Error('settings cache missing while offline');
          }
          return cached;
        },
      );
    },
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.settings });
      const previous = queryClient.getQueryData<SettingsResponse>(queryKeys.settings);
      if (previous && body.reduceMotion !== undefined) {
        queryClient.setQueryData<SettingsResponse>(queryKeys.settings, {
          ...previous,
          accessibility: { reduceMotion: body.reduceMotion },
        });
      }
      return { previous };
    },
    onError: (_error, _body, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.settings, context.previous);
      }
    },
    onSuccess: ({ value: settings }) => {
      queryClient.setQueryData(queryKeys.settings, settings);
    },
    onSettled: (result) => {
      // See usePatchAppearance: an offline result hasn't reached the server,
      // so invalidating would refetch the still-stale value and undo the
      // optimistic write.
      if (result?.branch === 'offline') {
        return;
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
  });
}
