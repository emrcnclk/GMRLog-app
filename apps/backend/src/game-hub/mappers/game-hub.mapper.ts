import type {
  Collection,
  Community,
  Event,
  LibraryStatus,
  Post,
  Review,
  TierList,
  User,
} from '@gmrlog/database';
import type {
  FeedItemResponse,
  GameHubCollectionSummaryResponse,
  GameHubCommunitySummaryResponse,
  GameHubPlayerResponse,
  GameHubTierListSummaryResponse,
  UserPublicResponse,
} from '@gmrlog/types';

import { resolveMediaUrl } from '../../infrastructure/media/resolve-media-url';

export function toUserPublicResponse(user: User): UserPublicResponse {
  return {
    id: user.id,
    handle: user.handle,
    displayName: user.displayName,
    avatarUrl: resolveMediaUrl(user.avatarKey),
  };
}

/** D3.24 Game Hub Timeline — post row (GAME_HUB.md § hybrid feed). */
export function toGameHubPostFeedItem(post: Post, author: User): FeedItemResponse {
  return {
    id: post.id,
    kind: 'post',
    occurredAt: post.createdAt.toISOString(),
    actor: toUserPublicResponse(author),
    object: { type: 'post', id: post.id },
    projection: null,
    feedItemKind: 'post_item',
    contentClass: 'user_generated',
  };
}

/** D3.24 Game Hub Timeline — review row. */
export function toGameHubReviewFeedItem(review: Review, author: User): FeedItemResponse {
  return {
    id: review.id,
    kind: 'review',
    occurredAt: review.createdAt.toISOString(),
    actor: toUserPublicResponse(author),
    object: { type: 'review', id: review.id },
    projection: null,
    feedItemKind: 'post_item',
    contentClass: 'user_generated',
  };
}

/** D3.24 Game Hub Timeline — event row. `actor` is the hosting participant, when known. */
export function toGameHubEventFeedItem(event: Event, host: User | null): FeedItemResponse {
  return {
    id: event.id,
    kind: 'event',
    occurredAt: event.createdAt.toISOString(),
    actor: host !== null ? toUserPublicResponse(host) : null,
    object: { type: 'event', id: event.id },
    projection: null,
    feedItemKind: 'activity_item',
    contentClass: 'game_activity',
  };
}

/** D3.24 Game Hub — Collections tab card. */
export function toGameHubCollectionSummary(
  collection: Collection,
  owner: User,
): GameHubCollectionSummaryResponse {
  return {
    id: collection.id,
    title: collection.title,
    owner: toUserPublicResponse(owner),
    coverUrl: resolveMediaUrl(collection.coverKey),
    updatedAt: collection.updatedAt.toISOString(),
  };
}

/** D3.24 Game Hub — Tier Lists tab card. */
export function toGameHubTierListSummary(
  tierList: TierList,
  owner: User,
): GameHubTierListSummaryResponse {
  return {
    id: tierList.id,
    title: tierList.title,
    owner: toUserPublicResponse(owner),
    updatedAt: tierList.updatedAt.toISOString(),
  };
}

/** D3.24 Game Hub — Communities tab card (name/tag heuristic union). */
export function toGameHubCommunitySummary(
  community: Community,
  memberCount: number,
): GameHubCommunitySummaryResponse {
  return {
    id: community.id,
    name: community.name,
    avatarUrl: resolveMediaUrl(community.avatarKey),
    memberCount,
  };
}

/** D3.24 Game Hub — Players tab row (privacy-aware; caller excludes block pairs). */
export function toGameHubPlayerResponse(user: User, status: LibraryStatus): GameHubPlayerResponse {
  return {
    user: toUserPublicResponse(user),
    status,
  };
}
