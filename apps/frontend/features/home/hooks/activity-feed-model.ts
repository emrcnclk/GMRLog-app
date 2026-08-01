import type { ActivityItemResponse, ActivityKindValue } from '@gmrlog/types';

export type HomeFeedStatus = 'loading' | 'error' | 'empty' | 'feed';

export interface HomeFeedViewModel {
  status: HomeFeedStatus;
  items: ActivityItemResponse[];
  error: unknown;
  isRefreshing: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
}

/**
 * Pure view-model reducer for Home feed state order:
 * Loading → Empty → Feed (error when no cached pages).
 */
export function resolveHomeFeedView(input: {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  items: ActivityItemResponse[];
  isRefreshing: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
}): HomeFeedViewModel {
  if (input.isPending && input.items.length === 0) {
    return {
      status: 'loading',
      items: [],
      error: null,
      isRefreshing: false,
      isFetchingNextPage: false,
      hasNextPage: false,
    };
  }

  if (input.isError && input.items.length === 0) {
    return {
      status: 'error',
      items: [],
      error: input.error,
      isRefreshing: input.isRefreshing,
      isFetchingNextPage: false,
      hasNextPage: false,
    };
  }

  if (input.items.length === 0) {
    return {
      status: 'empty',
      items: [],
      error: null,
      isRefreshing: input.isRefreshing,
      isFetchingNextPage: false,
      hasNextPage: false,
    };
  }

  return {
    status: 'feed',
    items: input.items,
    error: input.error,
    isRefreshing: input.isRefreshing,
    isFetchingNextPage: input.isFetchingNextPage,
    hasNextPage: input.hasNextPage,
  };
}

/** Localization-ready copy keyed by ActivityKind / messageKey. */
export const ACTIVITY_KIND_MESSAGE: Record<ActivityKindValue, string> = {
  review: 'published a review',
  post: 'shared a post',
  collection: 'updated a collection',
  game_log: 'logged play',
  tier_list: 'updated a tier list',
  friend: 'connected with a friend',
  recommendation_slot: 'saved a recommendation',
  community: 'community activity',
  event: 'event activity',
  achievement: 'earned an achievement',
  library_import: 'imported library items',
  like: 'liked something',
  comment: 'left a comment',
  wishlist: 'added to wishlist',
  profile_pin: 'updated profile pins',
  milestone: 'reached a milestone',
  library_synced: 'synced their library',
  achievement_synced: 'synced achievements',
  playtime_updated: 'updated playtime',
  integration_connected: 'connected a platform',
  integration_disconnected: 'disconnected a platform',
};

export function resolveActivityMessage(item: ActivityItemResponse): string {
  const fromKind = ACTIVITY_KIND_MESSAGE[item.kind];
  if (fromKind) {
    return fromKind;
  }
  return item.messageKey.replace(/_/g, ' ');
}

export function formatActivityTime(iso: string, nowMs = Date.now()): string {
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

/** Target icon name (Lucide) for every ActivityKind. */
export function activityKindIconName(kind: ActivityKindValue): string {
  switch (kind) {
    case 'review':
      return 'star';
    case 'post':
      return 'message-square';
    case 'collection':
      return 'folder';
    case 'game_log':
      return 'gamepad-2';
    case 'tier_list':
      return 'list-ordered';
    case 'friend':
      return 'user-plus';
    case 'recommendation_slot':
      return 'bookmark';
    case 'community':
      return 'users';
    case 'event':
      return 'calendar';
    case 'achievement':
      return 'trophy';
    case 'library_import':
      return 'download';
    case 'like':
      return 'heart';
    case 'comment':
      return 'message-circle';
    case 'wishlist':
      return 'bookmark';
    case 'profile_pin':
      return 'pin';
    case 'milestone':
      return 'flag';
    case 'library_synced':
      return 'refresh-cw';
    case 'achievement_synced':
      return 'trophy';
    case 'playtime_updated':
      return 'clock';
    case 'integration_connected':
      return 'link';
    case 'integration_disconnected':
      return 'unlink';
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}
