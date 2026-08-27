import type { Game, LibraryEntry } from '@gmrlog/database';
import type {
  LibraryEntryResponse,
  LibraryGameSummary,
  LibraryHubResponse,
  LibraryStatusValue,
  WishlistMetadataResponse,
} from '@gmrlog/types';

import { resolveMediaUrl } from '../../infrastructure/media/resolve-media-url';

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
 * The shared resolver, aliased — the same line `collection.mapper.ts` already
 * carries.
 *
 * This used to be a stub returning `null` for every key, on the grounds that
 * "the uploads/storage foundation (S1 §13.14) is not mounted yet". It is:
 * `resolveMediaUrl` builds a real URL from `MEDIA_PUBLIC_BASE_URL`, and the
 * games, collections and posts mappers have all been using it. Only the
 * library was still answering `null`.
 *
 * That stayed invisible while the catalogue was empty and no game had a cover
 * key at all. It stopped being invisible the moment the catalogue mirror
 * started downloading covers: a game shows its artwork on the game hub and in
 * a collection, then loses it the instant a player logs it — on their shelf,
 * their profile, and the Platinum case §6 builds out of exactly those entries.
 */
export const resolveCoverUrl = resolveMediaUrl;

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
