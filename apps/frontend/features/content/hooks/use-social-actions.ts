import type { QuoteCreateInput } from '@gmrlog/validators';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useApiClient } from '../../../src/api/api-provider';
import { queryKeys } from '../../../src/query/query-client';

export function useCreateQuote() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: QuoteCreateInput) => {
      const envelope = await api.createQuote(input);
      return envelope.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.feed.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.activity.all });
    },
  });
}

export function useBookmarkPost() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const envelope = await api.bookmarkPost(postId);
      return envelope.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.list() });
    },
  });
}

export function useUnbookmarkPost() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      await api.unbookmarkPost(postId);
      return postId;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.list() });
    },
  });
}
