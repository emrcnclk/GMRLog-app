import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { queryKeys } from '../../../src/query/query-client';

import { buildTrendingSearchTerms } from './search-facets-model';

/** Enough to fill two rows of chips without becoming a wall. */
const TRENDING_TERM_LIMIT = 8;

/**
 * Terms to offer before a query is typed.
 *
 * Sourced from `GET /discover/trending` — the backend has no trending-*queries*
 * endpoint and is frozen for D3.28, so these are trending *games* surfaced as
 * searchable terms. The screen labels them accordingly; see
 * `buildTrendingSearchTerms` for why that distinction is kept visible.
 */
export function useTrendingSearches() {
  const api = useApiClient();

  const query = useQuery({
    queryKey: [...queryKeys.discover.trending('7d'), 'search-terms'] as const,
    queryFn: async () => {
      const envelope = await api.listDiscoverTrending({
        window: '7d',
        entity: 'games',
        limit: TRENDING_TERM_LIMIT * 2,
      });
      return envelope.data.map((game) => game.title);
    },
    // Trending moves in hours, not seconds, and this is a hint rather than the
    // point of the screen — refetching on every focus would be waste.
    staleTime: 15 * 60 * 1000,
  });

  const terms = useMemo(
    () => buildTrendingSearchTerms(query.data ?? [], TRENDING_TERM_LIMIT),
    [query.data],
  );

  return { terms, isPending: query.isPending };
}
