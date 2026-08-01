import type {
  ApiEnvelope,
  NotificationObjectRef,
  NotificationResponse,
  ObjectTypeValue,
} from '@gmrlog/types';
import type { InfiniteData } from '@tanstack/react-query';

export type NotificationsListStatus = 'loading' | 'error' | 'empty' | 'ready';

export interface NotificationsListViewModel {
  status: NotificationsListStatus;
  items: NotificationResponse[];
  error: unknown;
  isRefreshing: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  unreadCount: number;
}

export type NotificationsInfiniteData = InfiniteData<ApiEnvelope<NotificationResponse[]>>;

export function resolveNotificationsView(input: {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  items: NotificationResponse[];
  isRefreshing: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
}): NotificationsListViewModel {
  const unreadCount = input.items.filter((item) => item.readAt === null).length;

  if (input.isPending && input.items.length === 0) {
    return {
      status: 'loading',
      items: [],
      error: null,
      isRefreshing: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      unreadCount: 0,
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
      unreadCount: 0,
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
      unreadCount: 0,
    };
  }

  return {
    status: 'ready',
    items: input.items,
    error: input.error,
    isRefreshing: input.isRefreshing,
    isFetchingNextPage: input.isFetchingNextPage,
    hasNextPage: input.hasNextPage,
    unreadCount,
  };
}

export function isNotificationUnread(notification: NotificationResponse): boolean {
  return notification.readAt === null;
}

const NOTIFICATION_MESSAGE_BY_KEY: Record<string, string> = {
  friend_request: 'sent you a friend request',
  friend_accepted: 'accepted your friend request',
  achievement_unlocked: 'unlocked an achievement',
  comment: 'commented on your content',
  reply: 'replied to your comment',
  like: 'liked your content',
  collection_follow: 'followed your collection',
  community_activity: 'shared community activity',
  tier_list_interaction: 'interacted with your tier list',
  review_interaction: 'interacted with your review',
  library_imported: 'imported games into your library',
  sync_completed: 'finished a library sync',
  sync_failed: 'could not complete a library sync',
  achievement_synced: 'synced achievements from a platform',
  new_games_found: 'found new games in a connected library',
  library_updated: 'updated your library from a sync',
};

/** Humanize opaque messageKey / kind until NotificationKind is amended. */
export function resolveNotificationMessage(notification: NotificationResponse): string {
  const key =
    notification.messageKey.trim().length > 0 ? notification.messageKey : notification.kind;
  const mapped = NOTIFICATION_MESSAGE_BY_KEY[key];
  if (mapped) {
    return mapped;
  }
  return key.replace(/_/g, ' ');
}

/** Prefer kind-aware icon when object type alone is too generic (e.g. user). */
export function resolveNotificationIconType(notification: NotificationResponse): ObjectTypeValue {
  const key =
    notification.messageKey.trim().length > 0 ? notification.messageKey : notification.kind;
  switch (key) {
    case 'friend_request':
    case 'friend_accepted':
      return 'user';
    case 'achievement_unlocked':
    case 'achievement_synced':
      return 'achievement';
    case 'comment':
    case 'reply':
      return 'comment';
    case 'like':
      return notification.objectRef.type;
    case 'library_imported':
    case 'sync_completed':
    case 'sync_failed':
    case 'new_games_found':
    case 'library_updated':
      return 'game';
    default:
      return notification.objectRef.type;
  }
}

export function formatNotificationTime(iso: string, nowMs = Date.now()): string {
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

export function initialsFromDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return (parts[0] ?? '?').slice(0, 2).toUpperCase();
  }
  return `${(parts[0] ?? '').slice(0, 1)}${(parts[1] ?? '').slice(0, 1)}`.toUpperCase();
}

/**
 * Deep-link to related object surfaces (placeholders allowed).
 * comment / achievement have no dedicated routes — return null (no invented screens).
 */
export function hrefForNotificationObject(
  objectRef: NotificationObjectRef,
): `/(app)/${string}` | null {
  const { type, id } = objectRef;
  switch (type) {
    case 'game':
      return `/(app)/game/${id}`;
    case 'review':
      return `/(app)/review/${id}`;
    case 'post':
      return `/(app)/post/${id}`;
    case 'collection':
      return `/(app)/collection/${id}`;
    case 'tier_list':
      return `/(app)/tier-list/${id}`;
    case 'community':
      return `/(app)/community/${id}`;
    case 'event':
      return `/(app)/event/${id}`;
    case 'user':
      return `/(app)/user/${id}`;
    case 'comment':
    case 'achievement':
      return null;
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function objectTypeIconName(type: ObjectTypeValue): string {
  switch (type) {
    case 'game':
      return 'gamepad-2';
    case 'review':
      return 'star';
    case 'post':
      return 'message-square';
    case 'comment':
      return 'message-circle';
    case 'collection':
      return 'folder';
    case 'tier_list':
      return 'list-ordered';
    case 'user':
      return 'user';
    case 'community':
      return 'users';
    case 'event':
      return 'calendar';
    case 'achievement':
      return 'trophy';
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function markNotificationReadInCache(
  data: NotificationsInfiniteData | undefined,
  id: string,
  readAt: string,
): NotificationsInfiniteData | undefined {
  if (!data) {
    return data;
  }
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      data: page.data.map((item) =>
        item.id === id && item.readAt === null ? { ...item, readAt } : item,
      ),
    })),
  };
}

export function markAllNotificationsReadInCache(
  data: NotificationsInfiniteData | undefined,
  readAt: string,
): NotificationsInfiniteData | undefined {
  if (!data) {
    return data;
  }
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      data: page.data.map((item) => (item.readAt === null ? { ...item, readAt } : item)),
    })),
  };
}
