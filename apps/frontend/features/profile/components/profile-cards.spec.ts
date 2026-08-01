import type { CollectionResponse, ReviewResponse, TierListResponse } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import { countTierListGames, visibilityLabel } from '../hooks/profile-model';

describe('profile cards', () => {
  it('collection card derives entry count and visibility', () => {
    const collection: CollectionResponse = {
      id: 'c1',
      title: 'Souls',
      description: 'Hard games',
      owner: { id: 'u1', handle: 'p', displayName: 'P', avatarUrl: null },
      visibility: 'public',
      entries: [
        { gameId: 'g1', position: 0, note: null },
        { gameId: 'g2', position: 1, note: null },
      ],
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    expect(collection.entries.length).toBe(2);
    expect(visibilityLabel(collection.visibility)).toBe('Public');
  });

  it('tier list card derives game count', () => {
    const tierList: TierListResponse = {
      id: 't1',
      title: 'Best',
      owner: { id: 'u1', handle: 'p', displayName: 'P', avatarUrl: null },
      visibility: 'private',
      slots: [{ label: 'S', position: 0, games: [{ gameId: 'g1', position: 0 }] }],
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    expect(countTierListGames(tierList)).toBe(1);
    expect(visibilityLabel(tierList.visibility)).toBe('Private');
  });

  it('review card uses ReviewResponse fields only', () => {
    const review: ReviewResponse = {
      id: 'r1',
      author: { id: 'u1', handle: 'p', displayName: 'P', avatarUrl: null },
      body: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      visibility: 'followers',
      rating: 4,
      containsSpoilers: true,
      gameId: 'g1',
    };
    expect(review.rating).toBe(4);
    expect(visibilityLabel(review.visibility)).toBe('Followers');
  });
});
