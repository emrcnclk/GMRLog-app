import type { LibraryStatus, SyncConflictResolution } from '@gmrlog/database';
import type { SyncConflictResolutionValue, SyncHistoryResponse } from '@gmrlog/types';
import { Inject, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';

import { AchievementsService } from '../achievements/achievements.service';
import { DiscoveryScoreService } from '../discover/discovery-score.service';
import { GameMetadataPublisher } from '../games/metadata/game-metadata.publisher';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { SearchIndexPublisher } from '../infrastructure/jobs/search-index.publisher';

import type { CsvImportRow } from './csv/csv-import.parser';
import { slugifyGameTitle, toSyncHistoryResponse } from './mappers/integrations.mapper';
import {
  hasPlaytimeConflict,
  hasStatusConflict,
  resolveConflictField,
  resolveUnattendedMerge,
} from './merge/conflict-resolution.engine';
import {
  STEAM_WEB_API_CLIENT,
  type SteamOwnedGame,
  type SteamWebApiClient,
} from './steam/steam-web-api.client';

const ACTIVITY_LIBRARY_SYNCED = 'library_synced';
const ACTIVITY_PLAYTIME_UPDATED = 'playtime_updated';
const ACTIVITY_LIBRARY_IMPORT = 'library_import';

const NOTIFICATION_LIBRARY_IMPORTED = 'library_imported';
const NOTIFICATION_SYNC_COMPLETED = 'sync_completed';
const NOTIFICATION_SYNC_FAILED = 'sync_failed';
const NOTIFICATION_NEW_GAMES_FOUND = 'new_games_found';
const NOTIFICATION_LIBRARY_UPDATED = 'library_updated';

const LIBRARY_STATUSES = new Set<string>([
  'owned',
  'playing',
  'completed',
  'wishlist',
  'backlog',
  'hidden',
  'dropped',
]);

interface SyncCounters {
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  warningCount: number;
}

interface ImportableGame {
  externalId: string;
  title: string;
  playtimeForeverMin: number;
  playtime2WeeksMin: number;
  lastPlayedAt: Date | null;
  status?: string;
}

/**
 * Steam / CSV library import & sync engine (D3.23 / SYNC_ENGINE.md).
 */
@Injectable()
export class LibrarySyncService {
  private readonly logger = new Logger(LibrarySyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STEAM_WEB_API_CLIENT) private readonly steam: SteamWebApiClient,
    @Optional() private readonly discoveryScores?: DiscoveryScoreService,
    @Optional() private readonly achievements?: AchievementsService,
    @Optional() private readonly searchIndex?: SearchIndexPublisher,
    /** D3.25 — enqueue catalog enrichment for newly created skeleton games. */
    @Optional() private readonly gameMetadata?: GameMetadataPublisher,
  ) {}

  async runSync(syncJobId: string): Promise<SyncHistoryResponse> {
    return this.executeJob(syncJobId, 'sync');
  }

  async runImport(
    syncJobId: string,
    options: {
      csvRows?: CsvImportRow[];
      conflictResolution?: SyncConflictResolutionValue;
    } = {},
  ): Promise<SyncHistoryResponse> {
    return this.executeJob(syncJobId, 'import', options);
  }

  private async executeJob(
    syncJobId: string,
    mode: 'sync' | 'import',
    options: {
      csvRows?: CsvImportRow[];
      conflictResolution?: SyncConflictResolutionValue;
    } = {},
  ): Promise<SyncHistoryResponse> {
    const job = await this.prisma.syncJob.findUnique({ where: { id: syncJobId } });
    if (job === null) {
      throw new NotFoundException('Sync job not found');
    }

    const startedAt = new Date();
    await this.prisma.syncJob.update({
      where: { id: syncJobId },
      data: { status: 'processing', startedAt, attemptCount: { increment: 1 } },
    });

    const counters: SyncCounters = {
      importedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      warningCount: 0,
    };

    try {
      const games = await this.loadImportables(job, options.csvRows);
      const resolutionOverride = options.conflictResolution;

      for (const game of games) {
        try {
          await this.mergeOneGame(
            job.userId,
            job.integrationId,
            job.provider,
            job.id,
            game,
            resolutionOverride,
            counters,
          );
        } catch (error: unknown) {
          counters.failedCount += 1;
          this.logger.warn(
            `merge failed for ${game.externalId}: ${
              error instanceof Error ? error.message : 'unknown'
            }`,
          );
        }
      }

      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - startedAt.getTime();

      await this.prisma.syncJob.update({
        where: { id: syncJobId },
        data: { status: 'completed', finishedAt, errorCode: null },
      });

      if (job.integrationId !== null) {
        await this.prisma.userIntegration.update({
          where: { id: job.integrationId },
          data: { lastSyncAt: finishedAt },
        });
      }

      const history = await this.prisma.syncHistory.upsert({
        where: { syncJobId },
        create: {
          userId: job.userId,
          integrationId: job.integrationId,
          syncJobId,
          provider: job.provider,
          syncType: job.syncType,
          status: 'completed',
          startedAt,
          finishedAt,
          durationMs,
          ...counters,
        },
        update: {
          status: 'completed',
          finishedAt,
          durationMs,
          ...counters,
        },
      });

      await this.emitSuccessSideEffects(job.userId, job.id, mode, counters, finishedAt);

      await this.refreshAchievements(job.userId);

      return toSyncHistoryResponse(history);
    } catch (error: unknown) {
      const finishedAt = new Date();
      const message = error instanceof Error ? error.message : 'sync_failed';
      await this.prisma.syncJob.update({
        where: { id: syncJobId },
        data: { status: 'failed', finishedAt, errorCode: 'sync_failed' },
      });
      await this.prisma.syncHistory.upsert({
        where: { syncJobId },
        create: {
          userId: job.userId,
          integrationId: job.integrationId,
          syncJobId,
          provider: job.provider,
          syncType: job.syncType,
          status: 'failed',
          startedAt,
          finishedAt,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          ...counters,
          failedCount: counters.failedCount + 1,
        },
        update: {
          status: 'failed',
          finishedAt,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          failedCount: counters.failedCount + 1,
        },
      });
      await this.prisma.notification.create({
        data: {
          recipientId: job.userId,
          kind: NOTIFICATION_SYNC_FAILED,
          objectType: 'user',
          objectId: syncJobId,
        },
      });
      this.logger.warn(`sync job ${syncJobId} failed: ${message}`);
      throw error;
    }
  }

  private async loadImportables(
    job: {
      provider: string;
      integrationId: string | null;
      userId: string;
    },
    csvRows?: CsvImportRow[],
  ): Promise<ImportableGame[]> {
    if (job.provider === 'csv') {
      const rows = csvRows ?? [];
      return rows.map((row, index) => ({
        externalId: `csv:${slugifyGameTitle(row.title)}:${String(index)}`,
        title: row.title,
        playtimeForeverMin: row.playtimeMin ?? 0,
        playtime2WeeksMin: 0,
        lastPlayedAt: null,
        status: row.status,
      }));
    }

    if (job.provider !== 'steam' || job.integrationId === null) {
      return [];
    }

    const integration = await this.prisma.userIntegration.findUnique({
      where: { id: job.integrationId },
    });
    if (integration === null) {
      return [];
    }

    const owned = await this.steam.getOwnedGames(integration.externalRef);
    return owned.map((game) => this.fromSteamOwned(game));
  }

  private fromSteamOwned(game: SteamOwnedGame): ImportableGame {
    let status = 'owned';
    if (game.playtime2WeeksMin > 0) {
      status = 'playing';
    } else if (game.playtimeForeverMin > 0) {
      status = 'owned';
    }
    return {
      externalId: game.appId,
      title: game.name,
      playtimeForeverMin: game.playtimeForeverMin,
      playtime2WeeksMin: game.playtime2WeeksMin,
      lastPlayedAt: game.lastPlayedAt,
      status,
    };
  }

  private async mergeOneGame(
    userId: string,
    integrationId: string | null,
    provider: 'steam' | 'xbox' | 'playstation' | 'epic' | 'nintendo' | 'csv',
    syncJobId: string,
    game: ImportableGame,
    resolutionOverride: SyncConflictResolutionValue | undefined,
    counters: SyncCounters,
  ): Promise<void> {
    const now = new Date();
    const previousExternal = await this.prisma.externalGame.findUnique({
      where: { provider_externalId: { provider, externalId: game.externalId } },
    });
    const previousPlaytime = previousExternal?.playtimeForeverMin ?? null;

    const external = await this.prisma.externalGame.upsert({
      where: { provider_externalId: { provider, externalId: game.externalId } },
      create: {
        integrationId,
        provider,
        externalId: game.externalId,
        title: game.title,
        playtimeForeverMin: game.playtimeForeverMin,
        playtime2WeeksMin: game.playtime2WeeksMin,
        lastPlayedAt: game.lastPlayedAt,
        lastSyncAt: now,
        mappingConfidence: 0,
      },
      update: {
        integrationId,
        title: game.title,
        playtimeForeverMin: game.playtimeForeverMin,
        playtime2WeeksMin: game.playtime2WeeksMin,
        lastPlayedAt: game.lastPlayedAt,
        lastSyncAt: now,
      },
    });

    // Steam's externalId is the appid — hand it to the catalog so IGDB can be
    // skipped in favour of an exact Steam Store lookup (D3.25).
    const steamAppId = provider === 'steam' ? toSteamAppId(game.externalId) : null;
    const internalGame = await this.resolveOrCreateGame(game.title, steamAppId);
    await this.prisma.externalGame.update({
      where: { id: external.id },
      data: {
        internalGameId: internalGame.id,
        mappingConfidence: 1,
      },
    });

    if (this.searchIndex != null) {
      try {
        await this.searchIndex.publishUpsert('game', internalGame.id);
      } catch (error: unknown) {
        counters.warningCount += 1;
        this.logger.warn(
          `search index upsert failed for ${internalGame.id}: ${
            error instanceof Error ? error.message : 'unknown'
          }`,
        );
      }
    }

    if (this.discoveryScores != null) {
      try {
        await this.discoveryScores.recomputeForGame(internalGame.id);
      } catch (error: unknown) {
        counters.warningCount += 1;
        this.logger.warn(
          `discovery recompute failed for ${internalGame.id}: ${
            error instanceof Error ? error.message : 'unknown'
          }`,
        );
      }
    }

    const existingEntry = await this.prisma.libraryEntry.findUnique({
      where: { userId_gameId: { userId, gameId: internalGame.id } },
    });

    const remoteStatus = toLibraryStatus(game.status) ?? 'owned';
    const remote = {
      status: remoteStatus,
      playtimeMin: game.playtimeForeverMin,
      lastPlayedAt: game.lastPlayedAt,
      updatedAt: game.lastPlayedAt ?? now,
    };

    if (existingEntry === null) {
      const created = await this.prisma.libraryEntry.create({
        data: {
          userId,
          gameId: internalGame.id,
          status: remoteStatus,
          source: provider === 'steam' ? 'steam_import' : 'manual',
        },
      });
      if (game.playtimeForeverMin > 0) {
        await this.writePlaytimeSessionProxy(created.id, game.playtimeForeverMin, now);
      }
      counters.importedCount += 1;
      return;
    }

    const local = {
      status: existingEntry.status,
      updatedAt: existingEntry.updatedAt,
      playtimeMin: previousPlaytime,
    };

    const statusDiffers = hasStatusConflict(local, remote);
    const playtimeDiffers = hasPlaytimeConflict(local, remote);

    if (!statusDiffers && !playtimeDiffers) {
      // Idempotent re-sync: ExternalGame lastSync refreshed; count as updated, not skip.
      counters.updatedCount += 1;
      return;
    }

    if (resolutionOverride === 'ask_user') {
      await this.prisma.syncConflict.create({
        data: {
          userId,
          integrationId,
          syncJobId,
          externalGameId: external.id,
          internalGameId: internalGame.id,
          kind: 'conflict',
          resolution: null,
          localSnapshot: {
            status: existingEntry.status,
            updatedAt: existingEntry.updatedAt.toISOString(),
          },
          remoteSnapshot: {
            status: remoteStatus,
            playtimeMin: game.playtimeForeverMin,
            lastPlayedAt: game.lastPlayedAt?.toISOString() ?? null,
          },
        },
      });
      counters.skippedCount += 1;
      counters.warningCount += 1;
      return;
    }

    const merge = resolveUnattendedMerge(local, remote, {
      ...(resolutionOverride !== undefined
        ? { status: resolutionOverride, playtime: resolutionOverride }
        : {}),
    });

    if (merge.status.winner === 'ask_user' || merge.playtime.winner === 'ask_user') {
      await this.prisma.syncConflict.create({
        data: {
          userId,
          integrationId,
          syncJobId,
          externalGameId: external.id,
          internalGameId: internalGame.id,
          kind: 'conflict',
          resolution: 'ask_user' satisfies SyncConflictResolution,
          localSnapshot: { status: existingEntry.status },
          remoteSnapshot: { status: remoteStatus, playtimeMin: game.playtimeForeverMin },
        },
      });
      counters.skippedCount += 1;
      return;
    }

    let didUpdate = false;

    if (statusDiffers && merge.status.winner === 'remote' && merge.status.chosenStatus) {
      const nextStatus = toLibraryStatus(merge.status.chosenStatus);
      if (nextStatus !== null && nextStatus !== existingEntry.status) {
        await this.prisma.libraryEntry.update({
          where: { id: existingEntry.id },
          data: { status: nextStatus, version: { increment: 1 } },
        });
        await this.prisma.gameLog.create({
          data: {
            libraryEntryId: existingEntry.id,
            kind: 'status_change',
            occurredAt: now,
          },
        });
        didUpdate = true;
      }
    } else if (statusDiffers && merge.status.winner === 'local') {
      // Preserve GMRLOG shelf; Steam mapping already stored on ExternalGame.
      counters.skippedCount += 1;
    }

    if (playtimeDiffers) {
      const playtimeDecision = resolveConflictField(
        merge.playtime.resolution,
        local,
        remote,
        'playtime',
      );
      if (playtimeDecision.winner === 'remote') {
        await this.writePlaytimeSessionProxy(existingEntry.id, game.playtimeForeverMin, now);
        didUpdate = true;
        await this.prisma.activityItem.create({
          data: {
            kind: ACTIVITY_PLAYTIME_UPDATED,
            actorId: userId,
            objectType: 'game',
            objectId: internalGame.id,
            occurredAt: now,
          },
        });
      }
    }

    if (didUpdate) {
      counters.updatedCount += 1;
    }
  }

  /**
   * D3.25 — a game created here is a title-only skeleton. It is enqueued for
   * catalog enrichment so it does not stay `title + slug` forever
   * (docs/18_CATALOG/GAME_METADATA_ARCHITECTURE.md §2). The enqueue is
   * fire-and-forget: sync never waits on, or fails because of, metadata.
   */
  private async resolveOrCreateGame(
    title: string,
    steamAppId: number | null = null,
  ): Promise<{ id: string; slug: string }> {
    const slug = slugifyGameTitle(title);
    const bySlug = await this.prisma.game.findUnique({ where: { slug } });
    if (bySlug !== null) {
      return bySlug;
    }

    const byTitle = await this.prisma.game.findFirst({
      where: { title: { equals: title, mode: 'insensitive' } },
    });
    if (byTitle !== null) {
      return byTitle;
    }

    const created = await this.createGameRow(title, slug);
    if (created !== null) {
      await this.enqueueMetadataEnrichment(created.id, steamAppId);
      return created;
    }

    const raced = await this.prisma.game.findUnique({ where: { slug } });
    if (raced !== null) {
      return raced;
    }

    const uniqueSlug = `${slug}-${Date.now().toString(36)}`;
    const fallback = await this.prisma.game.create({ data: { title, slug: uniqueSlug } });
    await this.enqueueMetadataEnrichment(fallback.id, steamAppId);
    return fallback;
  }

  private async createGameRow(
    title: string,
    slug: string,
  ): Promise<{ id: string; slug: string } | null> {
    try {
      return await this.prisma.game.create({ data: { title, slug } });
    } catch {
      return null;
    }
  }

  private async enqueueMetadataEnrichment(
    gameId: string,
    steamAppId: number | null,
  ): Promise<void> {
    if (this.gameMetadata == null) {
      return;
    }
    try {
      await this.gameMetadata.enqueueEnrich({ gameId, reason: 'created', steamAppId });
    } catch (error: unknown) {
      // A missed enqueue is recovered by the hourly backfill scan; it must
      // never fail an import.
      this.logger.warn(
        `game.metadata.enqueue.failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async writePlaytimeSessionProxy(
    libraryEntryId: string,
    playtimeForeverMin: number,
    occurredAt: Date,
  ): Promise<void> {
    // Honest proxy: one session log when playtime is present / updated.
    if (playtimeForeverMin <= 0) {
      return;
    }
    await this.prisma.gameLog.create({
      data: {
        libraryEntryId,
        kind: 'session',
        occurredAt,
      },
    });
  }

  private async emitSuccessSideEffects(
    userId: string,
    syncJobId: string,
    mode: 'sync' | 'import',
    counters: SyncCounters,
    occurredAt: Date,
  ): Promise<void> {
    const activityKind = mode === 'import' ? ACTIVITY_LIBRARY_IMPORT : ACTIVITY_LIBRARY_SYNCED;
    await this.prisma.activityItem.create({
      data: {
        kind: activityKind,
        actorId: userId,
        objectType: 'user',
        objectId: syncJobId,
        occurredAt,
      },
    });

    await this.prisma.notification.create({
      data: {
        recipientId: userId,
        kind: mode === 'import' ? NOTIFICATION_LIBRARY_IMPORTED : NOTIFICATION_SYNC_COMPLETED,
        objectType: 'user',
        objectId: syncJobId,
      },
    });

    if (counters.importedCount > 0) {
      await this.prisma.notification.create({
        data: {
          recipientId: userId,
          kind: NOTIFICATION_NEW_GAMES_FOUND,
          objectType: 'user',
          objectId: syncJobId,
        },
      });
    }

    if (counters.updatedCount > 0) {
      await this.prisma.notification.create({
        data: {
          recipientId: userId,
          kind: NOTIFICATION_LIBRARY_UPDATED,
          objectType: 'user',
          objectId: syncJobId,
        },
      });
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
        `Achievement recalculation after sync failed for ${userId}: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
    }
  }
}

function toLibraryStatus(value: string | undefined): LibraryStatus | null {
  if (value === undefined) {
    return null;
  }
  if (!LIBRARY_STATUSES.has(value)) {
    return null;
  }
  return value as LibraryStatus;
}

/** Steam's `ExternalGame.externalId` is the numeric appid (D3.25). */
function toSteamAppId(externalId: string): number | null {
  const parsed = Number.parseInt(externalId, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
