import type { GameHubPlayerResponse, OnlineFriendResponse } from '@gmrlog/types';

/**
 * §5's Community tab presentation model. Pure functions only, same discipline
 * as `game-detail-model.ts`.
 */

/**
 * "Friends playing" (§5's Community tab, "pulsing accent presence dots") has
 * no dedicated endpoint — there is no friends-scoped variant of
 * `GET /games/{id}/players`, and a library-status row carries no live
 * presence to put a dot next to. Built as a real client-side intersection of
 * two real reads instead of inventing either: the viewer's online friends
 * (which already carry real presence) against this game's players, matched
 * by user id. Reuses `PresenceRail` (§11, already shipped) unmodified — its
 * input shape is exactly this intersection's output shape.
 */
export function selectOnlineFriendsPlaying(
  onlineFriends: readonly OnlineFriendResponse[],
  players: readonly GameHubPlayerResponse[],
): OnlineFriendResponse[] {
  if (onlineFriends.length === 0 || players.length === 0) {
    return [];
  }
  const playerIds = new Set(players.map((player) => player.user.id));
  return onlineFriends.filter((friend) => playerIds.has(friend.user.id));
}
