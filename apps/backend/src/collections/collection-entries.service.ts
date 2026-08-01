import type {
  CollectionEntryRepository,
  CollectionRepository,
  GameRepository,
} from '@gmrlog/database';
import type { CollectionResponse } from '@gmrlog/types';
import type { CollectionEntriesPutInput } from '@gmrlog/validators';
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CollectionsService } from './collections.service';
import {
  COLLECTION_ENTRY_REPOSITORY,
  COLLECTION_GAME_REPOSITORY,
  COLLECTION_REPOSITORY,
} from './collections.tokens';

/**
 * Collection entries service (S1 §14.11). Replace/reorder via PUT — order =
 * array order. No incremental add/remove routes in S1.
 */
@Injectable()
export class CollectionEntriesService {
  constructor(
    @Inject(COLLECTION_REPOSITORY) private readonly collections: CollectionRepository,
    @Inject(COLLECTION_ENTRY_REPOSITORY) private readonly entries: CollectionEntryRepository,
    @Inject(COLLECTION_GAME_REPOSITORY) private readonly games: GameRepository,
    private readonly collectionsService: CollectionsService,
  ) {}

  async replaceEntries(
    collectionId: string,
    actorId: string,
    input: CollectionEntriesPutInput,
  ): Promise<CollectionResponse> {
    const collection = await this.collectionsService.requireActiveCollection(collectionId);
    this.collectionsService.assertOwner(collection, actorId);

    this.assertUniqueGameIds(input.entries.map((entry) => entry.gameId));
    await this.requireGamesExist(input.entries.map((entry) => entry.gameId));

    await this.entries.replaceEntries(
      collection.id,
      input.entries.map((entry, index) => ({
        gameId: entry.gameId,
        position: index,
        note: entry.note ?? null,
      })),
    );

    const updated = await this.collections.update(collection.id, {
      version: { increment: 1 },
    });
    return this.collectionsService.project(updated);
  }

  private assertUniqueGameIds(gameIds: string[]): void {
    const seen = new Set<string>();
    for (const gameId of gameIds) {
      if (seen.has(gameId)) {
        throw new ConflictException('Duplicate game in collection entries');
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
