import type { ApiEnvelope, BookmarkResponse, PostResponse } from '@gmrlog/types';
import type { InfiniteData } from '@tanstack/react-query';

export type BookmarksInfiniteData = InfiniteData<ApiEnvelope<BookmarkResponse[]>>;

export interface BookmarkPostRow {
  bookmark: BookmarkResponse;
  post: PostResponse | null;
}

export type BookmarksListStatus = 'loading' | 'error' | 'empty' | 'ready';

export interface BookmarksListViewModel {
  status: BookmarksListStatus;
  items: BookmarkPostRow[];
  error: unknown;
  isRefreshing: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
}

export function resolveBookmarksView(input: {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  items: BookmarkPostRow[];
  isRefreshing: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
}): BookmarksListViewModel {
  if (input.isPending && input.items.length === 0) {
    return {
      status: 'loading',
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
    status: 'ready',
    items: input.items,
    error: input.error,
    isRefreshing: input.isRefreshing,
    isFetchingNextPage: input.isFetchingNextPage,
    hasNextPage: input.hasNextPage,
  };
}
