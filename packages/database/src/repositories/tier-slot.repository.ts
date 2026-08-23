import type { TierSlot, TierSlotGame } from '@prisma/client';

import { withTransaction, type DatabaseClient } from './types';

export interface TierSlotGameWrite {
  gameId: string;
  position: number;
}

export interface TierSlotWrite {
  label: string;
  position: number;
  games: TierSlotGameWrite[];
}

/** Slot row with ordered games — persistence projection for list/replace. */
export interface TierSlotBoardRow {
  slot: TierSlot;
  games: TierSlotGame[];
}

/**
 * TierSlot + TierSlotGame persistence (S2 §10.5). Whole-board replace is
 * transactional delete-all slots (+ cascade games) then insert (S1 PUT).
 */
export interface TierSlotRepository {
  listSlots(tierListId: string): Promise<TierSlotBoardRow[]>;
  replaceSlots(tierListId: string, slots: TierSlotWrite[]): Promise<TierSlotBoardRow[]>;
}

export class PrismaTierSlotRepository implements TierSlotRepository {
  constructor(private readonly db: DatabaseClient) {}

  async listSlots(tierListId: string): Promise<TierSlotBoardRow[]> {
    const slots = await this.db.tierSlot.findMany({
      where: { tierListId },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
      include: {
        games: {
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
        },
      },
    });
    return slots.map((slot) => ({
      slot: {
        id: slot.id,
        tierListId: slot.tierListId,
        label: slot.label,
        position: slot.position,
        createdAt: slot.createdAt,
        updatedAt: slot.updatedAt,
      },
      games: slot.games,
    }));
  }

  async replaceSlots(tierListId: string, slots: TierSlotWrite[]): Promise<TierSlotBoardRow[]> {
    await withTransaction(this.db, async (tx) => {
      await tx.tierSlot.deleteMany({ where: { tierListId } });
      for (const slot of slots) {
        await tx.tierSlot.create({
          data: {
            tierListId,
            label: slot.label,
            position: slot.position,
            games: {
              create: slot.games.map((game) => ({
                gameId: game.gameId,
                position: game.position,
              })),
            },
          },
        });
      }
    });
    return this.listSlots(tierListId);
  }
}
