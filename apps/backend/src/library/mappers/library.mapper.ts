import type { Game, LibraryEntry } from '@gmrlog/database';
import type {
  LibraryEntryResponse,
  LibraryGameSummary,
  LibraryHubResponse,
  LibraryStatusValue,
  WishlistMetadataResponse,
} from '@gmrlog/types';

/** Closed LibraryStatus vocabulary — hub counts always cover every shelf. */
export const LIBRARY_STATUS_VALUES: readonly LibraryStatusValue[] = [
  'owned',
  'playing',
  'completed',
  'wishlist',
  'backlog',
  'hidden',
  'dropped',
] as const;

/**
 * Storage keys become public URLs through the uploads/storage foundation
 * (S1 §13.14 — not mounted yet). Until then the honest projection is `null`.
 */
export function resolveCoverUrl(key: string | null): string | null {
  void key;
  return null;
}

export function toLibraryGameSummary(game: Game): LibraryGameSummary {
  return {
    id: game.id,
    title: game.title,
    slug: game.slug,
    coverUrl: resolveCoverUrl(game.coverKey),
  };
}

export function toLibraryEntryResponse(
  entry: LibraryEntry,
  game: Game,
  wishlist?: WishlistMetadataResponse | null,
): LibraryEntryResponse {
  return {
    gameId: entry.gameId,
    game: toLibraryGameSummary(game),
    status: entry.status,
    source: entry.source,
    updatedAt: entry.updatedAt.toISOString(),
    // 13.1 — always projected, including as `null`. Omitting the key when the
    // player has not said would make "no figure" and "field not served yet"
    // the same thing on the wire, and a client cannot tell a missing feature
    // from an unanswered question.
    completionPercent: entry.completionPercent,
    completionSource: entry.completionSource,
    ...(wishlist !== undefined ? { wishlist } : {}),
  };
}

export function toWishlistMetadataResponse(row: {
  priority: WishlistMetadataResponse['priority'];
  waitStatus: WishlistMetadataResponse['waitStatus'];
  notes: string | null;
}): WishlistMetadataResponse {
  return {
    priority: row.priority,
    waitStatus: row.waitStatus,
    notes: row.notes,
  };
}

export function toLibraryHubResponse(
  counts: ReadonlyMap<LibraryStatusValue, number>,
): LibraryHubResponse {
  const byStatus = {} as Record<LibraryStatusValue, number>;
  let total = 0;
  for (const status of LIBRARY_STATUS_VALUES) {
    const count = counts.get(status) ?? 0;
    byStatus[status] = count;
    total += count;
  }
  return { counts: byStatus, total };
}
