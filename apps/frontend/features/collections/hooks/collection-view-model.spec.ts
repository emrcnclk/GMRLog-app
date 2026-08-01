import type { CollectionEntryResponse, CollectionResponse } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import {
  COLLECTION_SORT_LABELS,
  COLLECTION_SORT_ORDER,
  collectionMosaicCovers,
  collectionStats,
  resolveCollectionCover,
  sortCollectionEntries,
  sortCollections,
} from './collection-view-model';

function entry(
  gameId: string,
  position: number,
  overrides: Partial<CollectionEntryResponse> = {},
): CollectionEntryResponse {
  return {
    gameId,
    position,
    note: null,
    game: { id: gameId, title: gameId, slug: gameId, coverUrl: null },
    ...overrides,
  };
}

function collection(overrides: Partial<CollectionResponse> & { id: string }): CollectionResponse {
  return {
    title: overrides.id,
    description: null,
    owner: { id: 'u1', handle: 'owner', displayName: 'Owner', avatarUrl: null },
    visibility: 'public',
    type: 'manual',
    ruleKey: null,
    bannerUrl: null,
    coverUrl: null,
    color: null,
    tags: [],
    followerCount: 0,
    entries: [],
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('sortCollections', () => {
  const older = collection({
    id: 'older',
    title: 'Zelda picks',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });
  const newer = collection({
    id: 'newer',
    title: 'Awful games',
    updatedAt: '2026-07-01T00:00:00.000Z',
  });

  it('puts the most recently updated first', () => {
    expect(sortCollections([older, newer], 'recent').map((c) => c.id)).toEqual(['newer', 'older']);
  });

  it('reverses for oldest', () => {
    expect(sortCollections([newer, older], 'oldest').map((c) => c.id)).toEqual(['older', 'newer']);
  });

  it('sorts alphabetically by title, not by id', () => {
    expect(sortCollections([older, newer], 'alphabetical').map((c) => c.id)).toEqual([
      'newer',
      'older',
    ]);
  });

  /** Sorting must not mutate the query cache's array in place. */
  it('leaves the input array untouched', () => {
    const input = [older, newer];
    sortCollections(input, 'recent');
    expect(input.map((c) => c.id)).toEqual(['older', 'newer']);
  });

  it('labels every offered sort', () => {
    for (const sort of COLLECTION_SORT_ORDER) {
      expect(COLLECTION_SORT_LABELS[sort].length).toBeGreaterThan(0);
    }
  });
});

describe('sortCollectionEntries', () => {
  const entries = [entry('celeste', 2), entry('animal-well', 1), entry('braid', 3)];

  it('defaults to the author’s curated order', () => {
    expect(sortCollectionEntries(entries, 'curated').map((e) => e.gameId)).toEqual([
      'animal-well',
      'celeste',
      'braid',
    ]);
  });

  it('sorts alphabetically by game title', () => {
    expect(sortCollectionEntries(entries, 'alphabetical').map((e) => e.gameId)).toEqual([
      'animal-well',
      'braid',
      'celeste',
    ]);
  });

  /** An entry whose game failed to embed must still sort, not crash. */
  it('falls back to the game id when the title is missing', () => {
    const partial = [entry('zzz', 1, { game: undefined }), entry('aaa', 2)];
    expect(sortCollectionEntries(partial, 'alphabetical').map((e) => e.gameId)).toEqual([
      'aaa',
      'zzz',
    ]);
  });
});

describe('collectionStats', () => {
  it('counts games, followers, and annotated entries', () => {
    const stats = collectionStats(
      collection({
        id: 'c',
        followerCount: 12,
        entries: [
          entry('a', 1, { note: 'why this matters' }),
          entry('b', 2),
          entry('c', 3, { note: '   ' }),
        ],
      }),
    );

    expect(stats).toEqual({ gameCount: 3, followerCount: 12, withNotes: 1 });
  });
});

describe('resolveCollectionCover', () => {
  it('prefers the author’s own cover', () => {
    expect(
      resolveCollectionCover(
        collection({ id: 'c', coverUrl: 'cover.jpg', bannerUrl: 'banner.jpg' }),
      ),
    ).toBe('cover.jpg');
  });

  it('falls back to the banner, then to the first entry with art', () => {
    expect(resolveCollectionCover(collection({ id: 'c', bannerUrl: 'banner.jpg' }))).toBe(
      'banner.jpg',
    );

    expect(
      resolveCollectionCover(
        collection({
          id: 'c',
          entries: [
            entry('no-art', 1),
            entry('has-art', 2, {
              game: { id: 'has-art', title: 'Has Art', slug: 'has-art', coverUrl: 'art.jpg' },
            }),
          ],
        }),
      ),
    ).toBe('art.jpg');
  });

  it('returns null only when there is genuinely no artwork anywhere', () => {
    expect(resolveCollectionCover(collection({ id: 'c', entries: [entry('a', 1)] }))).toBeNull();
  });
});

describe('collectionMosaicCovers', () => {
  it('takes covers in curated order and caps the tile count', () => {
    const withArt = (id: string, position: number) =>
      entry(id, position, {
        game: { id, title: id, slug: id, coverUrl: `${id}.jpg` },
      });

    const covers = collectionMosaicCovers(
      collection({
        id: 'c',
        entries: [
          withArt('d', 4),
          withArt('a', 1),
          withArt('b', 2),
          withArt('c', 3),
          withArt('e', 5),
        ],
      }),
    );

    expect(covers).toEqual(['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg']);
  });

  it('skips entries with no artwork rather than emitting gaps', () => {
    const covers = collectionMosaicCovers(
      collection({
        id: 'c',
        entries: [
          entry('none', 1),
          entry('some', 2, {
            game: { id: 'some', title: 'Some', slug: 'some', coverUrl: 'x.jpg' },
          }),
        ],
      }),
    );

    expect(covers).toEqual(['x.jpg']);
  });
});
