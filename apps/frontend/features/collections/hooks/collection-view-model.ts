import type { CollectionEntryResponse, CollectionResponse } from '@gmrlog/types';

/**
 * D3.28 collection presentation model. Pure functions only — covered by
 * `collection-view-model.spec.ts`.
 *
 * ## Which sorts exist, and why not all of them
 *
 * The brief asks for Newest · Oldest · Alphabetical · Rating · Release Date.
 * Three of those are backed by real fields; two are not:
 *
 * - `CollectionResponse` carries `updatedAt` and `title` → Newest, Oldest, A–Z.
 * - `CollectionEntryResponse` carries only `{ gameId, position, note, game }`,
 *   and `LibraryGameSummary` is `{ id, title, slug, coverUrl }`. There is no
 *   rating and no release date anywhere in the payload.
 *
 * Sorting entries by rating or release date therefore needs either a wider
 * entry DTO or an N-request fan-out to `GET /games/:id` per entry. The backend
 * is frozen for D3.28 and the fan-out would be a request storm on a 200-game
 * shelf, so **Rating and Release Date are deliberately not offered** rather than
 * shipped as controls that silently do nothing. See the D3.28 completion report.
 */

export type CollectionSort = 'recent' | 'oldest' | 'alphabetical';

export const COLLECTION_SORT_ORDER: readonly CollectionSort[] = [
  'recent',
  'oldest',
  'alphabetical',
];

export const COLLECTION_SORT_LABELS: Record<CollectionSort, string> = {
  recent: 'Recently updated',
  oldest: 'Oldest first',
  alphabetical: 'A–Z',
};

export function sortCollections(
  collections: readonly CollectionResponse[],
  sort: CollectionSort,
): CollectionResponse[] {
  const next = [...collections];

  switch (sort) {
    case 'recent':
      return next.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    case 'oldest':
      return next.sort((a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt));
    case 'alphabetical':
      // Locale-aware so accented titles file where a reader expects them.
      return next.sort((a, b) => a.title.localeCompare(b.title));
    default: {
      const _exhaustive: never = sort;
      return _exhaustive;
    }
  }
}

export type CollectionEntrySort = 'curated' | 'alphabetical';

export const COLLECTION_ENTRY_SORT_LABELS: Record<CollectionEntrySort, string> = {
  curated: 'Curated order',
  alphabetical: 'A–Z',
};

/**
 * Order entries for display.
 *
 * `curated` is the default and is the author's own ordering — a collection is a
 * statement, and re-sorting it by default would overwrite the point of it.
 */
export function sortCollectionEntries(
  entries: readonly CollectionEntryResponse[],
  sort: CollectionEntrySort,
): CollectionEntryResponse[] {
  const next = [...entries];

  switch (sort) {
    case 'curated':
      return next.sort((a, b) => a.position - b.position);
    case 'alphabetical':
      return next.sort((a, b) =>
        (a.game?.title ?? a.gameId).localeCompare(b.game?.title ?? b.gameId),
      );
    default: {
      const _exhaustive: never = sort;
      return _exhaustive;
    }
  }
}

export type CollectionLayout = 'grid' | 'list';

export interface CollectionStats {
  gameCount: number;
  followerCount: number;
  withNotes: number;
}

/**
 * Headline numbers for a collection.
 *
 * `withNotes` is the one that says whether this is a curated argument or just a
 * pile — a shelf where most entries carry a note was written, not collected.
 */
export function collectionStats(collection: CollectionResponse): CollectionStats {
  return {
    gameCount: collection.entries.length,
    followerCount: collection.followerCount,
    withNotes: collection.entries.filter(
      (entry) => entry.note !== null && entry.note.trim().length > 0,
    ).length,
  };
}

/**
 * Cover artwork for a collection.
 *
 * Falls back through the author's chosen cover, the banner, then the first
 * entry that actually has art. A collection with games in it should never
 * render as a grey rectangle just because nobody set a cover.
 */
export function resolveCollectionCover(collection: CollectionResponse): string | null {
  if (collection.coverUrl !== null && collection.coverUrl.length > 0) {
    return collection.coverUrl;
  }
  if (collection.bannerUrl !== null && collection.bannerUrl.length > 0) {
    return collection.bannerUrl;
  }
  const firstWithArt = [...collection.entries]
    .sort((a, b) => a.position - b.position)
    .find((entry) => entry.game?.coverUrl != null && entry.game.coverUrl.length > 0);
  return firstWithArt?.game?.coverUrl ?? null;
}

/** Up to four entry covers for a mosaic tile, in curated order. */
export function collectionMosaicCovers(collection: CollectionResponse, limit = 4): string[] {
  return [...collection.entries]
    .sort((a, b) => a.position - b.position)
    .flatMap((entry) => {
      const url = entry.game?.coverUrl;
      return url != null && url.length > 0 ? [url] : [];
    })
    .slice(0, limit);
}
