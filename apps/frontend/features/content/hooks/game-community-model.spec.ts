import type { GameHubPlayerResponse, OnlineFriendResponse } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import { selectOnlineFriendsPlaying } from './game-community-model';

function user(id: string) {
  return { id, handle: id, displayName: id, avatarUrl: null };
}

function onlineFriend(id: string): OnlineFriendResponse {
  return { user: user(id), presence: { userId: id, status: 'online', lastSeenAt: '2026-01-01' } };
}

function player(id: string): GameHubPlayerResponse {
  return { user: user(id), status: 'playing' };
}

describe('selectOnlineFriendsPlaying', () => {
  it('keeps only online friends who are also in the player list', () => {
    const result = selectOnlineFriendsPlaying(
      [onlineFriend('a'), onlineFriend('b'), onlineFriend('c')],
      [player('b'), player('c'), player('d')],
    );
    expect(result.map((friend) => friend.user.id)).toEqual(['b', 'c']);
  });

  it('returns an empty list when either side is empty', () => {
    expect(selectOnlineFriendsPlaying([], [player('a')])).toEqual([]);
    expect(selectOnlineFriendsPlaying([onlineFriend('a')], [])).toEqual([]);
  });

  it('returns an empty list when no online friend plays this game', () => {
    expect(selectOnlineFriendsPlaying([onlineFriend('a')], [player('z')])).toEqual([]);
  });
});
