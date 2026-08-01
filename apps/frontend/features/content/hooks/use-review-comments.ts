import type { CommentResponse } from '@gmrlog/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { createIdempotencyKey } from '../../../src/api/idempotency';
import { queryKeys } from '../../../src/query/query-client';

import { buildCommentThreads, countThreadComments } from './review-detail-model';

/** `GET /reviews/:id/comments` — flat thread, folded into one level of replies. */
export function useReviewComments(reviewId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.reviews.comments(reviewId),
    enabled: reviewId.length > 0,
    queryFn: async () => {
      const envelope = await api.listReviewComments(reviewId);
      return envelope.data;
    },
  });

  const comments: CommentResponse[] = useMemo(() => query.data ?? [], [query.data]);
  const threads = useMemo(() => buildCommentThreads(comments), [comments]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.reviews.comments(reviewId) });
  }, [queryClient, reviewId]);

  return {
    threads,
    total: countThreadComments(threads),
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    isRefreshing: query.isRefetching,
    refresh,
    refetch: query.refetch,
  };
}

export interface CreateReviewCommentInput {
  body: string;
  /** Present when replying to an existing comment rather than the review. */
  parentCommentId?: string;
}

/**
 * `POST /comments` against a review host.
 *
 * No optimistic insert here, deliberately. A comment is authored content: the
 * server assigns its id and timestamp, and showing a fake row that later
 * changes identity is worse than a brief wait. The invalidate below is the
 * single source of what actually got written.
 */
export function useCreateReviewComment(reviewId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReviewCommentInput) => {
      const envelope = await api.createComment(
        {
          hostType: 'review',
          hostId: reviewId,
          body: input.body,
          ...(input.parentCommentId !== undefined
            ? { parentCommentId: input.parentCommentId }
            : {}),
        },
        // A retried post must not become a second comment.
        createIdempotencyKey('comment'),
      );
      return envelope.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reviews.comments(reviewId) });
    },
  });
}
