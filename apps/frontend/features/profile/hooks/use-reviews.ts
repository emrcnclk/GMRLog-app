import { useCallback } from 'react';

import { resolveReviewsView } from './profile-model';

/**
 * Own reviews list — backend has no `GET /reviews` index (only
 * `GET /reviews/{id}` and `GET /games/{id}/reviews`). Hook stays present for
 * the Profile Reviews tab contract without inventing an endpoint.
 */
export function useReviews() {
  const view = resolveReviewsView();

  const refresh = useCallback(async () => {
    // No list query to invalidate.
  }, []);

  const loadMore = useCallback(() => {
    // No cursor pagination without a list endpoint.
  }, []);

  return {
    ...view,
    refresh,
    loadMore,
  };
}
