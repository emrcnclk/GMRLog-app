import type { PostResponse, ReviewResponse } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import { visibilityLabel } from '../hooks/content-model';

describe('content cards', () => {
  it('review card fields include rating spoilers visibility', () => {
    const review: ReviewResponse = {
      id: 'r1',
      author: { id: 'u1', handle: 'p', displayName: 'Player', avatarUrl: null },
      body: 'Solid',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      visibility: 'followers',
      rating: 9,
      containsSpoilers: true,
      gameId: 'g1',
      game: { id: 'g1', title: 'Game', slug: 'game', coverUrl: null },
    };
    expect(review.rating).toBe(9);
    expect(review.containsSpoilers).toBe(true);
    expect(visibilityLabel(review.visibility)).toBe('Followers');
  });

  it('post card fields include body and optional game', () => {
    const post: PostResponse = {
      id: 'p1',
      author: { id: 'u1', handle: 'p', displayName: 'Player', avatarUrl: null },
      body: 'Culture check',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      visibility: 'private',
      gameId: null,
      communityId: null,
    };
    expect(post.body.length).toBeGreaterThan(0);
    expect(visibilityLabel(post.visibility)).toBe('Private');
  });
});
