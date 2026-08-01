import type { ActivityFeedRow, HomeFeedRow } from '@gmrlog/database';
import type { ActivityItemResponse, FeedItemResponse } from '@gmrlog/types';

import { toUserPublicResponse } from '../../posts/mappers/post.mapper';

/**
 * Persistence → S1 §15.9 ActivityItemResponse.
 * S2 ActivityItem has no `readAt` — projected as `null`.
 * `messageKey` mirrors `kind` as the localization key until ActivityKind is amended.
 */
export function toActivityItemResponse(row: ActivityFeedRow): ActivityItemResponse {
  const { activityItem, actor } = row;
  return {
    id: activityItem.id,
    kind: activityItem.kind,
    createdAt: activityItem.occurredAt.toISOString(),
    readAt: null,
    actor: actor !== null ? toUserPublicResponse(actor) : null,
    objectRef: {
      type: activityItem.objectType,
      id: activityItem.objectId,
    },
    messageKey: activityItem.kind,
  };
}

/** Persistence → S1 §15.5 FeedItemResponse (+ D3.24 taxonomy). */
export function toFeedItemResponse(
  row: HomeFeedRow,
  extras?: {
    score?: number;
    feedItemKind?: FeedItemResponse['feedItemKind'];
    contentClass?: FeedItemResponse['contentClass'];
  },
): FeedItemResponse {
  const { activityItem, actor, feedEntryId } = row;
  const kind = activityItem.kind;
  const contentClass =
    extras?.contentClass ??
    (kind === 'post' || kind === 'review' || kind === 'collection' || kind === 'tier_list'
      ? 'user_generated'
      : 'game_activity');
  return {
    id: feedEntryId,
    kind,
    occurredAt: activityItem.occurredAt.toISOString(),
    actor: actor !== null ? toUserPublicResponse(actor) : null,
    object: {
      type: activityItem.objectType,
      id: activityItem.objectId,
    },
    projection: null,
    feedItemKind:
      extras?.feedItemKind ?? (contentClass === 'user_generated' ? 'post_item' : 'activity_item'),
    contentClass,
    ...(extras?.score !== undefined ? { score: extras.score } : {}),
  };
}
