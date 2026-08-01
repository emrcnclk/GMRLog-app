import { describe, expect, it } from 'vitest';

import { resolveBookmarksView } from './bookmarks-model';

describe('bookmarks model', () => {
  it('resolves loading empty ready states', () => {
    expect(
      resolveBookmarksView({
        isPending: true,
        isError: false,
        error: null,
        items: [],
        isRefreshing: false,
        isFetchingNextPage: false,
        hasNextPage: false,
      }).status,
    ).toBe('loading');

    expect(
      resolveBookmarksView({
        isPending: false,
        isError: false,
        error: null,
        items: [],
        isRefreshing: true,
        isFetchingNextPage: false,
        hasNextPage: false,
      }).status,
    ).toBe('empty');

    expect(
      resolveBookmarksView({
        isPending: false,
        isError: false,
        error: null,
        items: [{ bookmark: { id: 'b1', postId: 'p1', createdAt: '2026-01-01' }, post: null }],
        isRefreshing: false,
        isFetchingNextPage: true,
        hasNextPage: true,
      }).status,
    ).toBe('ready');
  });
});
