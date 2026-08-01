import type {
  ActivityItemResponse,
  ActivityKindValue,
  FeedItemResponse,
  NotificationObjectRef,
  UserPublicResponse,
} from '@gmrlog/types';

/**
 * D3.27 Phase 7 — one presentation model for every social timeline card, shared
 * by Home, Profile and the Game Hub activity tab so a "finished a game" row
 * looks and behaves identically wherever it surfaces.
 *
 * Pure functions only; covered by `timeline-model.spec.ts`.
 */

/**
 * Visual family for a card. Several `ActivityKind` members collapse to the same
 * family because they read the same to a player (all three Steam sync kinds are
 * "your library updated").
 */
export type TimelineCardTone =
  | 'review'
  | 'rating'
  | 'finished'
  | 'achievement'
  | 'collection'
  | 'follow'
  | 'comment'
  | 'like'
  | 'post'
  | 'system';

export interface TimelineCardModel {
  id: string;
  tone: TimelineCardTone;
  actor: UserPublicResponse | null;
  /** Verb phrase completing "<Actor> …". */
  message: string;
  objectRef: NotificationObjectRef;
  occurredAt: string;
  /** Relative time, pre-formatted. */
  timeLabel: string;
  /** Full announcement for assistive tech. */
  accessibilityLabel: string;
}

const KIND_TONE: Record<ActivityKindValue, TimelineCardTone> = {
  review: 'review',
  post: 'post',
  collection: 'collection',
  game_log: 'finished',
  tier_list: 'collection',
  friend: 'follow',
  recommendation_slot: 'system',
  community: 'system',
  event: 'system',
  achievement: 'achievement',
  library_import: 'system',
  like: 'like',
  comment: 'comment',
  wishlist: 'collection',
  profile_pin: 'system',
  milestone: 'achievement',
  library_synced: 'system',
  achievement_synced: 'achievement',
  playtime_updated: 'finished',
  integration_connected: 'system',
  integration_disconnected: 'system',
};

const KIND_MESSAGE: Record<ActivityKindValue, string> = {
  review: 'published a review',
  post: 'shared a post',
  collection: 'updated a collection',
  game_log: 'logged play',
  tier_list: 'updated a tier list',
  friend: 'made a new connection',
  recommendation_slot: 'saved a recommendation',
  community: 'posted in a community',
  event: 'joined an event',
  achievement: 'unlocked an achievement',
  library_import: 'imported library items',
  like: 'liked something',
  comment: 'left a comment',
  wishlist: 'added a game to their wishlist',
  profile_pin: 'updated their profile pins',
  milestone: 'reached a milestone',
  library_synced: 'synced their library',
  achievement_synced: 'synced achievements',
  playtime_updated: 'updated playtime',
  integration_connected: 'connected a platform',
  integration_disconnected: 'disconnected a platform',
};

export function timelineToneForKind(kind: ActivityKindValue): TimelineCardTone {
  return KIND_TONE[kind];
}

export function timelineMessageForKind(kind: ActivityKindValue): string {
  return KIND_MESSAGE[kind];
}

/**
 * Relative timestamp. Anything older than a week falls back to an absolute date,
 * because "63d" stops carrying meaning.
 */
export function formatTimelineTime(iso: string, nowMs: number = Date.now()): string {
  const created = Date.parse(iso);
  if (Number.isNaN(created)) {
    return '';
  }
  const deltaSec = Math.max(0, Math.floor((nowMs - created) / 1000));
  if (deltaSec < 60) {
    return 'Just now';
  }
  const minutes = Math.floor(deltaSec / 60);
  if (minutes < 60) {
    return `${String(minutes)}m`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${String(hours)}h`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${String(days)}d`;
  }
  return new Date(created).toLocaleDateString();
}

function buildModel(
  id: string,
  kind: ActivityKindValue,
  actor: UserPublicResponse | null,
  objectRef: NotificationObjectRef,
  occurredAt: string,
  nowMs: number,
): TimelineCardModel {
  const message = KIND_MESSAGE[kind];
  const timeLabel = formatTimelineTime(occurredAt, nowMs);
  const actorName = actor?.displayName ?? 'Someone';

  return {
    id,
    tone: KIND_TONE[kind],
    actor,
    message,
    objectRef,
    occurredAt,
    timeLabel,
    accessibilityLabel: `${actorName} ${message}${timeLabel === '' ? '' : `, ${timeLabel}`}`,
  };
}

export function activityToTimelineCard(
  item: ActivityItemResponse,
  nowMs: number = Date.now(),
): TimelineCardModel {
  return buildModel(item.id, item.kind, item.actor, item.objectRef, item.createdAt, nowMs);
}

export function feedItemToTimelineCard(
  item: FeedItemResponse,
  nowMs: number = Date.now(),
): TimelineCardModel {
  return buildModel(item.id, item.kind, item.actor, item.object, item.occurredAt, nowMs);
}

/**
 * In-app route for a card's subject. Returns `null` for object types with no
 * dedicated screen, which the card uses to decide whether it is pressable at all
 * — a card that navigates nowhere should not look tappable.
 */
export function timelineObjectRoute(ref: NotificationObjectRef): string | null {
  switch (ref.type) {
    case 'review':
      return `/(app)/review/${ref.id}`;
    case 'post':
      return `/(app)/post/${ref.id}`;
    case 'collection':
      return `/(app)/collection/${ref.id}`;
    case 'tier_list':
      return `/(app)/tier-list/${ref.id}`;
    case 'game':
      return `/(app)/game/${ref.id}`;
    case 'user':
      return `/(app)/user/${ref.id}`;
    case 'community':
      return `/(app)/community/${ref.id}`;
    case 'event':
      return `/(app)/event/${ref.id}`;
    default:
      return null;
  }
}
