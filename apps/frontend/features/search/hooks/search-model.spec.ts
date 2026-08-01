import { describe, expect, it } from 'vitest';

import {
  normalizeSearchQuery,
  resolveSearchScreenView,
  routeForSearchHit,
  searchHitKey,
  SEARCH_DEBOUNCE_MS,
} from './search-model';

describe('normalizeSearchQuery', () => {
  it('trims whitespace', () => {
    expect(normalizeSearchQuery('  hollow  ')).toBe('hollow');
    expect(normalizeSearchQuery('   ')).toBe('');
  });
});

describe('resolveSearchScreenView', () => {
  it('shows recent when query empty', () => {
    expect(
      resolveSearchScreenView({
        normalizedQuery: '',
        isDebouncing: false,
        isPending: false,
        isError: false,
        error: null,
        items: [],
        isRefreshing: false,
        isFetchingNextPage: false,
        hasNextPage: false,
      }).status,
    ).toBe('recent');
  });

  it('shows searching while debouncing or pending', () => {
    expect(
      resolveSearchScreenView({
        normalizedQuery: 'game',
        isDebouncing: true,
        isPending: false,
        isError: false,
        error: null,
        items: [],
        isRefreshing: false,
        isFetchingNextPage: false,
        hasNextPage: false,
      }).status,
    ).toBe('searching');

    expect(
      resolveSearchScreenView({
        normalizedQuery: 'game',
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

  it('shows error / empty / results', () => {
    expect(
      resolveSearchScreenView({
        normalizedQuery: 'game',
        isDebouncing: false,
        isPending: false,
        isError: true,
        error: new Error('x'),
        items: [],
        isRefreshing: false,
        isFetchingNextPage: false,
        hasNextPage: false,
      }).status,
    ).toBe('error');

    expect(
      resolveSearchScreenView({
        normalizedQuery: 'game',
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

    expect(
      resolveSearchScreenView({
        normalizedQuery: 'game',
        isDebouncing: false,
        isPending: false,
        isError: false,
        error: null,
        items: [{ id: '1' }],
        isRefreshing: false,
        isFetchingNextPage: false,
        hasNextPage: true,
      }).status,
    ).toBe('results');
  });
});

describe('routeForSearchHit', () => {
  it('maps every supported SearchHit type', () => {
    expect(routeForSearchHit({ type: 'game', id: 'g1' })).toBe('/(app)/game/g1');
    expect(routeForSearchHit({ type: 'user', id: 'u1' })).toBe('/(app)/user/u1');
    expect(routeForSearchHit({ type: 'community', id: 'c1' })).toBe('/(app)/community/c1');
    expect(routeForSearchHit({ type: 'review', id: 'r1' })).toBe('/(app)/review/r1');
    expect(routeForSearchHit({ type: 'post', id: 'p1' })).toBe('/(app)/post/p1');
    expect(routeForSearchHit({ type: 'collection', id: 'col1' })).toBe('/(app)/collection/col1');
    expect(routeForSearchHit({ type: 'tier-list', id: 't1' })).toBe('/(app)/tier-list/t1');
    expect(routeForSearchHit({ type: 'event', id: 'e1' })).toBe('/(app)/event/e1');
  });

  it('builds stable keys without reordering', () => {
    const keys = [
      searchHitKey({ type: 'game', id: '1' }),
      searchHitKey({ type: 'user', id: '2' }),
      searchHitKey({ type: 'post', id: '3' }),
    ];
    expect(keys).toEqual(['game:1', 'user:2', 'post:3']);
  });
});

describe('debounce contract', () => {
  it('uses 300ms debounce', () => {
    expect(SEARCH_DEBOUNCE_MS).toBe(300);
  });
});
