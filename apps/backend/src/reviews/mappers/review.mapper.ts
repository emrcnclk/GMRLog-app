import type { Game, Review, User } from '@gmrlog/database';
import type { LibraryGameSummary, ReviewResponse, UserPublicResponse } from '@gmrlog/types';

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

export function toReviewGameSummary(game: Game): LibraryGameSummary {
  return {
    id: game.id,
    title: game.title,
    slug: game.slug,
    coverUrl: resolveCoverUrl(game.coverKey),
  };
}

export function toReviewResponse(review: Review, author: User, game?: Game): ReviewResponse {
  return {
    id: review.id,
    author: toUserPublicResponse(author),
    body: review.body,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
    visibility: review.visibility,
    rating: review.rating,
    containsSpoilers: review.containsSpoilers,
    gameId: review.gameId,
    ...(game !== undefined ? { game: toReviewGameSummary(game) } : {}),
  };
}

/**
 * S1 §9.3 / §15.4 — visibility gate.
 * `followers` requires an authenticated viewer who follows the author
 * (`viewerFollowsAuthor` from FollowRepository.exists). Guests never pass.
 */
export function canViewerReadReview(
  visibility: Review['visibility'],
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
