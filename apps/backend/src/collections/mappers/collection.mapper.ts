import type { Collection, CollectionEntry, Game, User } from '@gmrlog/database';
import type {
  CollectionEntryResponse,
  CollectionResponse,
  LibraryGameSummary,
  UserPublicResponse,
} from '@gmrlog/types';

import { resolveMediaUrl } from '../../infrastructure/media/resolve-media-url';

export const resolveAvatarUrl = resolveMediaUrl;
export const resolveCoverUrl = resolveMediaUrl;

export function toUserPublicResponse(user: User): UserPublicResponse {
  return {
    id: user.id,
    handle: user.handle,
    displayName: user.displayName,
    avatarUrl: resolveAvatarUrl(user.avatarKey),
  };
}

export function toCollectionGameSummary(game: Game): LibraryGameSummary {
  return {
    id: game.id,
    title: game.title,
    slug: game.slug,
    coverUrl: resolveCoverUrl(game.coverKey),
  };
}

export function toCollectionEntryResponse(
  entry: CollectionEntry,
  game?: Game,
): CollectionEntryResponse {
  return {
    gameId: entry.gameId,
    position: entry.position,
    note: entry.note,
    ...(game !== undefined ? { game: toCollectionGameSummary(game) } : {}),
  };
}

export function toCollectionResponse(
  collection: Collection,
  owner: User,
  entries: CollectionEntry[],
  gamesById: Map<string, Game>,
  followerCount = 0,
): CollectionResponse {
  return {
    id: collection.id,
    title: collection.title,
    description: collection.description,
    owner: toUserPublicResponse(owner),
    visibility: collection.visibility,
    type: collection.type,
    ruleKey: collection.ruleKey,
    bannerUrl: resolveMediaUrl(collection.bannerKey),
    coverUrl: resolveMediaUrl(collection.coverKey),
    color: collection.color,
    tags: collection.tags,
    followerCount,
    entries: entries.map((entry) => toCollectionEntryResponse(entry, gamesById.get(entry.gameId))),
    updatedAt: collection.updatedAt.toISOString(),
  };
}

/**
 * S1 §9.3 / §15.8 — visibility gate.
 * `followers` requires an authenticated viewer who follows the owner
 * (`viewerFollowsOwner` from FollowRepository.exists). Guests never pass.
 */
export function canViewerReadCollection(
  visibility: Collection['visibility'],
  ownerId: string,
  viewerId: string | null,
  viewerFollowsOwner = false,
): boolean {
  if (visibility === 'public') {
    return true;
  }
  if (viewerId === null) {
    return false;
  }
  if (viewerId === ownerId) {
    return true;
  }
  return visibility === 'followers' && viewerFollowsOwner;
}
