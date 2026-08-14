import { useQuery } from '@tanstack/react-query';

import { useApiClient } from '../../../src/api/api-provider';
import { queryKeys } from '../../../src/query/query-client';

/**
 * `GET /users/:id/dna-match` (5.4) — the DNA panel's one data source.
 *
 * A blocked relationship 404s the whole endpoint server-side (same guard as
 * `getSimilarUsers`), which surfaces here as `isError` with no `isNotFound`
 * distinction needed: the caller already knows a blocked relationship from
 * `usePublicProfile`'s own read and skips this query entirely in that case
 * (`enabled` below), so an error reaching the UI here means something else
 * genuinely went wrong.
 */
export function useDnaMatch(userId: string, enabled = true) {
  const api = useApiClient();
  const query = useQuery({
    queryKey: queryKeys.users.dnaMatch(userId),
    queryFn: async () => (await api.getDnaMatch(userId)).data,
    enabled: enabled && userId.length > 0,
  });

  return {
    match: query.data ?? null,
    isPending: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
}
