import { describe, expect, it } from 'vitest';

import { resolveHomeFeedView } from './hooks/activity-feed-model';

describe('EmptyFeed / ErrorState / Loading state order', () => {
  it('prefers loading before empty', () => {
    expect(
      resolveHomeFeedView({
        isPending: true,
        isError: false,
        error: null,
        items: [],
        isRefreshing: false,
        isFetchingNextPage: false,
        hasNextPage: false,
      }).status,
    ).toBe('loading');
  });

  it('prefers error over empty when first load fails', () => {
    expect(
      resolveHomeFeedView({
        isPending: false,
        isError: true,
        error: new Error('offline'),
        items: [],
        isRefreshing: false,
        isFetchingNextPage: false,
        hasNextPage: false,
      }).status,
    ).toBe('error');
  });

  it('shows empty only after a successful empty payload', () => {
    expect(
      resolveHomeFeedView({
        isPending: false,
        isError: false,
        error: null,
        items: [],
        isRefreshing: false,
        isFetchingNextPage: false,
        hasNextPage: false,
      }).status,
    ).toBe('empty');
  });
});
