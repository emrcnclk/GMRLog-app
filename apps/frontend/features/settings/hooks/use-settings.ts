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

  const query = useQuery({
    queryKey: queryKeys.settings,
    queryFn: async () => {
      const envelope = await api.settings();
      return envelope.data;
    },
  });

  useEffect(() => {
    if (query.data?.appearance.theme) {
      setPreference(query.data.appearance.theme);
    }
  }, [query.data?.appearance.theme, setPreference]);

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
    onError: (_error, _body, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.settings, context.previous);
        setPreference(context.previous.appearance.theme);
      }
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.settings, settings);
      setPreference(settings.appearance.theme);
    },
    onSettled: () => {
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
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.settings, settings);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
  });
}
