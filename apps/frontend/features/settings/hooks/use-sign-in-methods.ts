import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { queryKeys } from '../../../src/query/query-client';
import { resolveSignInMethodsView } from '../model/sign-in-methods-model';

export const SIGN_IN_METHODS_QUERY_KEY = [...queryKeys.settings, 'sign-in-methods'] as const;

/** Task 4.7 — `GET /auth/sign-in-methods`, the Settings connect/disconnect read model. */
export function useSignInMethods() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: SIGN_IN_METHODS_QUERY_KEY,
    queryFn: async () => {
      const envelope = await api.getSignInMethods();
      return envelope.data;
    },
  });

  const view = resolveSignInMethodsView({
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    methods: query.data,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: SIGN_IN_METHODS_QUERY_KEY });
  }, [queryClient]);

  return { ...view, refresh, refetch: query.refetch };
}
