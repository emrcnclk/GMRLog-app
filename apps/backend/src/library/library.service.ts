import type {
  CompletionSource,
  FriendshipRepository,
  Game,
  GameLogRepository,
  GameRepository,
  LibraryEntry,
  LibraryEntryRepository,
  NotificationRepository,
  Prisma,
  WishlistMetadata,
} from '@gmrlog/database';
import type { LibraryEntryResponse, LibraryHubResponse } from '@gmrlog/types';
import type {
  LibraryEntriesQueryInput,
  LibraryEntryUpsertInput,
  WishlistMetadataPatchInput,
} from '@gmrlog/validators';
import { Inject, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';

import { AchievementsService } from '../achievements/achievements.service';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { FeedFanoutPublisher } from '../infrastructure/jobs/feed-fanout.publisher';

import {
  GAME_LOG_REPOSITORY,
  GAME_REPOSITORY,
  LIBRARY_ENTRY_REPOSITORY,
  LIBRARY_FRIENDSHIP_REPOSITORY,
  LIBRARY_NOTIFICATION_REPOSITORY,
} from './library.tokens';
import {
  toLibraryEntryResponse,
  toLibraryHubResponse,
  toWishlistMetadataResponse,
} from './mappers/library.mapper';

/** NOTIFICATION_MATRIX.md — friend started a wishlisted game. */
const NOTIFICATION_KIND_FRIEND_WISHLIST_PLAY = 'friend_wishlist_play';

/**
 * Library domain service (F6.3). Owns the player↔game relationship, status
 * shelves, GameLog foundation lifecycle, and D3.22 Wishlist++ metadata.
 * Import/Steam sync is out of scope.
 */
/**
 * 13.1 — the completion half of a player write.
 *
 * Three inputs, three outcomes, and the middle one is the reason this is a
 * function rather than a spread: `undefined` means the request said nothing
 * and must leave an existing figure alone, `null` means the player cleared it
 * and must erase both columns together, and a number is a claim.
 *
 * The source is always `self_reported` here. A player PUT cannot mint
 * evidence, the same rule the surrounding method already applies to
 * `LibrarySource` — `steam_import` is not writable from this route either.
 * When the achievement import lands it writes `imported`, and that value wins
 * because it is written after, not because this route defers to it.
 */
function completionData(percent: number | null | undefined): {
  completionPercent?: number | null;
  completionSource?: CompletionSource | null;
} {
  if (percent === undefined) {
    return {};
  }

  if (percent === null) {
    return { completionPercent: null, completionSource: null };
  }

  return { completionPercent: percent, completionSource: 'self_reported' };
}

@Injectable()
export class LibraryService {
  private readonly logger = new Logger(LibraryService.name);

  constructor(
    @Inject(LIBRARY_ENTRY_REPOSITORY) private readonly entries: LibraryEntryRepository,
    @Inject(GAME_LOG_REPOSITORY) private readonly logs: GameLogRepository,
    @Inject(GAME_REPOSITORY) private readonly games: GameRepository,
    private readonly feedFanout: FeedFanoutPublisher,
    private readonly prisma: PrismaService,
    @Optional() private readonly achievements?: AchievementsService,
    @Optional()
    @Inject(LIBRARY_FRIENDSHIP_REPOSITORY)
    private readonly friendships?: FriendshipRepository,
    @Optional()
    @Inject(LIBRARY_NOTIFICATION_REPOSITORY)
    private readonly notifications?: NotificationRepository,
  ) {}

  async getHub(userId: string): Promise<LibraryHubResponse> {
    const counts = await this.entries.countByUserGroupedByStatus(userId);
    return toLibraryHubResponse(counts);
  }

  async listEntries(
    userId: string,
    query: LibraryEntriesQueryInput = {},
  ): Promise<LibraryEntryResponse[]> {
    const status = query.filter?.status;
    const rows = await this.entries.listByUser(userId, status === undefined ? {} : { status });
    const gamesById = await this.loadGamesById(rows.map((row) => row.gameId));
    const wishlistByEntryId = await this.loadWishlistByEntryIds(rows.map((row) => row.id));
    return rows.map((row) =>
      toLibraryEntryResponse(
        row,
        this.requireLoadedGame(gamesById, row),
        wishlistByEntryId.get(row.id) ?? null,
      ),
    );
  }

  async getEntry(userId: string, gameId: string): Promise<LibraryEntryResponse> {
    const entry = await this.entries.findByUserAndGame(userId, gameId);
    if (!entry) {
      throw new NotFoundException('Library entry not found');
    }
    const game = await this.requireGame(gameId);
    const wishlist = await this.findWishlist(entry.id);
    return toLibraryEntryResponse(entry, game, wishlist);
  }

  /**
   * S1 §13.9 PUT upsert. Enforces one row per (user, game). Player writes are
   * always `manual` — `steam_import` is reserved for the import domain (S1
   * §14.9 "server may override"). Status changes and note changes append
   * GameLog foundation events (S2 §14 GameLogKind).
   */
  async upsertEntry(
    userId: string,
    gameId: string,
    input: LibraryEntryUpsertInput,
  ): Promise<LibraryEntryResponse> {
    const game = await this.requireGame(gameId);
    const existing = await this.entries.findByUserAndGame(userId, gameId);
    const now = new Date();

    if (!existing) {
      const created = await this.entries.create({
        user: { connect: { id: userId } },
        game: { connect: { id: gameId } },
        status: input.status,
        source: 'manual',
        ...(input.platformId !== undefined
          ? { platform: { connect: { id: input.platformId } } }
          : {}),
        ...(input.note !== undefined ? { note: input.note } : {}),
        ...completionData(input.completionPercent),
      });
      await this.appendLog(created.id, 'status_change', now);
      if (input.note !== undefined && input.note !== null && input.note !== '') {
        await this.appendLog(created.id, 'note', now);
      }
      if (input.status === 'wishlist') {
        await this.emitWishlistActivity(userId, gameId, now);
      }
      if (input.status === 'playing') {
        await this.notifyFriendsWishlistPlay(userId, gameId);
      }
      await this.refreshAchievements(userId);
      return toLibraryEntryResponse(created, game, null);
    }

    const statusChanged = existing.status !== input.status;
    const noteChanged = input.note !== undefined && input.note !== existing.note;

    const data: Prisma.LibraryEntryUpdateInput = {
      status: input.status,
      version: { increment: 1 },
    };
    if (input.note !== undefined) {
      data.note = input.note;
    }
    if (input.platformId !== undefined) {
      data.platform = { connect: { id: input.platformId } };
    }
    Object.assign(data, completionData(input.completionPercent));
    // Preserve existing source — Steam never replaces GMRLOG authorship (S1 §15.3).
    // Player PUT never writes `steam_import`.

    const updated = await this.entries.update(existing.id, data);
    if (statusChanged) {
      await this.appendLog(updated.id, 'status_change', now);
      if (input.status === 'wishlist') {
        await this.emitWishlistActivity(userId, gameId, now);
      }
      if (input.status === 'playing') {
        await this.notifyFriendsWishlistPlay(userId, gameId);
      }
    }
    if (noteChanged && input.note !== undefined && input.note !== null && input.note !== '') {
      await this.appendLog(updated.id, 'note', now);
    }
    await this.refreshAchievements(userId);
    const wishlist = await this.findWishlist(updated.id);
    return toLibraryEntryResponse(updated, game, wishlist);
  }

  /**
   * D3.22 Wishlist++ — upsert metadata for an existing library entry
   * (wishlist or owned). Docs path `/me/library/:gameId/wishlist-meta`;
   * transport mounts under `/library/entries/:gameId/wishlist-meta`.
   */
  async upsertWishlistMetadata(
    userId: string,
    gameId: string,
    input: WishlistMetadataPatchInput,
  ): Promise<LibraryEntryResponse> {
    const entry = await this.entries.findByUserAndGame(userId, gameId);
    if (!entry) {
      throw new NotFoundException('Library entry not found');
    }
    const game = await this.requireGame(gameId);

    const existing = await this.prisma.wishlistMetadata.findUnique({
      where: { libraryEntryId: entry.id },
    });

    let row: WishlistMetadata;
    if (existing === null) {
      row = await this.prisma.wishlistMetadata.create({
        data: {
          libraryEntry: { connect: { id: entry.id } },
          ...(input.priority !== undefined ? { priority: input.priority } : {}),
          ...(input.waitStatus !== undefined ? { waitStatus: input.waitStatus } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
        },
      });
    } else {
      row = await this.prisma.wishlistMetadata.update({
        where: { libraryEntryId: entry.id },
        data: {
          ...(input.priority !== undefined ? { priority: input.priority } : {}),
          ...(input.waitStatus !== undefined ? { waitStatus: input.waitStatus } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
        },
      });
    }

    return toLibraryEntryResponse(entry, game, toWishlistMetadataResponse(row));
  }

  private async emitWishlistActivity(
    userId: string,
    gameId: string,
    occurredAt: Date,
  ): Promise<void> {
    await this.feedFanout.publish({
      kind: 'wishlist',
      objectId: gameId,
      objectType: 'game',
      actorId: userId,
      occurredAt,
    });
  }

  /**
   * S2 §13 — hard-delete the relationship; GameLog rows cascade.
   * Soft-delete is not constitutionally defined for LibraryEntry.
   */
  async deleteEntry(userId: string, gameId: string): Promise<void> {
    const existing = await this.entries.findByUserAndGame(userId, gameId);
    if (!existing) {
      throw new NotFoundException('Library entry not found');
    }
    await this.entries.delete(existing.id);
    await this.refreshAchievements(userId);
  }

  /**
   * NOTIFICATION_MATRIX.md `friend_wishlist_play` — rate-limited, ON by default.
   * Notifies friends who wishlisted this game that `userId` started playing it.
   * Best-effort: never blocks the library write.
   */
  private async notifyFriendsWishlistPlay(userId: string, gameId: string): Promise<void> {
    if (this.friendships == null || this.notifications == null) {
      return;
    }
    try {
      const friendIds = await this.friendships.listFriendIds(userId);
      if (friendIds.length === 0) {
        return;
      }
      const friendIdSet = new Set(friendIds);
      const gameEntries = await this.entries.listByGame(gameId);
      for (const entry of gameEntries) {
        if (entry.status !== 'wishlist' || !friendIdSet.has(entry.userId)) {
          continue;
        }
        await this.notifications.create({
          recipient: { connect: { id: entry.userId } },
          kind: NOTIFICATION_KIND_FRIEND_WISHLIST_PLAY,
          objectType: 'game',
          objectId: gameId,
        });
      }
    } catch (error: unknown) {
      this.logger.warn(
        `friend_wishlist_play notification failed for ${userId}/${gameId}: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
    }
  }

  private async refreshAchievements(userId: string): Promise<void> {
    if (this.achievements == null) {
      return;
    }
    try {
      await this.achievements.recalculate(userId);
    } catch (error: unknown) {
      this.logger.warn(
        `Achievement recalculation after library change failed for ${userId}: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
    }
  }

  private async requireGame(gameId: string): Promise<Game> {
    const game = await this.games.findById(gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    return game;
  }

  private async loadGamesById(gameIds: string[]): Promise<Map<string, Game>> {
    const unique = [...new Set(gameIds)];
    const games = await this.games.findManyByIds(unique);
    return new Map(games.map((game) => [game.id, game]));
  }

  private requireLoadedGame(gamesById: Map<string, Game>, entry: LibraryEntry): Game {
    const game = gamesById.get(entry.gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    return game;
  }

  private async findWishlist(
    libraryEntryId: string,
  ): Promise<ReturnType<typeof toWishlistMetadataResponse> | null> {
    const row = await this.prisma.wishlistMetadata.findUnique({
      where: { libraryEntryId },
    });
    return row === null ? null : toWishlistMetadataResponse(row);
  }

  private async loadWishlistByEntryIds(
    libraryEntryIds: string[],
  ): Promise<Map<string, ReturnType<typeof toWishlistMetadataResponse>>> {
    const unique = [...new Set(libraryEntryIds)];
    if (unique.length === 0) {
      return new Map();
    }
    const rows = await this.prisma.wishlistMetadata.findMany({
      where: { libraryEntryId: { in: unique } },
    });
    return new Map(
      rows.map((row) => [row.libraryEntryId, toWishlistMetadataResponse(row)] as const),
    );
  }

  private appendLog(
    libraryEntryId: string,
    kind: 'status_change' | 'note',
    occurredAt: Date,
  ): Promise<unknown> {
    return this.logs.create({
      libraryEntry: { connect: { id: libraryEntryId } },
      kind,
      occurredAt,
    });
  }
}
