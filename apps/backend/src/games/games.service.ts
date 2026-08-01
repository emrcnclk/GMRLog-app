import type {
  Franchise,
  GameMetadataRepository,
  GameRepository,
  LibraryEntryRepository,
} from '@gmrlog/database';
import type {
  GameMediaResponse,
  GameMetadataStatusResponse,
  GameRelatedGameResponse,
  GameResponse,
} from '@gmrlog/types';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { isAuthenticatedIdentity, type RequestIdentity } from '../auth/interfaces/identity';
import { PrismaService } from '../infrastructure/database/prisma.service';

import {
  GAME_LIBRARY_ENTRY_REPOSITORY,
  GAME_METADATA_REPOSITORY,
  GAME_REPOSITORY,
} from './games.tokens';
import {
  toGameMediaResponse,
  toGameMetadataProjection,
  toGameRelatedGameResponse,
  toGameResponse,
} from './mappers/game.mapper';

/**
 * Game catalog domain service (F6.3 / D3.18, extended D3.25).
 *
 * Every read projects whatever is already persisted. Nothing here awaits a
 * metadata provider — see docs/18_CATALOG/GAME_METADATA_ARCHITECTURE.md §5
 * invariant 1.
 */
@Injectable()
export class GamesService {
  constructor(
    @Inject(GAME_REPOSITORY) private readonly games: GameRepository,
    @Inject(GAME_LIBRARY_ENTRY_REPOSITORY)
    private readonly libraryEntries: LibraryEntryRepository,
    @Inject(GAME_METADATA_REPOSITORY)
    private readonly metadata: GameMetadataRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getGame(gameId: string, identity: RequestIdentity): Promise<GameResponse> {
    const detail = await this.games.findDetailById(gameId);
    if (detail == null) {
      throw new NotFoundException('Game not found');
    }

    const [libraryEntry, catalog] = await Promise.all([
      isAuthenticatedIdentity(identity)
        ? this.libraryEntries.findByUserAndGame(identity.userId, gameId)
        : Promise.resolve(null),
      this.metadata.loadCatalogMetadata(gameId),
    ]);

    const franchise = await this.loadFranchise(detail.game.franchiseId);

    return toGameResponse(
      detail,
      libraryEntry,
      catalog === null ? null : { ...catalog, franchise },
    );
  }

  /** D3.25 — mirrored artwork for one game. */
  async listMedia(gameId: string): Promise<GameMediaResponse[]> {
    const game = await this.games.findById(gameId);
    if (game == null) {
      throw new NotFoundException('Game not found');
    }
    const media = await this.metadata.listMedia(gameId);
    return media.map(toGameMediaResponse);
  }

  /**
   * D3.25 — provider-declared similar games. Entries whose target is not yet in
   * the catalog are returned with `gameId: null` and the provider's title, so
   * the relationship is visible before the target game exists.
   */
  async listSimilar(gameId: string): Promise<GameRelatedGameResponse[]> {
    const game = await this.games.findById(gameId);
    if (game == null) {
      throw new NotFoundException('Game not found');
    }

    const related = await this.metadata.listRelatedGames(gameId, 'similar');
    const resolvedIds = related
      .map((row) => row.relatedGameId)
      .filter((id): id is string => id !== null);

    const resolved = await this.games.findManyByIds(resolvedIds);
    const byId = new Map(resolved.map((row) => [row.id, row]));

    return related.map((row) =>
      toGameRelatedGameResponse(
        row,
        row.relatedGameId === null ? null : (byId.get(row.relatedGameId) ?? null),
      ),
    );
  }

  /** D3.25 — enrichment status. Read-only; never triggers a provider call. */
  async getMetadataStatus(gameId: string): Promise<GameMetadataStatusResponse> {
    const game = await this.games.findById(gameId);
    if (game == null) {
      throw new NotFoundException('Game not found');
    }
    return { gameId, metadata: toGameMetadataProjection(game) };
  }

  private async loadFranchise(franchiseId: string | null): Promise<Franchise | null> {
    if (franchiseId === null) {
      return null;
    }
    return this.prisma.franchise.findUnique({ where: { id: franchiseId } });
  }
}
