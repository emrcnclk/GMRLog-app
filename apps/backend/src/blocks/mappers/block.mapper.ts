import type { Block, User } from '@gmrlog/database';
import type { BlockResponse, UserPublicResponse } from '@gmrlog/types';

import { resolveMediaUrl } from '../../infrastructure/media/resolve-media-url';

export function toUserPublicResponse(user: User): UserPublicResponse {
  return {
    id: user.id,
    handle: user.handle,
    displayName: user.displayName,
    avatarUrl: resolveMediaUrl(user.avatarKey),
  };
}

export function toBlockResponse(block: Block, blocker: User, blocked: User): BlockResponse {
  return {
    blocker: toUserPublicResponse(blocker),
    blocked: toUserPublicResponse(blocked),
    createdAt: block.createdAt.toISOString(),
  };
}
