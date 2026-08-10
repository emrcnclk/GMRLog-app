import type {
  Community,
  CommunityMember,
  CommunityMemberBadge,
  CommunityPin,
  CommunityWikiPage,
  CommunityActivityFeedRow,
  User,
} from '@gmrlog/database';
import type {
  CommunityMemberBadgeResponse,
  CommunityMemberResponse,
  CommunityMembershipSummary,
  CommunityPinResponse,
  CommunityResponse,
  CommunityWikiPageResponse,
  FeedItemResponse,
  UserPublicResponse,
} from '@gmrlog/types';

import { resolveMediaUrl } from '../../infrastructure/media/resolve-media-url';

export { resolveMediaUrl };

export function toUserPublicResponse(user: User): UserPublicResponse {
  return {
    id: user.id,
    handle: user.handle,
    displayName: user.displayName,
    avatarUrl: resolveMediaUrl(user.avatarKey),
  };
}

export function toCommunityMembershipSummary(member: CommunityMember): CommunityMembershipSummary {
  return {
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
  };
}

/** 3b.1e — BACKEND_CHANGES.md §6. `postsToday`/`activeNow`, computed by the caller. */
export interface CommunityActivitySignal {
  postsToday: number;
  activeNow: boolean;
}

export function toCommunityResponse(
  community: Community,
  memberCount: number,
  viewerMembership: CommunityMembershipSummary | null,
  /** 3b.1b — omitted for a guest, and by every caller that does not compute it. */
  viewerFriendCount?: number,
  /** 3b.1e — omitted only by a caller that has not computed it yet. */
  activitySignal?: CommunityActivitySignal,
): CommunityResponse {
  return {
    id: community.id,
    name: community.name,
    description: community.description,
    avatarUrl: resolveMediaUrl(community.avatarKey),
    bannerUrl: resolveMediaUrl(community.bannerKey),
    viewerMembership,
    counts: { members: memberCount },
    kind: community.kind,
    ...(viewerFriendCount === undefined ? {} : { viewerFriendCount }),
    ...(activitySignal ?? {}),
  };
}

export function toCommunityMemberBadgeResponse(
  badge: CommunityMemberBadge,
): CommunityMemberBadgeResponse {
  return {
    memberId: badge.memberId,
    kind: badge.kind,
    createdAt: badge.createdAt.toISOString(),
  };
}

export function toCommunityMemberResponse(
  member: CommunityMember,
  user: User,
  badges: readonly CommunityMemberBadge[] = [],
): CommunityMemberResponse {
  return {
    user: toUserPublicResponse(user),
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
    badges: badges.map(toCommunityMemberBadgeResponse),
  };
}

export function toCommunityWikiPageResponse(
  page: CommunityWikiPage,
  updatedBy: User,
): CommunityWikiPageResponse {
  return {
    id: page.id,
    communityId: page.communityId,
    slug: page.slug,
    title: page.title,
    body: page.body,
    updatedBy: toUserPublicResponse(updatedBy),
    version: page.version,
    updatedAt: page.updatedAt.toISOString(),
  };
}

export function toCommunityPinResponse(pin: CommunityPin): CommunityPinResponse {
  return {
    id: pin.id,
    communityId: pin.communityId,
    objectType: pin.objectType,
    objectId: pin.objectId,
    position: pin.position,
    createdAt: pin.createdAt.toISOString(),
  };
}

/**
 * S1 §9.3 / S1.1 — community visibility gate.
 * Members always read; non-members follow collection-style visibility rules
 * against the community owner (`ownerUserId`).
 */
export function canViewerReadCommunity(
  visibility: Community['visibility'],
  ownerUserId: string,
  viewerId: string | null,
  isMember: boolean,
  viewerFollowsOwner = false,
): boolean {
  if (isMember) {
    return true;
  }
  if (visibility === 'public') {
    return true;
  }
  if (viewerId === null) {
    return false;
  }
  if (viewerId === ownerUserId) {
    return true;
  }
  return visibility === 'followers' && viewerFollowsOwner;
}

/** Persistence → S1 §15.5 FeedItemResponse (community-scoped). */
export function toCommunityFeedItemResponse(row: CommunityActivityFeedRow): FeedItemResponse {
  const { activityItem, actor, communityActivityId } = row;
  return {
    id: communityActivityId,
    kind: activityItem.kind,
    occurredAt: activityItem.occurredAt.toISOString(),
    actor: actor !== null ? toUserPublicResponse(actor) : null,
    object: {
      type: activityItem.objectType,
      id: activityItem.objectId,
    },
    projection: null,
  };
}
