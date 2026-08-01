import type { CommentResponse, ReviewResponse } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import {
  buildCommentThreads,
  countThreadComments,
  countWords,
  formatReadingTime,
  isReviewAuthor,
  readingTimeMinutes,
  reviewQuoteSeed,
  reviewShareMessage,
  reviewShareUrl,
  selectRelatedReviews,
  shouldHideSpoilerBody,
  WORDS_PER_MINUTE,
} from './review-detail-model';

function review(overrides: Partial<ReviewResponse> & { id: string }): ReviewResponse {
  return {
    author: { id: 'author-1', handle: 'author', displayName: 'Author One', avatarUrl: null },
    body: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    visibility: 'public',
    rating: 8,
    containsSpoilers: false,
    gameId: 'game-1',
    ...overrides,
  };
}

function comment(id: string, parentCommentId: string | null = null): CommentResponse {
  return {
    id,
    author: { id: `u-${id}`, handle: id, displayName: id, avatarUrl: null },
    body: `body ${id}`,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    hostType: 'review',
    hostId: 'review-1',
    parentCommentId,
  };
}

describe('countWords', () => {
  it('counts whitespace-separated words and ignores padding', () => {
    expect(countWords('  one   two\nthree  ')).toBe(3);
  });

  it('treats null and blank as zero', () => {
    expect(countWords(null)).toBe(0);
    expect(countWords('   ')).toBe(0);
  });
});

describe('readingTimeMinutes', () => {
  it('rounds part-minutes up rather than down', () => {
    const body = Array.from({ length: WORDS_PER_MINUTE + 1 }, () => 'word').join(' ');
    expect(readingTimeMinutes(body)).toBe(2);
  });

  /** "0 min read" is noise; the caller omits the line instead. */
  it('never returns zero for a review that has words', () => {
    expect(readingTimeMinutes('short')).toBe(1);
  });

  it('returns null when there is nothing to read', () => {
    expect(readingTimeMinutes(null)).toBeNull();
    expect(formatReadingTime(null)).toBeNull();
  });

  it('formats as a human phrase', () => {
    expect(formatReadingTime('one two three')).toBe('1 min read');
  });
});

describe('shouldHideSpoilerBody', () => {
  it('hides a spoiler review from everyone but its author', () => {
    const spoiler = review({ id: 'r1', containsSpoilers: true });

    expect(shouldHideSpoilerBody(spoiler, 'someone-else')).toBe(true);
    expect(shouldHideSpoilerBody(spoiler, 'author-1')).toBe(false);
  });

  it('hides from a signed-out reader too', () => {
    expect(shouldHideSpoilerBody(review({ id: 'r1', containsSpoilers: true }), null)).toBe(true);
  });

  it('never gates a review that is not marked', () => {
    expect(shouldHideSpoilerBody(review({ id: 'r1' }), 'someone-else')).toBe(false);
  });
});

describe('isReviewAuthor', () => {
  it('is false for a signed-out reader', () => {
    expect(isReviewAuthor(review({ id: 'r1' }), null)).toBe(false);
    expect(isReviewAuthor(review({ id: 'r1' }), undefined)).toBe(false);
  });

  it('is true only for the author', () => {
    expect(isReviewAuthor(review({ id: 'r1' }), 'author-1')).toBe(true);
    expect(isReviewAuthor(review({ id: 'r1' }), 'other')).toBe(false);
  });
});

describe('buildCommentThreads', () => {
  it('nests replies under their root comment', () => {
    const threads = buildCommentThreads([comment('a'), comment('b', 'a'), comment('c')]);

    expect(threads.map((t) => t.comment.id)).toEqual(['a', 'c']);
    expect(threads[0]?.replies.map((r) => r.id)).toEqual(['b']);
  });

  /** Deleted or unloaded parents must not swallow their children. */
  it('promotes an orphaned reply to a root rather than dropping it', () => {
    const threads = buildCommentThreads([comment('orphan', 'missing-parent')]);

    expect(threads.map((t) => t.comment.id)).toEqual(['orphan']);
  });

  it('flattens a reply-to-a-reply into the same root thread', () => {
    const threads = buildCommentThreads([
      comment('root'),
      comment('child', 'root'),
      comment('grandchild', 'child'),
    ]);

    expect(threads).toHaveLength(1);
    expect(threads[0]?.replies.map((r) => r.id)).toEqual(['child', 'grandchild']);
  });

  it('counts every comment across every thread', () => {
    const threads = buildCommentThreads([comment('a'), comment('b', 'a'), comment('c')]);
    expect(countThreadComments(threads)).toBe(3);
  });

  it('returns nothing for an empty thread', () => {
    expect(buildCommentThreads([])).toEqual([]);
    expect(countThreadComments([])).toBe(0);
  });
});

describe('sharing', () => {
  it('builds a stable canonical url', () => {
    expect(reviewShareUrl('r1')).toBe('https://gmrlog.app/review/r1');
  });

  /** A shared spoiler review must not leak the thing it warns about. */
  it('never puts the review body in the share text', () => {
    const spoiler = review({
      id: 'r1',
      containsSpoilers: true,
      body: 'THE DOG DIES',
      game: { id: 'g1', title: 'Sad Game', slug: 'sad-game', coverUrl: null },
    });

    const message = reviewShareMessage(spoiler);
    expect(message).not.toContain('THE DOG DIES');
    expect(message).toContain('Sad Game');
    expect(message).toContain(reviewShareUrl('r1'));
  });

  it('falls back gracefully when the game is not embedded', () => {
    expect(reviewShareMessage(review({ id: 'r1' }))).toContain('a game');
  });

  it('seeds a quote with attribution and a link, never the original text', () => {
    const seed = reviewQuoteSeed(
      review({
        id: 'r1',
        body: 'MY WORDS',
        game: { id: 'g1', title: 'Celeste', slug: 'celeste', coverUrl: null },
      }),
    );

    expect(seed).toContain('Author One');
    expect(seed).toContain('Celeste');
    expect(seed).not.toContain('MY WORDS');
  });
});

describe('selectRelatedReviews', () => {
  it('excludes the review being read', () => {
    const related = selectRelatedReviews([review({ id: 'r1' }), review({ id: 'r2' })], 'r1');
    expect(related.map((r) => r.id)).toEqual(['r2']);
  });

  it('orders newest first', () => {
    const related = selectRelatedReviews(
      [
        review({ id: 'old', createdAt: '2026-01-01T00:00:00.000Z' }),
        review({ id: 'new', createdAt: '2026-07-01T00:00:00.000Z' }),
      ],
      'current',
    );

    expect(related.map((r) => r.id)).toEqual(['new', 'old']);
  });

  it('honours the limit', () => {
    const many = Array.from({ length: 10 }, (_, i) => review({ id: `r${String(i)}` }));
    expect(selectRelatedReviews(many, 'none', 3)).toHaveLength(3);
  });
});
