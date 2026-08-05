import type {
  FriendRequestResponse,
  FriendshipResponse,
  OnlineFriendResponse,
} from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import {
  filterIncomingRequests,
  formatFriendsSince,
  resolveFriendsScreenView,
  sortOnlineFriends,
} from './friends-model';

function onlineFriend(partial: Partial<OnlineFriendResponse> = {}): OnlineFriendResponse {
  return {
    user: { id: 'u2', handle: 'friend', displayName: 'Friend', avatarUrl: null },
    presence: { userId: 'u2', status: 'online', lastSeenAt: '2026-07-29T00:00:00.000Z' },
    ...partial,
  };
}

function friendship(partial: Partial<FriendshipResponse> = {}): FriendshipResponse {
  return {
    user: {
      id: 'u2',
      handle: 'friend',
      displayName: 'Friend',
      avatarUrl: null,
    },
    friendsSince: '2026-01-01T00:00:00.000Z',
    mutualFriendsCount: 0,
    ...partial,
  };
}

function request(partial: Partial<FriendRequestResponse> = {}): FriendRequestResponse {
  return {
    id: 'fr1',
    status: 'pending',
    message: null,
    sender: {
      id: 'u3',
      handle: 'sender',
      displayName: 'Sender',
      avatarUrl: null,
    },
    receiver: {
      id: 'u1',
      handle: 'me',
      displayName: 'Me',
      avatarUrl: null,
    },
    createdAt: '2026-07-28T12:00:00.000Z',
    respondedAt: null,
    ...partial,
  };
}

describe('friends model', () => {
  it('resolves loading empty ready error', () => {
    expect(
      resolveFriendsScreenView({
        friendsPending: true,
        friendsError: false,
        friendsErrorValue: null,
        friends: [],
        requestsPending: true,
        requestsError: false,
        requestsErrorValue: null,
        requests: [],
        isRefreshing: false,
      }).status,
    ).toBe('loading');

    expect(
      resolveFriendsScreenView({
        friendsPending: false,
        friendsError: true,
        friendsErrorValue: new Error('x'),
        friends: [],
        requestsPending: false,
        requestsError: true,
        requestsErrorValue: new Error('y'),
        requests: [],
        isRefreshing: false,
      }).status,
    ).toBe('error');

    expect(
      resolveFriendsScreenView({
        friendsPending: false,
        friendsError: false,
        friendsErrorValue: null,
        friends: [],
        requestsPending: false,
        requestsError: false,
        requestsErrorValue: null,
        requests: [],
        isRefreshing: true,
      }).status,
    ).toBe('empty');

    const ready = resolveFriendsScreenView({
      friendsPending: false,
      friendsError: false,
      friendsErrorValue: null,
      friends: [friendship()],
      requestsPending: false,
      requestsError: false,
      requestsErrorValue: null,
      requests: [request()],
      isRefreshing: false,
    });
    expect(ready.status).toBe('ready');
    expect(ready.friends).toHaveLength(1);
    expect(ready.requests).toHaveLength(1);
  });

  it('filters incoming pending requests only', () => {
    expect(
      filterIncomingRequests([
        request({ id: 'a', status: 'pending' }),
        request({ id: 'b', status: 'accepted' }),
        request({ id: 'c', status: 'rejected' }),
      ]).map((item) => item.id),
    ).toEqual(['a']);
  });

  it('formats friends-since labels', () => {
    const now = Date.parse('2026-07-29T00:00:00.000Z');
    expect(formatFriendsSince('2026-07-29T00:00:00.000Z', now)).toBe('Friends today');
    expect(formatFriendsSince('2026-07-19T00:00:00.000Z', now)).toBe('Friends 10d');
  });

  it('sorts online friends before away, stable within each', () => {
    const users = [
      onlineFriend({
        user: { id: 'a', handle: 'a', displayName: 'A', avatarUrl: null },
        presence: { userId: 'a', status: 'away', lastSeenAt: '2026-07-29T00:00:00.000Z' },
      }),
      onlineFriend({ user: { id: 'b', handle: 'b', displayName: 'B', avatarUrl: null } }),
      onlineFriend({ user: { id: 'c', handle: 'c', displayName: 'C', avatarUrl: null } }),
    ];
    expect(sortOnlineFriends(users).map((f) => f.user.id)).toEqual(['b', 'c', 'a']);
  });

  it('stays ready when only requests exist', () => {
    const view = resolveFriendsScreenView({
      friendsPending: false,
      friendsError: false,
      friendsErrorValue: null,
      friends: [],
      requestsPending: false,
      requestsError: false,
      requestsErrorValue: null,
      requests: [request()],
      isRefreshing: false,
    });
    expect(view.status).toBe('ready');
    expect(view.friends).toHaveLength(0);
    expect(view.requests).toHaveLength(1);
  });
});
