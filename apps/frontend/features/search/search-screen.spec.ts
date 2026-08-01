import { describe, expect, it } from 'vitest';

import { resolveSearchScreenView } from './hooks/search-model';

describe('Search loading / empty / error', () => {
  it('prefers searching skeleton before empty results', () => {
    expect(
      resolveSearchScreenView({
        normalizedQuery: 'x',
        isDebouncing: false,
        isPending: true,
        isError: false,
        error: null,
        items: [],
        isRefreshing: false,
        isFetchingNextPage: false,
        hasNextPage: false,
      }).status,
    ).toBe('searching');
  });

  it('shows empty only after settled empty payload', () => {
    expect(
      resolveSearchScreenView({
        normalizedQuery: 'x',
        isDebouncing: false,
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

  it('shows error with retry path', () => {
    expect(
      resolveSearchScreenView({
        normalizedQuery: 'x',
        isDebouncing: false,
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
});
