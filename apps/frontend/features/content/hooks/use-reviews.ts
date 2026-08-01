import type { ReviewResponse } from '@gmrlog/types';
import type { ReviewCreateInput, ReviewPatchInput } from '@gmrlog/validators';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { queryKeys } from '../../../src/query/query-client';

import { createIdempotencyKey, resolveListView } from './content-model';

export function useGameReviews(gameId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.reviews.byGame(gameId),
    enabled: gameId.length > 0,
    queryFn: async () => {
      const envelope = await api.listGameReviews(gameId);
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
    await queryClient.invalidateQueries({ queryKey: queryKeys.reviews.byGame(gameId) });
  }, [gameId, queryClient]);

  return {
    ...view,
    refresh,
    refetch: query.refetch,
  };
}

export function useReview(reviewId: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: queryKeys.reviews.detail(reviewId),
    enabled: reviewId.length > 0,
    queryFn: async () => {
      const envelope = await api.getReview(reviewId);
      return envelope.data;
    },
  });
}

export function useCreateReview() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReviewCreateInput) => {
      const envelope = await api.createReview(input, createIdempotencyKey('review'));
      return envelope.data;
    },
    onSuccess: (review) => {
      queryClient.setQueryData(queryKeys.reviews.detail(review.id), review);
      void queryClient.invalidateQueries({ queryKey: queryKeys.reviews.byGame(review.gameId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.activity.all });
    },
  });
}

export function useUpdateReview(reviewId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReviewPatchInput) => {
      const envelope = await api.patchReview(reviewId, input);
      return envelope.data;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.reviews.detail(reviewId) });
      const previous = queryClient.getQueryData<ReviewResponse>(queryKeys.reviews.detail(reviewId));
      if (previous) {
        const optimistic: ReviewResponse = {
          ...previous,
          ...input,
          body: input.body === undefined ? previous.body : input.body,
          updatedAt: new Date().toISOString(),
        };
        queryClient.setQueryData(queryKeys.reviews.detail(reviewId), optimistic);
        const listKey = queryKeys.reviews.byGame(previous.gameId);
        const list = queryClient.getQueryData<ReviewResponse[]>(listKey);
        if (list) {
          queryClient.setQueryData(
            listKey,
            list.map((item) => (item.id === reviewId ? optimistic : item)),
          );
        }
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      const previous = context?.previous;
      if (!previous) {
        return;
      }
      queryClient.setQueryData(queryKeys.reviews.detail(reviewId), previous);
      const listKey = queryKeys.reviews.byGame(previous.gameId);
      const list = queryClient.getQueryData<ReviewResponse[]>(listKey);
      if (list) {
        queryClient.setQueryData(
          listKey,
          list.map((item) => (item.id === reviewId ? previous : item)),
        );
      }
    },
    onSuccess: (review) => {
      queryClient.setQueryData(queryKeys.reviews.detail(review.id), review);
      void queryClient.invalidateQueries({ queryKey: queryKeys.reviews.byGame(review.gameId) });
    },
  });
}

export function useDeleteReview() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; gameId: string }) => {
      await api.deleteReview(input.id);
      return input;
    },
    onMutate: async (input) => {
      const listKey = queryKeys.reviews.byGame(input.gameId);
      const detailKey = queryKeys.reviews.detail(input.id);
      await queryClient.cancelQueries({ queryKey: listKey });
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<ReviewResponse[]>(listKey);
      const previousDetail = queryClient.getQueryData<ReviewResponse>(detailKey);
      if (previous) {
        queryClient.setQueryData(
          listKey,
          previous.filter((item) => item.id !== input.id),
        );
      }
      queryClient.removeQueries({ queryKey: detailKey });
      return { previous, listKey, previousDetail, detailKey };
    },
    onError: (_error, _input, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(context.listKey, context.previous);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(context.detailKey, context.previousDetail);
      }
    },
    onSuccess: (input) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reviews.byGame(input.gameId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.activity.all });
    },
  });
}
