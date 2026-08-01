import type {
  CsvImportPreviewResponse,
  IntegrationProviderInfo,
  SteamProfileResponse,
  SteamStatusResponse,
  SyncHistoryResponse,
  SyncJobResponse,
  UserIntegrationResponse,
} from '@gmrlog/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { queryKeys } from '../../../src/query/query-client';

import {
  type CsvImportFormatValue,
  normalizeSteamIdOrUrl,
  resolveIntegrationsDashboardView,
  resolveSyncHistoryView,
  sortSyncHistoryNewestFirst,
} from './integrations-model';

export function useIntegrationProviders() {
  const api = useApiClient();

  return useQuery({
    queryKey: queryKeys.integrations.providers(),
    queryFn: async (): Promise<IntegrationProviderInfo[]> => {
      const envelope = await api.listIntegrationProviders();
      return envelope.data;
    },
  });
}

export function useIntegrationsList() {
  const api = useApiClient();

  return useQuery({
    queryKey: queryKeys.integrations.list(),
    queryFn: async (): Promise<UserIntegrationResponse[]> => {
      const envelope = await api.listIntegrations();
      return envelope.data;
    },
  });
}

export function useIntegrationHistory() {
  const api = useApiClient();

  return useQuery({
    queryKey: queryKeys.integrations.history(),
    queryFn: async (): Promise<SyncHistoryResponse[]> => {
      const envelope = await api.listIntegrationHistory();
      return sortSyncHistoryNewestFirst(envelope.data);
    },
  });
}

export function useSteamStatus() {
  const api = useApiClient();

  return useQuery({
    queryKey: queryKeys.integrations.steamStatus(),
    queryFn: async (): Promise<SteamStatusResponse> => {
      const envelope = await api.getSteamStatus();
      return envelope.data;
    },
  });
}

export function useSteamProfile(enabled: boolean) {
  const api = useApiClient();

  return useQuery({
    queryKey: queryKeys.integrations.steamProfile(),
    enabled,
    queryFn: async (): Promise<SteamProfileResponse> => {
      const envelope = await api.getSteamProfile();
      return envelope.data;
    },
  });
}

export function useIntegrationsDashboard() {
  const queryClient = useQueryClient();
  const integrationsQuery = useIntegrationsList();
  const providersQuery = useIntegrationProviders();
  const historyQuery = useIntegrationHistory();
  const steamStatusQuery = useSteamStatus();

  const integrations = integrationsQuery.data ?? [];
  const providers = providersQuery.data ?? [];
  const historyItems = historyQuery.data ?? [];

  const isRefreshing =
    (integrationsQuery.isRefetching || providersQuery.isRefetching || historyQuery.isRefetching) &&
    !integrationsQuery.isPending &&
    !providersQuery.isPending;

  const view = resolveIntegrationsDashboardView({
    integrationsPending: integrationsQuery.isPending,
    integrationsError: integrationsQuery.isError,
    integrationsErrorValue: integrationsQuery.error,
    integrations,
    providersPending: providersQuery.isPending,
    providersError: providersQuery.isError,
    providersErrorValue: providersQuery.error,
    providers,
    isRefreshing,
  });

  const historyView = resolveSyncHistoryView({
    isPending: historyQuery.isPending,
    isError: historyQuery.isError,
    error: historyQuery.error,
    items: historyItems,
    isRefreshing: historyQuery.isRefetching && !historyQuery.isPending,
  });

  const steamConnected = useMemo(
    () => steamStatusQuery.data?.connected ?? false,
    [steamStatusQuery.data?.connected],
  );

  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.library.all }),
    ]);
  }, [queryClient]);

  return {
    ...view,
    history: historyView,
    steamConnected,
    steamStatus: steamStatusQuery.data ?? null,
    refresh,
    refetch: async () => {
      await Promise.all([
        integrationsQuery.refetch(),
        providersQuery.refetch(),
        historyQuery.refetch(),
        steamStatusQuery.refetch(),
      ]);
    },
  };
}

async function invalidateIntegrations(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.integrations.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.library.all }),
  ]);
}

export function useConnectSteam() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (steamIdOrUrl: string): Promise<UserIntegrationResponse> => {
      const envelope = await api.connectSteam({
        steamIdOrUrl: normalizeSteamIdOrUrl(steamIdOrUrl),
      });
      return envelope.data;
    },
    onSuccess: async () => {
      await invalidateIntegrations(queryClient);
    },
  });
}

export function useDisconnectSteam() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      await api.disconnectSteam();
    },
    onSuccess: async () => {
      await invalidateIntegrations(queryClient);
    },
  });
}

export function useSyncIntegration() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (integrationId: string): Promise<SyncJobResponse> => {
      const envelope = await api.syncIntegration(integrationId);
      return envelope.data;
    },
    onSuccess: async () => {
      await invalidateIntegrations(queryClient);
    },
  });
}

export function useImportCsv() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      csv: string;
      format: CsvImportFormatValue;
    }): Promise<SyncJobResponse> => {
      const envelope = await api.importCsv({
        csv: input.csv,
        format: input.format,
      });
      return envelope.data;
    },
    onSuccess: async () => {
      await invalidateIntegrations(queryClient);
    },
  });
}

export function usePreviewCsv() {
  const api = useApiClient();

  return useMutation({
    mutationFn: async (input: {
      csv: string;
      format: CsvImportFormatValue;
    }): Promise<CsvImportPreviewResponse> => {
      const envelope = await api.previewCsv({
        csv: input.csv,
        format: input.format,
      });
      return envelope.data;
    },
  });
}
