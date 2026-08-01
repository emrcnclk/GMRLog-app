import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { queryKeys } from '../../../src/query/query-client';
import { resolveConnectedAccountsView } from '../model/account-model';

export function useConnectedAccounts() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...queryKeys.settings, 'connected-accounts'] as const,
    queryFn: async () => {
      const envelope = await api.listConnectedAccounts();
      return envelope.data;
    },
  });

  const items = query.data ?? [];
  const view = resolveConnectedAccountsView({
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    items,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: [...queryKeys.settings, 'connected-accounts'],
    });
  }, [queryClient]);

  return { ...view, refresh, refetch: query.refetch };
}
