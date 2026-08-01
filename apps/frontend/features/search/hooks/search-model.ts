import { useEffect, useState } from 'react';

/** Debounce a value — cancels prior timers on change. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delayMs);
    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debounced;
}

export const SEARCH_DEBOUNCE_MS = 300;

/** Trim + emptiness gate for search queries. */
export function normalizeSearchQuery(raw: string): string {
  return raw.trim();
}

export type SearchScreenStatus = 'recent' | 'searching' | 'error' | 'empty' | 'results';

export interface SearchScreenViewModel<T> {
  status: SearchScreenStatus;
  items: T[];
  error: unknown;
  isRefreshing: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
}

/**
 * Search UI state order:
 * Empty query → Recent · Searching → Skeleton · No results → Empty · Hits → Results
 */
export function resolveSearchScreenView<T>(input: {
  normalizedQuery: string;
  isDebouncing: boolean;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  items: T[];
  isRefreshing: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
}): SearchScreenViewModel<T> {
  if (input.normalizedQuery.length === 0) {
    return {
      status: 'recent',
      items: [],
      error: null,
      isRefreshing: false,
      isFetchingNextPage: false,
      hasNextPage: false,
    };
  }

  if (input.isDebouncing || (input.isPending && input.items.length === 0)) {
    return {
      status: 'searching',
      items: [],
      error: null,
      isRefreshing: false,
      isFetchingNextPage: false,
      hasNextPage: false,
    };
  }

  if (input.isError && input.items.length === 0) {
    return {
      status: 'error',
      items: [],
      error: input.error,
      isRefreshing: input.isRefreshing,
      isFetchingNextPage: false,
      hasNextPage: false,
    };
  }

  if (input.items.length === 0) {
    return {
      status: 'empty',
      items: [],
      error: null,
      isRefreshing: input.isRefreshing,
      isFetchingNextPage: false,
      hasNextPage: false,
    };
  }

  return {
    status: 'results',
    items: input.items,
    error: input.error,
    isRefreshing: input.isRefreshing,
    isFetchingNextPage: input.isFetchingNextPage,
    hasNextPage: input.hasNextPage,
  };
}

export function searchHitKey(hit: { type: string; id: string }): string {
  return `${hit.type}:${hit.id}`;
}

/** Expo route for a SearchHit — detail placeholders for D3.5. */
export function routeForSearchHit(hit: {
  type: string;
  id: string;
}):
  | `/(app)/game/${string}`
  | `/(app)/user/${string}`
  | `/(app)/community/${string}`
  | `/(app)/review/${string}`
  | `/(app)/post/${string}`
  | `/(app)/collection/${string}`
  | `/(app)/tier-list/${string}`
  | `/(app)/event/${string}`
  | null {
  switch (hit.type) {
    case 'game':
      return `/(app)/game/${hit.id}`;
    case 'user':
      return `/(app)/user/${hit.id}`;
    case 'community':
      return `/(app)/community/${hit.id}`;
    case 'review':
      return `/(app)/review/${hit.id}`;
    case 'post':
      return `/(app)/post/${hit.id}`;
    case 'collection':
      return `/(app)/collection/${hit.id}`;
    case 'tier-list':
      return `/(app)/tier-list/${hit.id}`;
    case 'event':
      return `/(app)/event/${hit.id}`;
    default:
      return null;
  }
}
