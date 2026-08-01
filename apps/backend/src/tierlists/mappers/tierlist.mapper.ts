import type { Game, TierList, TierSlotBoardRow, User } from '@gmrlog/database';
import type {
  LibraryGameSummary,
  TierListResponse,
  TierSlotGameResponse,
  TierSlotResponse,
  UserPublicResponse,
} from '@gmrlog/types';

import { resolveMediaUrl } from '../../infrastructure/media/resolve-media-url';

export const resolveAvatarUrl = resolveMediaUrl;
export const resolveCoverUrl = resolveMediaUrl;

export function toUserPublicResponse(user: User): UserPublicResponse {
  return {
    id: user.id,
    handle: user.handle,
    displayName: user.displayName,
    avatarUrl: resolveAvatarUrl(user.avatarKey),
  };
}

export function toTierGameSummary(game: Game): LibraryGameSummary {
  return {
    id: game.id,
    title: game.title,
    slug: game.slug,
    coverUrl: resolveCoverUrl(game.coverKey),
  };
}

export function toTierSlotGameResponse(
  gameId: string,
  position: number,
  game?: Game,
): TierSlotGameResponse {
  return {
    gameId,
    position,
    ...(game !== undefined ? { game: toTierGameSummary(game) } : {}),
  };
}

export function toTierSlotResponse(
  row: TierSlotBoardRow,
  gamesById: Map<string, Game>,
): TierSlotResponse {
  return {
    label: row.slot.label,
    position: row.slot.position,
    games: row.games.map((g) =>
      toTierSlotGameResponse(g.gameId, g.position, gamesById.get(g.gameId)),
    ),
  };
}

export function toTierListResponse(
  tierList: TierList,
  owner: User,
  board: TierSlotBoardRow[],
  gamesById: Map<string, Game>,
): TierListResponse {
  return {
    id: tierList.id,
    title: tierList.title,
    owner: toUserPublicResponse(owner),
    visibility: tierList.visibility,
    slots: board.map((row) => toTierSlotResponse(row, gamesById)),
    updatedAt: tierList.updatedAt.toISOString(),
  };
}

/**
 * S1 §9.3 / §15.8 — visibility gate.
 * `followers` requires an authenticated viewer who follows the owner
 * (`viewerFollowsOwner` from FollowRepository.exists). Guests never pass.
 */
export function canViewerReadTierList(
  visibility: TierList['visibility'],
  ownerId: string,
  viewerId: string | null,
  viewerFollowsOwner = false,
): boolean {
  if (visibility === 'public') {
    return true;
  }
  if (viewerId === null) {
    return false;
  }
  if (viewerId === ownerId) {
    return true;
  }
  return visibility === 'followers' && viewerFollowsOwner;
}
