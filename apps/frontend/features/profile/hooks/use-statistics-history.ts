import type { StatisticsHistoryResponse } from '@gmrlog/types';
import { useQuery } from '@tanstack/react-query';

import { useApiClient } from '../../../src/api/api-provider';
import { FrontendApiError } from '../../../src/api/axios-client';
import { queryKeys } from '../../../src/query/query-client';

function isMissingRoute(error: unknown): boolean {
  return error instanceof FrontendApiError && (error.status === 404 || error.status === 501);
}

/**
 * `GET /me/statistics/history` — daily series behind the profile heatmap.
 *
 * Mirrors the tolerance the other profile reads use: a missing route yields
 * `null` rather than an error state, so an older backend simply hides the
 * heatmap instead of breaking the profile.
 */
export function useMeStatisticsHistory(period: StatisticsHistoryResponse['period'] = 'daily') {
  const api = useApiClient();

  const query = useQuery({
    queryKey: queryKeys.statistics.meHistory(period),
    queryFn: async (): Promise<StatisticsHistoryResponse | null> => {
      try {
        const envelope = await api.getMeStatisticsHistory({ period });
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
    history: query.data ?? null,
    isPending: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
}
