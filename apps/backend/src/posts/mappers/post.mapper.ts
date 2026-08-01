import type { Game, Post, User } from '@gmrlog/database';
import type { LibraryGameSummary, PostResponse, UserPublicResponse } from '@gmrlog/types';

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

export function toPostGameSummary(game: Game): LibraryGameSummary {
  return {
    id: game.id,
    title: game.title,
    slug: game.slug,
    coverUrl: resolveCoverUrl(game.coverKey),
  };
}

export function toPostResponse(post: Post, author: User, game?: Game): PostResponse {
  return {
    id: post.id,
    author: toUserPublicResponse(author),
    body: post.body,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    visibility: post.visibility,
    gameId: post.gameId,
    communityId: post.communityId,
    ...(game !== undefined ? { game: toPostGameSummary(game) } : {}),
    postKind: post.postKind,
    containsSpoilers: post.containsSpoilers,
    pinnedAt: post.pinnedAt !== null ? post.pinnedAt.toISOString() : null,
  };
}

/**
 * S1 §9.3 / §15.4 — visibility gate.
 * `followers` requires an authenticated viewer who follows the author
 * (`viewerFollowsAuthor` from FollowRepository.exists). Guests never pass.
 */
export function canViewerReadPost(
  visibility: Post['visibility'],
  authorId: string,
  viewerId: string | null,
  viewerFollowsAuthor = false,
): boolean {
  if (visibility === 'public') {
    return true;
  }
  if (viewerId === null) {
    return false;
  }
  if (viewerId === authorId) {
    return true;
  }
  return visibility === 'followers' && viewerFollowsAuthor;
}
