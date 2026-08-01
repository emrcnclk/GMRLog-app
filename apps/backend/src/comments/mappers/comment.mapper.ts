import type { Comment, User } from '@gmrlog/database';
import type { CommentResponse, UserPublicResponse } from '@gmrlog/types';

import { resolveMediaUrl as resolveAvatarUrl } from '../../infrastructure/media/resolve-media-url';

export { resolveAvatarUrl };

export function toUserPublicResponse(user: User): UserPublicResponse {
  return {
    id: user.id,
    handle: user.handle,
    displayName: user.displayName,
    avatarUrl: resolveAvatarUrl(user.avatarKey),
  };
}

/** Persistence → S1 §15.4 CommentResponse. Soft-deleted rows are never mapped. */
export function toCommentResponse(comment: Comment, author: User): CommentResponse {
  return {
    id: comment.id,
    author: toUserPublicResponse(author),
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    hostType: comment.hostType,
    hostId: comment.hostId,
    parentCommentId: comment.parentCommentId,
  };
}
