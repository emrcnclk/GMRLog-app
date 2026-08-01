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

/** Canonical empty board rows when the server returns no slots. */
export const DEFAULT_TIER_LABELS = ['S', 'A', 'B', 'C', 'D', 'F'] as const;

export type DefaultTierLabel = (typeof DEFAULT_TIER_LABELS)[number];

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
