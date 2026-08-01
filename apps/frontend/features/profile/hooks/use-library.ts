import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { queryKeys } from '../../../src/query/query-client';

import { groupLibraryEntries, resolveListView } from './profile-model';

export function useLibrary() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const hubQuery = useQuery({
    queryKey: queryKeys.library.hub(),
    queryFn: async () => {
      const envelope = await api.getLibrary();
      return envelope.data;
    },
  });

  const entriesQuery = useQuery({
    queryKey: queryKeys.library.entries(),
    queryFn: async () => {
      const envelope = await api.listLibraryEntries();
      return envelope.data;
    },
  });

  const entries = entriesQuery.data ?? [];
  const sections = useMemo(() => groupLibraryEntries(entries), [entries]);

  const isPending = hubQuery.isPending || entriesQuery.isPending;
  const isError = hubQuery.isError || entriesQuery.isError;
  const error = hubQuery.error ?? entriesQuery.error;
  const isRefreshing =
    (hubQuery.isRefetching || entriesQuery.isRefetching) &&
    !hubQuery.isPending &&
    !entriesQuery.isPending;

  const view = resolveListView({
    isPending,
    isError,
    error,
    items: entries,
    isRefreshing,
  });

  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.library.hub() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.library.entries() }),
    ]);
  }, [queryClient]);

  return {
    ...view,
    hub: hubQuery.data ?? null,
    sections,
    refresh,
    refetch: async () => {
      await Promise.all([hubQuery.refetch(), entriesQuery.refetch()]);
    },
  };
}
