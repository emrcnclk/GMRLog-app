import type { ApiEnvelope, BookmarkResponse } from '@gmrlog/types';
import { BOOKMARK_LIST_DEFAULT_LIMIT } from '@gmrlog/validators';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import type { AxiosApiClient } from '../../../src/api/axios-client';
import { getNextPageParam, queryKeys } from '../../../src/query/query-client';

import {
  resolveBookmarksView,
  type BookmarkPostRow,
  type BookmarksInfiniteData,
} from './bookmarks-model';

async function hydrateBookmarkPage(
  api: AxiosApiClient,
  bookmarks: BookmarkResponse[],
): Promise<BookmarkPostRow[]> {
  const rows = await Promise.all(
    bookmarks.map(async (bookmark) => {
      try {
        const envelope = await api.getPost(bookmark.postId);
        return { bookmark, post: envelope.data };
      } catch {
        return { bookmark, post: null };
      }
    }),
  );
  return rows;
}

export function useBookmarks() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: queryKeys.bookmarks.list(),
    queryFn: async ({ pageParam }) => {
      const envelope = await api.listBookmarks({
        limit: BOOKMARK_LIST_DEFAULT_LIMIT,
        ...(pageParam !== undefined ? { cursor: pageParam } : {}),
      });
      const rows = await hydrateBookmarkPage(api, envelope.data);
      return {
        data: rows,
        meta: envelope.meta,
      } satisfies ApiEnvelope<BookmarkPostRow[]>;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.meta),
  });

  const items: BookmarkPostRow[] = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data?.pages],
  );

  const view = resolveBookmarksView({
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    items,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.list() });
  }, [queryClient]);

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);

  return {
    ...view,
    refresh,
    loadMore,
    refetch: query.refetch,
  };
}

export type { BookmarksInfiniteData, BookmarkPostRow };
