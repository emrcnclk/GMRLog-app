import type { FriendRequest, Friendship, User, UserPresence } from '@gmrlog/database';
import type {
  FriendRequestResponse,
  FriendshipResponse,
  OnlineFriendResponse,
  PresenceResponse,
  PresenceStatusValue,
  UserPublicResponse,
} from '@gmrlog/types';

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

export function toFriendRequestResponse(
  request: FriendRequest,
  sender: User,
  receiver: User,
): FriendRequestResponse {
  return {
    id: request.id,
    status: request.status,
    message: request.message,
    sender: toUserPublicResponse(sender),
    receiver: toUserPublicResponse(receiver),
    createdAt: request.createdAt.toISOString(),
    respondedAt: request.respondedAt?.toISOString() ?? null,
  };
}

export function toFriendshipResponse(
  friendship: Friendship,
  friend: User,
  mutualFriendsCount: number,
): FriendshipResponse {
  return {
    user: toUserPublicResponse(friend),
    friendsSince: friendship.createdAt.toISOString(),
    mutualFriendsCount,
  };
}

export function toPresenceResponse(
  presence: UserPresence,
  options: { maskInvisible?: boolean } = {},
): PresenceResponse {
  const status: PresenceStatusValue =
    options.maskInvisible === true && presence.status === 'invisible' ? 'offline' : presence.status;
  return {
    userId: presence.userId,
    status,
    lastSeenAt: presence.lastSeenAt.toISOString(),
  };
}

export function toOfflinePresenceResponse(userId: string): PresenceResponse {
  return {
    userId,
    status: 'offline',
    lastSeenAt: new Date(0).toISOString(),
  };
}

export function toOnlineFriendResponse(
  user: User,
  presence: PresenceResponse,
): OnlineFriendResponse {
  return {
    user: toUserPublicResponse(user),
    presence,
  };
}

export function friendIdOf(friendship: Friendship, viewerId: string): string {
  return friendship.userLowId === viewerId ? friendship.userHighId : friendship.userLowId;
}
