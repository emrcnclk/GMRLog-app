import type { Reaction, User } from '@gmrlog/database';
import type { ReactionResponse, UserPublicResponse } from '@gmrlog/types';

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

/** Persistence → ReactionResponse. Never expose raw Prisma models. */
export function toReactionResponse(reaction: Reaction, actor: User): ReactionResponse {
  return {
    id: reaction.id,
    actor: toUserPublicResponse(actor),
    targetType: reaction.targetType,
    targetId: reaction.targetId,
    kind: reaction.kind,
    createdAt: reaction.createdAt.toISOString(),
  };
}
