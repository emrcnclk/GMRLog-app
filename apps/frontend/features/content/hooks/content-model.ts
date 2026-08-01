import type { ContentVisibilityValue } from '@gmrlog/types';
import {
  contentVisibilitySchema,
  POST_BODY_MAX,
  postBodySchema,
  REVIEW_RATING_MAX,
  REVIEW_RATING_MIN,
  reviewRatingSchema,
} from '@gmrlog/validators';
import { z } from 'zod';

export const REVIEW_BODY_MAX = 10_000;

export const VISIBILITY_OPTIONS: readonly ContentVisibilityValue[] = [
  'public',
  'followers',
  'private',
] as const;

export function visibilityLabel(visibility: string): string {
  switch (visibility) {
    case 'public':
      return 'Public';
    case 'followers':
      return 'Followers';
    case 'private':
      return 'Private';
    default:
      return visibility;
  }
}

/** Composer form — rating required · body string (empty → null on submit). */
export const reviewComposerFormSchema = z
  .object({
    rating: reviewRatingSchema,
    body: z.string().max(REVIEW_BODY_MAX),
    containsSpoilers: z.boolean(),
    visibility: contentVisibilitySchema,
  })
  .strict();

export type ReviewComposerFormValues = z.infer<typeof reviewComposerFormSchema>;

export const postComposerFormSchema = z
  .object({
    body: postBodySchema,
    visibility: contentVisibilitySchema,
    /** Empty string means unlinked; otherwise opaque game id. */
    gameId: z.string().max(64),
    includePoll: z.boolean(),
    pollQuestion: z.string().max(280),
    pollOptionA: z.string().max(100),
    pollOptionB: z.string().max(100),
    pollOptionC: z.string().max(100),
    pollOptionD: z.string().max(100),
  })
  .strict();

export type PostComposerFormValues = z.infer<typeof postComposerFormSchema>;

export function buildPollOptions(values: PostComposerFormValues): string[] {
  return [values.pollOptionA, values.pollOptionB, values.pollOptionC, values.pollOptionD]
    .map((option) => option.trim())
    .filter((option) => option.length > 0);
}

export function normalizeReviewBody(body: string): string | null {
  const trimmed = body.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function normalizePostGameId(gameId: string): string | undefined {
  const trimmed = gameId.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export function createIdempotencyKey(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

export function isDirtyValues<T extends Record<string, unknown>>(current: T, baseline: T): boolean {
  return JSON.stringify(current) !== JSON.stringify(baseline);
}

export type ListViewStatus = 'loading' | 'error' | 'empty' | 'ready';

export interface ListViewModel<T> {
  status: ListViewStatus;
  items: T[];
  error: unknown;
  isRefreshing: boolean;
}

export function resolveListView<T>(input: {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  items: T[];
  isRefreshing: boolean;
}): ListViewModel<T> {
  if (input.isPending && input.items.length === 0) {
    return { status: 'loading', items: [], error: null, isRefreshing: false };
  }
  if (input.isError && input.items.length === 0) {
    return {
      status: 'error',
      items: [],
      error: input.error,
      isRefreshing: input.isRefreshing,
    };
  }
  if (input.items.length === 0) {
    return {
      status: 'empty',
      items: [],
      error: null,
      isRefreshing: input.isRefreshing,
    };
  }
  return {
    status: 'ready',
    items: input.items,
    error: input.error,
    isRefreshing: input.isRefreshing,
  };
}

export { POST_BODY_MAX, REVIEW_RATING_MAX, REVIEW_RATING_MIN };
