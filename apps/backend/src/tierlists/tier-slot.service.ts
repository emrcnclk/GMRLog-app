import type {
  GameRepository,
  TierListRepository,
  TierSlotRepository,
  TierSlotWrite,
} from '@gmrlog/database';
import type { TierListResponse } from '@gmrlog/types';
import type { TierListSlotsPutInput } from '@gmrlog/validators';
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { TierListsService } from './tierlists.service';
import {
  TIER_LIST_GAME_REPOSITORY,
  TIER_LIST_REPOSITORY,
  TIER_SLOT_REPOSITORY,
} from './tierlists.tokens';

/**
 * Tier board service (S1 §14.12). Whole-board replace via PUT — slot order =
 * array order; gameIds order = in-slot position. Empty tiers allowed.
 */
@Injectable()
export class TierSlotService {
  constructor(
    @Inject(TIER_LIST_REPOSITORY) private readonly tierLists: TierListRepository,
    @Inject(TIER_SLOT_REPOSITORY) private readonly slots: TierSlotRepository,
    @Inject(TIER_LIST_GAME_REPOSITORY) private readonly games: GameRepository,
    private readonly tierListsService: TierListsService,
  ) {}

  async replaceSlots(
    tierListId: string,
    actorId: string,
    input: TierListSlotsPutInput,
  ): Promise<TierListResponse> {
    const tierList = await this.tierListsService.requireActiveTierList(tierListId);
    this.tierListsService.assertOwner(tierList, actorId);

    const allGameIds = input.slots.flatMap((slot) => slot.gameIds);
    this.assertUniqueGameIds(allGameIds);
    await this.requireGamesExist(allGameIds);

    const write: TierSlotWrite[] = input.slots.map((slot, slotIndex) => ({
      label: slot.label,
      position: slotIndex,
      games: slot.gameIds.map((gameId, gameIndex) => ({
        gameId,
        position: gameIndex,
      })),
    }));

    await this.slots.replaceSlots(tierList.id, write);

    const updated = await this.tierLists.update(tierList.id, {
      version: { increment: 1 },
    });
    return this.tierListsService.project(updated);
  }

  private assertUniqueGameIds(gameIds: string[]): void {
    const seen = new Set<string>();
    for (const gameId of gameIds) {
      if (seen.has(gameId)) {
        throw new ConflictException('Duplicate game on tier list board');
      }
      seen.add(gameId);
    }
  }

  private async requireGamesExist(gameIds: string[]): Promise<void> {
    const unique = [...new Set(gameIds)];
    if (unique.length === 0) {
      return;
    }
    const found = await this.games.findManyByIds(unique);
    if (found.length !== unique.length) {
      throw new NotFoundException('Game not found');
    }
  }
}
