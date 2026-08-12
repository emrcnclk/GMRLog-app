import type {
  TierListResponse,
  TierSlotGameResponse,
  TierSlotResponse,
  ContentVisibilityValue,
} from '@gmrlog/types';
import {
  contentVisibilitySchema,
  tierListCreateSchema,
  tierListPatchSchema,
  tierListSlotsPutSchema,
} from '@gmrlog/validators';
import { z } from 'zod';

import { formatUpdatedAt, resolveListView } from '../../boards/shared/board-model';

export { formatUpdatedAt, resolveListView };

/**
 * Canonical empty board rows when the server returns no slots.
 * `SCREEN_REDESIGNS_2.md` §20 draws five lettered plates (S–D) plus a
 * separate "Unranked" tray for games not yet sorted — there is no `F` row.
 * The label is a free string server-side (`TierSlotResponse.label`), so
 * "Unranked" is a real, storable slot, not a client-only concept.
 */
export const DEFAULT_TIER_LABELS = ['S', 'A', 'B', 'C', 'D', 'Unranked'] as const;

export type DefaultTierLabel = (typeof DEFAULT_TIER_LABELS)[number];

/** The lettered plates §20 draws with the rank-brightening treatment. */
export const RANKED_TIER_LABELS = ['S', 'A', 'B', 'C', 'D'] as const;

/** The horizontally-scrolling tray at the bottom of §20 — everything not yet ranked. */
export const TRAY_LABEL = 'Unranked';

export function visibilityLabel(visibility: ContentVisibilityValue): string {
  switch (visibility) {
    case 'public':
      return 'Public';
    case 'followers':
      return 'Followers';
    case 'private':
      return 'Private';
    case 'community':
      return 'Community';
    default: {
      const _exhaustive: never = visibility;
      return _exhaustive;
    }
  }
}

export function isTierListOwner(tierList: TierListResponse, userId: string | undefined): boolean {
  return userId !== undefined && tierList.owner.id === userId;
}

export function countTierListGames(tierList: TierListResponse): number {
  return tierList.slots.reduce((sum, slot) => sum + slot.games.length, 0);
}

export interface EditableTierGame {
  gameId: string;
  title: string;
}

export interface EditableTierSlot {
  label: string;
  games: EditableTierGame[];
}

function sortGames(games: TierSlotGameResponse[]): EditableTierGame[] {
  return [...games]
    .sort((a, b) => a.position - b.position)
    .map((game) => ({
      gameId: game.gameId,
      title: game.game?.title ?? game.gameId,
    }));
}

/** Preserve backend slot order; seed S–F when empty. */
export function toEditableBoard(slots: TierSlotResponse[]): EditableTierSlot[] {
  if (slots.length === 0) {
    return DEFAULT_TIER_LABELS.map((label) => ({ label, games: [] }));
  }
  return [...slots]
    .sort((a, b) => a.position - b.position)
    .map((slot) => ({
      label: slot.label,
      games: sortGames(slot.games),
    }));
}

export function collectBoardGameIds(board: EditableTierSlot[]): Set<string> {
  const ids = new Set<string>();
  for (const slot of board) {
    for (const game of slot.games) {
      ids.add(game.gameId);
    }
  }
  return ids;
}

export function boardToSlotsPutPayload(board: EditableTierSlot[]) {
  return tierListSlotsPutSchema.parse({
    slots: board.map((slot) => ({
      label: slot.label,
      gameIds: slot.games.map((game) => game.gameId),
    })),
  });
}

export function addGameToBoard(
  board: EditableTierSlot[],
  label: string,
  game: EditableTierGame,
): EditableTierSlot[] | 'duplicate' {
  if (collectBoardGameIds(board).has(game.gameId)) {
    return 'duplicate';
  }
  return board.map((slot) =>
    slot.label === label ? { ...slot, games: [...slot.games, game] } : slot,
  );
}

export function removeGameFromBoard(board: EditableTierSlot[], gameId: string): EditableTierSlot[] {
  return board.map((slot) => ({
    ...slot,
    games: slot.games.filter((game) => game.gameId !== gameId),
  }));
}

/**
 * Drag/drop core — move a game to a target tier index (whole-board local state).
 * Does not invent incremental APIs; used before PUT /slots.
 */
export function moveGameOnBoard(
  board: EditableTierSlot[],
  gameId: string,
  toLabel: string,
  toIndex: number,
): EditableTierSlot[] {
  let found: EditableTierGame | undefined;
  const stripped = board.map((slot) => {
    const remaining: EditableTierGame[] = [];
    for (const game of slot.games) {
      if (game.gameId === gameId) {
        found = game;
      } else {
        remaining.push(game);
      }
    }
    return { ...slot, games: remaining };
  });
  if (found === undefined) {
    return board;
  }
  const moving = found;
  return stripped.map((slot) => {
    if (slot.label !== toLabel) {
      return slot;
    }
    const games = [...slot.games];
    const clamped = Math.max(0, Math.min(toIndex, games.length));
    games.splice(clamped, 0, moving);
    return { ...slot, games };
  });
}

export function reorderGameInTier(
  board: EditableTierSlot[],
  label: string,
  fromIndex: number,
  toIndex: number,
): EditableTierSlot[] {
  return board.map((slot) => {
    if (slot.label !== label) {
      return slot;
    }
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= slot.games.length ||
      toIndex >= slot.games.length ||
      fromIndex === toIndex
    ) {
      return slot;
    }
    const games = [...slot.games];
    const [item] = games.splice(fromIndex, 1);
    if (!item) {
      return slot;
    }
    games.splice(toIndex, 0, item);
    return { ...slot, games };
  });
}

export const tierComposerCreateSchema = tierListCreateSchema;
export type TierComposerCreateValues = z.infer<typeof tierComposerCreateSchema>;

export const tierComposerEditSchema = z
  .object({
    title: z.string().trim().min(1).max(100),
    visibility: contentVisibilitySchema,
  })
  .strict();

export type TierComposerEditValues = z.infer<typeof tierComposerEditSchema>;

export function toTierListPatchPayload(values: TierComposerEditValues) {
  return tierListPatchSchema.parse({
    title: values.title,
    visibility: values.visibility,
  });
}

/**
 * §20's byline is "author · likes · forks", but `TierListResponse` carries
 * only `owner` — there is no like/fork count anywhere on the DTO or the
 * backend (`TierListsController` has no such routes). Showing the author and
 * leaving the rest off is the honest subset; see this task's closing note.
 */
export function tierListByline(tierList: TierListResponse): string {
  return `@${tierList.owner.handle}`;
}

export function tierListShareUrl(tierListId: string): string {
  return `https://gmrlog.app/tier-list/${tierListId}`;
}

export function tierListShareMessage(tierList: TierListResponse): string {
  return `${tierList.owner.displayName}'s "${tierList.title}" tier list on GMRLOG — ${tierListShareUrl(tierList.id)}`;
}

const FORK_TITLE_MAX = 100;

/** Fork's new title, kept inside the same 100-char cap `tierListCreateSchema` enforces. */
export function forkTierListTitle(originalTitle: string): string {
  const suffix = ' (fork)';
  const budget = FORK_TITLE_MAX - suffix.length;
  const base = originalTitle.length > budget ? originalTitle.slice(0, budget) : originalTitle;
  return `${base}${suffix}`;
}

/**
 * §20: "the plate's border and text brighten as the tier rises; no coloured
 * tier bands." With no rank colour ramp in the token set, brightness is
 * carried the same way §23's cohort retention grid carries it — opacity on an
 * existing token, never a new colour — S at full strength down to D dimmest.
 */
export function rankOpacity(index: number, total: number): number {
  if (total <= 1) {
    return 1;
  }
  const MIN_OPACITY = 0.4;
  const step = (1 - MIN_OPACITY) / (total - 1);
  return 1 - index * step;
}
