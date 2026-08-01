import { describe, expect, it } from 'vitest';

import {
  DELETE_MUTATIONS_WITH_DETAIL_ROLLBACK,
  INVALIDATION_AUDIT_DOMAINS,
  restoreDetailAfterFailedDelete,
} from './query-audit';

describe('D3.16 query invalidation audit', () => {
  it('covers core mutable domains', () => {
    expect(INVALIDATION_AUDIT_DOMAINS).toContain('communities');
    expect(INVALIDATION_AUDIT_DOMAINS).toContain('notifications');
    expect(INVALIDATION_AUDIT_DOMAINS).toContain('settings');
  });
});

describe('D3.16 optimistic rollback audit', () => {
  it('lists delete mutations that restore detail on failure', () => {
    expect(DELETE_MUTATIONS_WITH_DETAIL_ROLLBACK).toEqual([
      'useDeleteCommunity',
      'useDeleteCollection',
      'useDeleteTierList',
      'useDeletePost',
      'useDeleteReview',
    ]);
  });

  it('restores detail cache after failed delete', () => {
    const cache = new Map<string, { id: string }>();
    const detail = { id: 'c_1' };
    restoreDetailAfterFailedDelete(cache, 'communities.detail.c_1', detail);
    expect(cache.get('communities.detail.c_1')).toEqual(detail);
  });

  it('does not invent detail when previous was missing', () => {
    const cache = new Map<string, { id: string }>();
    restoreDetailAfterFailedDelete(cache, 'communities.detail.c_1', undefined);
    expect(cache.has('communities.detail.c_1')).toBe(false);
  });
});
