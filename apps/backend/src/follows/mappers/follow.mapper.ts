import type { Follow, User } from '@gmrlog/database';
import type { FollowResponse, UserPublicResponse } from '@gmrlog/types';

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

export function toFollowResponse(follow: Follow, follower: User, followee: User): FollowResponse {
  return {
    follower: toUserPublicResponse(follower),
    followee: toUserPublicResponse(followee),
    createdAt: follow.createdAt.toISOString(),
  };
}
