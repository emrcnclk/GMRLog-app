import type { PostResponse } from '@gmrlog/types';
import type { PostCreateInput, PostPatchInput } from '@gmrlog/validators';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { queryKeys } from '../../../src/query/query-client';

import { createIdempotencyKey, resolveListView } from './content-model';

export function useGamePosts(gameId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.posts.byGame(gameId),
    enabled: gameId.length > 0,
    queryFn: async () => {
      const envelope = await api.listGamePosts(gameId);
      return envelope.data;
    },
  });

  const items = query.data ?? [];

  const view = resolveListView({
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    items,
    isRefreshing: query.isRefetching,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.posts.byGame(gameId) });
  }, [gameId, queryClient]);

  return {
    ...view,
    refresh,
    refetch: query.refetch,
  };
}

export function usePost(postId: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: queryKeys.posts.detail(postId),
    enabled: postId.length > 0,
    queryFn: async () => {
      const envelope = await api.getPost(postId);
      return envelope.data;
    },
  });
}

export function useCreatePost() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PostCreateInput) => {
      const envelope = await api.createPost(input, createIdempotencyKey('post'));
      return envelope.data;
    },
    onSuccess: (post) => {
      queryClient.setQueryData(queryKeys.posts.detail(post.id), post);
      if (post.gameId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.posts.byGame(post.gameId) });
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.activity.all });
    },
  });
}

export function useUpdatePost(postId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PostPatchInput) => {
      const envelope = await api.patchPost(postId, input);
      return envelope.data;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.detail(postId) });
      const previous = queryClient.getQueryData<PostResponse>(queryKeys.posts.detail(postId));
      if (previous) {
        const optimistic: PostResponse = {
          ...previous,
          body: input.body ?? previous.body,
          visibility: input.visibility ?? previous.visibility,
          gameId: input.gameId === undefined ? previous.gameId : input.gameId,
          updatedAt: new Date().toISOString(),
        };
        queryClient.setQueryData(queryKeys.posts.detail(postId), optimistic);
        if (previous.gameId) {
          const listKey = queryKeys.posts.byGame(previous.gameId);
          const list = queryClient.getQueryData<PostResponse[]>(listKey);
          if (list) {
            queryClient.setQueryData(
              listKey,
              list.map((item) => (item.id === postId ? optimistic : item)),
            );
          }
        }
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      const previous = context?.previous;
      if (!previous) {
        return;
      }
      queryClient.setQueryData(queryKeys.posts.detail(postId), previous);
      if (previous.gameId) {
        const listKey = queryKeys.posts.byGame(previous.gameId);
        const list = queryClient.getQueryData<PostResponse[]>(listKey);
        if (list) {
          queryClient.setQueryData(
            listKey,
            list.map((item) => (item.id === postId ? previous : item)),
          );
        }
      }
    },
    onSuccess: (post) => {
      queryClient.setQueryData(queryKeys.posts.detail(post.id), post);
      if (post.gameId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.posts.byGame(post.gameId) });
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
  });
}

export function useDeletePost() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; gameId: string | null }) => {
      await api.deletePost(input.id);
      return input;
    },
    onMutate: async (input) => {
      let previous: PostResponse[] | undefined;
      let listKey: ReturnType<typeof queryKeys.posts.byGame> | undefined;
      const detailKey = queryKeys.posts.detail(input.id);
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previousDetail = queryClient.getQueryData<PostResponse>(detailKey);
      if (input.gameId) {
        listKey = queryKeys.posts.byGame(input.gameId);
        await queryClient.cancelQueries({ queryKey: listKey });
        previous = queryClient.getQueryData<PostResponse[]>(listKey);
        if (previous) {
          queryClient.setQueryData(
            listKey,
            previous.filter((item) => item.id !== input.id),
          );
        }
      }
      queryClient.removeQueries({ queryKey: detailKey });
      return { previous, listKey, previousDetail, detailKey };
    },
    onError: (_error, _input, context) => {
      if (context?.previous && context.listKey) {
        queryClient.setQueryData(context.listKey, context.previous);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(context.detailKey, context.previousDetail);
      }
    },
    onSuccess: (input) => {
      if (input.gameId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.posts.byGame(input.gameId) });
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.activity.all });
    },
  });
}
