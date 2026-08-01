import type { FriendRequestResponse, FriendshipResponse } from '@gmrlog/types';

export type FriendsListStatus = 'loading' | 'error' | 'empty' | 'ready';

export interface FriendsScreenViewModel {
  status: FriendsListStatus;
  friends: FriendshipResponse[];
  requests: FriendRequestResponse[];
  error: unknown;
  isRefreshing: boolean;
}

export function resolveFriendsScreenView(input: {
  friendsPending: boolean;
  friendsError: boolean;
  friendsErrorValue: unknown;
  friends: FriendshipResponse[];
  requestsPending: boolean;
  requestsError: boolean;
  requestsErrorValue: unknown;
  requests: FriendRequestResponse[];
  isRefreshing: boolean;
}): FriendsScreenViewModel {
  const pending = input.friendsPending || input.requestsPending;
  const hasAny = input.friends.length > 0 || input.requests.length > 0;
  const bothFailed =
    input.friendsError &&
    input.requestsError &&
    input.friends.length === 0 &&
    input.requests.length === 0;

  if (pending && !hasAny) {
    return {
      status: 'loading',
      friends: [],
      requests: [],
      error: null,
      isRefreshing: false,
    };
  }

  if (bothFailed) {
    return {
      status: 'error',
      friends: [],
      requests: [],
      error: input.friendsErrorValue ?? input.requestsErrorValue,
      isRefreshing: input.isRefreshing,
    };
  }

  if (!hasAny) {
    return {
      status: 'empty',
      friends: [],
      requests: [],
      error: null,
      isRefreshing: input.isRefreshing,
    };
  }

  return {
    status: 'ready',
    friends: input.friends,
    requests: input.requests,
    error: input.friendsErrorValue ?? input.requestsErrorValue,
    isRefreshing: input.isRefreshing,
  };
}

/** Incoming pending only — accepted/rejected/cancelled stay off the inbox. */
export function filterIncomingRequests(
  items: readonly FriendRequestResponse[],
): FriendRequestResponse[] {
  return items.filter((item) => item.status === 'pending');
}

export function formatFriendsSince(iso: string, nowMs = Date.now()): string {
  const since = Date.parse(iso);
  if (Number.isNaN(since)) {
    return '';
  }
  const days = Math.max(0, Math.floor((nowMs - since) / (24 * 60 * 60 * 1000)));
  if (days < 1) {
    return 'Friends today';
  }
  if (days < 30) {
    return `Friends ${String(days)}d`;
  }
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `Friends ${String(months)}mo`;
  }
  const years = Math.floor(months / 12);
  return `Friends ${String(years)}y`;
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

export function createIdempotencyKey(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}
