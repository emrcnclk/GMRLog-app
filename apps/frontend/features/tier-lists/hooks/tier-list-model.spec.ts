import type { TierListResponse, TierSlotResponse } from '@gmrlog/types';
import { tierListSlotsPutSchema } from '@gmrlog/validators';
import { describe, expect, it } from 'vitest';

import {
  addGameToBoard,
  boardToSlotsPutPayload,
  collectBoardGameIds,
  DEFAULT_TIER_LABELS,
  moveGameOnBoard,
  removeGameFromBoard,
  reorderGameInTier,
  resolveListView,
  toEditableBoard,
} from './tier-list-model';

describe('tier list model', () => {
  it('seeds S–F when slots empty and preserves backend order otherwise', () => {
    expect(toEditableBoard([]).map((s) => s.label)).toEqual([...DEFAULT_TIER_LABELS]);
    const slots: TierSlotResponse[] = [
      { label: 'A', position: 0, games: [{ gameId: 'g1', position: 0 }] },
      { label: 'S', position: 1, games: [] },
    ];
    expect(toEditableBoard(slots).map((s) => s.label)).toEqual(['A', 'S']);
  });

  it('moves reorders removes and blocks duplicates', () => {
    let board = toEditableBoard([]);
    const added = addGameToBoard(board, 'S', { gameId: 'g1', title: 'One' });
    expect(added).not.toBe('duplicate');
    board = added as ReturnType<typeof toEditableBoard>;
    expect(addGameToBoard(board, 'A', { gameId: 'g1', title: 'One' })).toBe('duplicate');
    board = addGameToBoard(board, 'S', { gameId: 'g2', title: 'Two' }) as typeof board;
    board = reorderGameInTier(board, 'S', 0, 1);
    expect(board.find((s) => s.label === 'S')?.games.map((g) => g.gameId)).toEqual(['g2', 'g1']);
    board = moveGameOnBoard(board, 'g1', 'A', 0);
    expect(collectBoardGameIds(board).has('g1')).toBe(true);
    expect(board.find((s) => s.label === 'A')?.games[0]?.gameId).toBe('g1');
    board = removeGameFromBoard(board, 'g2');
    expect(collectBoardGameIds(board).has('g2')).toBe(false);
  });

  it('builds slots put payload', () => {
    const board = toEditableBoard([
      {
        label: 'S',
        position: 0,
        games: [
          { gameId: 'g2', position: 0 },
          { gameId: 'g1', position: 1 },
        ],
      },
      { label: 'A', position: 1, games: [] },
    ]);
    const payload = boardToSlotsPutPayload(board);
    expect(tierListSlotsPutSchema.parse(payload).slots[0]?.gameIds).toEqual(['g2', 'g1']);
  });

  it('resolves list states', () => {
    const list: TierListResponse[] = [];
    expect(
      resolveListView({
        isPending: false,
        isError: false,
        error: null,
        items: list,
        isRefreshing: false,
      }).status,
    ).toBe('empty');
  });
});
