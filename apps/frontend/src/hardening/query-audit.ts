/**
 * D3.16 query invalidation + optimistic rollback audit helpers.
 */

export const DELETE_MUTATIONS_WITH_DETAIL_ROLLBACK = [
  'useDeleteCommunity',
  'useDeleteCollection',
  'useDeleteTierList',
  'useDeletePost',
  'useDeleteReview',
] as const;

/** Domains that must invalidate list (and usually discover) after durable writes. */
export const INVALIDATION_AUDIT_DOMAINS = [
  'communities',
  'events',
  'notifications',
  'settings',
  'collections',
  'tierLists',
  'posts',
  'reviews',
  'messages',
  'library',
  'activity',
] as const;

/**
 * Pure rollback helper used by hardening tests — restore detail after failed delete.
 */
export function restoreDetailAfterFailedDelete<T>(
  cache: Map<string, T>,
  detailKey: string,
  previousDetail: T | undefined,
): void {
  if (previousDetail !== undefined) {
    cache.set(detailKey, previousDetail);
  }
}
