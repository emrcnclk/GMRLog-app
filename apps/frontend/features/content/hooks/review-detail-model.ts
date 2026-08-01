import type { CommentResponse, ReviewResponse } from '@gmrlog/types';

/**
 * D3.28 review-page presentation model. Pure functions only — covered by
 * `review-detail-model.spec.ts`.
 */

/**
 * Adult silent-reading speed for prose, in words per minute.
 *
 * Deliberately conservative. The number exists to set an expectation ("this is
 * a two-minute read"), and over-promising speed is the failure that matters —
 * an under-promise costs nothing.
 */
export const WORDS_PER_MINUTE = 200;

export function countWords(body: string | null): number {
  if (body === null) {
    return 0;
  }
  const trimmed = body.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

/**
 * Reading time, rounded up to whole minutes and floored at one.
 *
 * "0 min read" is noise, and a review short enough to produce it does not need
 * the label at all — callers get `null` and omit the line.
 */
export function readingTimeMinutes(body: string | null): number | null {
  const words = countWords(body);
  if (words === 0) {
    return null;
  }
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export function formatReadingTime(body: string | null): string | null {
  const minutes = readingTimeMinutes(body);
  return minutes === null ? null : `${String(minutes)} min read`;
}

/**
 * Whether the body should start hidden.
 *
 * A spoiler warning that reveals the spoiler while you decide is not a warning.
 * The author's own view is exempt — they wrote it, and hiding their words from
 * them would be theatre.
 */
export function shouldHideSpoilerBody(
  review: Pick<ReviewResponse, 'containsSpoilers' | 'author'>,
  viewerId: string | null | undefined,
): boolean {
  if (!review.containsSpoilers) {
    return false;
  }
  return viewerId !== review.author.id;
}

export function isReviewAuthor(
  review: Pick<ReviewResponse, 'author'>,
  viewerId: string | null | undefined,
): boolean {
  return viewerId !== null && viewerId !== undefined && viewerId === review.author.id;
}

export interface CommentThread {
  comment: CommentResponse;
  replies: CommentResponse[];
}

/**
 * Fold a flat comment list into one level of threading.
 *
 * `GET /reviews/:id/comments` returns a flat array with `parentCommentId`; the
 * backend imposes no depth limit, but the UI collapses everything below the
 * first reply into that reply's parent thread. Deeper nesting on a phone reduces
 * each level to a sliver of usable width, and the conversations here are short
 * enough that flattening loses nothing.
 *
 * A reply whose parent is absent — deleted, or on a page not loaded — is
 * promoted to a root rather than dropped, so no one's words silently vanish.
 */
export function buildCommentThreads(comments: readonly CommentResponse[]): CommentThread[] {
  const byId = new Set(comments.map((comment) => comment.id));
  const threads: CommentThread[] = [];
  const threadById = new Map<string, CommentThread>();

  for (const comment of comments) {
    const isRoot = comment.parentCommentId === null || !byId.has(comment.parentCommentId);
    if (isRoot) {
      const thread: CommentThread = { comment, replies: [] };
      threads.push(thread);
      threadById.set(comment.id, thread);
    }
  }

  for (const comment of comments) {
    if (comment.parentCommentId === null) {
      continue;
    }
    const parentThread = threadById.get(comment.parentCommentId);
    if (parentThread !== undefined) {
      parentThread.replies.push(comment);
      continue;
    }
    // Parent exists in the page but is itself a reply — attach to its thread.
    const grandparent = comments.find((candidate) => candidate.id === comment.parentCommentId);
    const rootThread =
      grandparent?.parentCommentId != null
        ? threadById.get(grandparent.parentCommentId)
        : undefined;
    rootThread?.replies.push(comment);
  }

  return threads;
}

export function countThreadComments(threads: readonly CommentThread[]): number {
  return threads.reduce((total, thread) => total + 1 + thread.replies.length, 0);
}

/**
 * Canonical shareable URL for a review.
 *
 * Deep links are what the app already resolves (`/(app)/review/:id`); the web
 * origin is what a recipient outside the app can open. Both are built from one
 * place so a share and a copied link can never disagree.
 */
export const SHARE_ORIGIN = 'https://gmrlog.app';

export function reviewShareUrl(reviewId: string): string {
  return `${SHARE_ORIGIN}/review/${reviewId}`;
}

/**
 * Share text.
 *
 * Never includes the review body: a spoiler-marked review pasted into a group
 * chat would leak the very thing the marking exists to contain.
 */
export function reviewShareMessage(
  review: Pick<ReviewResponse, 'id' | 'rating' | 'author' | 'game'>,
): string {
  const gameTitle = review.game?.title ?? 'a game';
  return `${review.author.displayName} rated ${gameTitle} ${String(review.rating)}/10 on GMRLOG — ${reviewShareUrl(review.id)}`;
}

/**
 * Quote text seeded into the composer.
 *
 * Attribution and link only. The reader writes their own take; pre-filling their
 * post with someone else's words invites accidental plagiarism and, for a
 * spoiler review, accidental disclosure.
 */
export function reviewQuoteSeed(review: Pick<ReviewResponse, 'id' | 'author' | 'game'>): string {
  const gameTitle = review.game?.title ?? 'this game';
  return `Re: ${review.author.displayName} on ${gameTitle} — ${reviewShareUrl(review.id)}\n\n`;
}

/**
 * Related reviews for the same game, excluding this one.
 *
 * Sorted by recency because a review page is a conversation about a game right
 * now, not a leaderboard of its best writing.
 */
export function selectRelatedReviews(
  all: readonly ReviewResponse[],
  currentReviewId: string,
  limit = 5,
): ReviewResponse[] {
  return all
    .filter((review) => review.id !== currentReviewId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit);
}
