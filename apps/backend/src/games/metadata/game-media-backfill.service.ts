import type { GameMediaKind, MetadataProvider } from '@gmrlog/database';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AppLogger } from '../../infrastructure/logging/app-logger.service';
import type { ObjectStoragePort } from '../../infrastructure/storage/object-storage.port';

import { GameMetadataPublisher } from './game-metadata.publisher';
import { selectBannerRef, toMediaJob } from './metadata-merge';
import type { GameMediaIngestJobData } from './metadata.job-data';
import { IgdbMetadataProvider } from './providers/igdb.provider';

/** IGDB's `where id = (...)` answers up to 500 ids per request. */
export const BANNER_BATCH_SIZE = 500;

/** HEAD requests in flight at once while checking stored objects. */
const HEAD_CONCURRENCY = 16;

export interface BannerBackfillBatchStats {
  batch: number;
  scanned: number;
  answeredByIgdb: number;
  heroQueued: number;
  screenshotQueued: number;
  noSource: number;
  cursor: string;
}

export interface BannerBackfillStats {
  batches: BannerBackfillBatchStats[];
  scanned: number;
  heroQueued: number;
  screenshotQueued: number;
  noSource: number;
  wallMs: number;
}

export interface MediaRepairBatchStats {
  batch: number;
  checked: number;
  missing: number;
  queued: number;
  skippedNoProvider: number;
  cursor: string;
}

export interface MediaRepairStats {
  batches: MediaRepairBatchStats[];
  checked: number;
  missing: number;
  queued: number;
  skippedNoProvider: number;
  wallMs: number;
}

/**
 * Two operator passes over catalog media, both of which only ever enqueue —
 * downloading, processing and promoting stay with the media worker, so the
 * ingest pipeline has one implementation rather than a second, script-shaped
 * one.
 *
 * **Banners.** The catalog walk (D11.2) enqueues covers only, and says why:
 * full media for every mirrored game is up to eighteen downloads each. That
 * left every mirrored game without a banner. This asks IGDB — narrowly, for
 * artworks and screenshots only — about games that have neither a hero nor a
 * screenshot yet, and enqueues exactly one image per game: the provider's
 * hero, or failing that the first screenshot (`selectBannerRef`).
 *
 * **Repair.** A `game_media` row can outlive the object it points at — a
 * lost bucket, a storage move that did not carry the data, a restore from an
 * older backup. The ingest worker skips any asset it has a row for, so such an
 * asset can never heal on its own. This HEADs each row's object and
 * re-enqueues the missing ones as forced jobs, which rewrite the same keys
 * (the key is a digest of the source URL) without deleting a single row.
 *
 * Its first run was on a false alarm, and that is worth knowing before
 * trusting a `missing` count: the MinIO it checked had been started with its
 * data path rewritten by Git Bash (CLAUDE.md, environment traps), so every
 * object looked absent while the real ones sat intact on the mounted disk.
 * A HEAD answers for the server it is pointed at, not for the data.
 */
@Injectable()
export class GameMediaBackfillService {
  constructor(
    private readonly igdb: IgdbMetadataProvider,
    private readonly prisma: PrismaService,
    private readonly publisher: GameMetadataPublisher,
    private readonly logger: AppLogger,
    private readonly storage: ObjectStoragePort,
  ) {}

  async enqueueBanners(
    options: {
      batchSize?: number;
      maxBatches?: number;
      onBatch?: (stats: BannerBackfillBatchStats) => void;
    } = {},
  ): Promise<BannerBackfillStats> {
    const batchSize = Math.min(options.batchSize ?? BANNER_BATCH_SIZE, BANNER_BATCH_SIZE);
    const maxBatches = options.maxBatches ?? Number.POSITIVE_INFINITY;
    const startedAt = Date.now();
    const batches: BannerBackfillBatchStats[] = [];
    let cursor: string | null = null;

    for (let batch = 0; batch < maxBatches; batch += 1) {
      // Keyset, never offset: every batch removes games from the `where` once
      // their jobs land, so an offset would skip rows as the set shrinks.
      const games: { id: string; igdbId: number | null }[] = await this.prisma.game.findMany({
        where: {
          igdbId: { not: null },
          heroKey: null,
          media: { none: { kind: { in: ['hero', 'screenshot'] } } },
          ...(cursor === null ? {} : { id: { gt: cursor } }),
        },
        select: { id: true, igdbId: true },
        orderBy: { id: 'asc' },
        take: batchSize,
      });
      if (games.length === 0) {
        break;
      }

      const byIgdbId = new Map<number, string>();
      for (const game of games) {
        if (game.igdbId !== null) {
          byIgdbId.set(game.igdbId, game.id);
        }
      }

      const media = await this.igdb.listMediaByIgdbIds([...byIgdbId.keys()]);
      const jobs: GameMediaIngestJobData[] = [];
      let heroQueued = 0;
      let screenshotQueued = 0;
      let noSource = 0;

      for (const [igdbId, gameId] of byIgdbId) {
        const banner = selectBannerRef(media.get(igdbId) ?? []);
        if (banner === null) {
          noSource += 1;
          continue;
        }
        jobs.push(toMediaJob(gameId, 'igdb', banner));
        if (banner.kind === 'hero') {
          heroQueued += 1;
        } else {
          screenshotQueued += 1;
        }
      }

      await this.publisher.enqueueMediaBatch(jobs);
      cursor = games[games.length - 1]?.id ?? cursor;

      const stats: BannerBackfillBatchStats = {
        batch,
        scanned: games.length,
        answeredByIgdb: media.size,
        heroQueued,
        screenshotQueued,
        noSource,
        cursor: cursor ?? '',
      };
      batches.push(stats);
      options.onBatch?.(stats);
      // One line per batch, never per game — 10.7's volume rule.
      this.logger.event('info', { ...stats }, 'game.media-backfill.banners.batch');
    }

    return {
      batches,
      scanned: sum(batches, (b) => b.scanned),
      heroQueued: sum(batches, (b) => b.heroQueued),
      screenshotQueued: sum(batches, (b) => b.screenshotQueued),
      noSource: sum(batches, (b) => b.noSource),
      wallMs: Date.now() - startedAt,
    };
  }

  async repairMissingObjects(
    options: {
      batchSize?: number;
      maxBatches?: number;
      onBatch?: (stats: MediaRepairBatchStats) => void;
    } = {},
  ): Promise<MediaRepairStats> {
    const batchSize = options.batchSize ?? 500;
    const maxBatches = options.maxBatches ?? Number.POSITIVE_INFINITY;
    const startedAt = Date.now();
    const batches: MediaRepairBatchStats[] = [];
    let cursor: string | null = null;

    for (let batch = 0; batch < maxBatches; batch += 1) {
      const rows: {
        id: string;
        gameId: string;
        kind: GameMediaKind;
        storageKey: string;
        provider: MetadataProvider | null;
        sourceUrl: string | null;
        sortOrder: number;
        width: number | null;
        height: number | null;
      }[] = await this.prisma.gameMedia.findMany({
        // Provider media only. A row without a source URL has nothing to
        // re-download from, and repairing a player's upload is not this job.
        where: { sourceUrl: { not: null }, ...(cursor === null ? {} : { id: { gt: cursor } }) },
        select: {
          id: true,
          gameId: true,
          kind: true,
          storageKey: true,
          provider: true,
          sourceUrl: true,
          sortOrder: true,
          width: true,
          height: true,
        },
        orderBy: { id: 'asc' },
        take: batchSize,
      });
      if (rows.length === 0) {
        break;
      }

      const present = await mapWithConcurrency(
        rows,
        HEAD_CONCURRENCY,
        async (row) => (await this.storage.headObject(row.storageKey)) !== null,
      );

      const jobs: GameMediaIngestJobData[] = [];
      let missing = 0;
      let skippedNoProvider = 0;
      rows.forEach((row, index) => {
        if (present[index] === true || row.sourceUrl === null) {
          return;
        }
        missing += 1;
        if (row.provider === null) {
          skippedNoProvider += 1;
          return;
        }
        jobs.push({
          gameId: row.gameId,
          kind: row.kind,
          sourceUrl: row.sourceUrl,
          provider: row.provider,
          sortOrder: row.sortOrder,
          width: row.width,
          height: row.height,
          promote: row.kind === 'cover' || row.kind === 'hero',
          force: true,
        });
      });

      const queued = await this.publisher.enqueueMediaBatch(jobs);
      cursor = rows[rows.length - 1]?.id ?? cursor;

      const stats: MediaRepairBatchStats = {
        batch,
        checked: rows.length,
        missing,
        queued,
        skippedNoProvider,
        cursor: cursor ?? '',
      };
      batches.push(stats);
      options.onBatch?.(stats);
      this.logger.event('info', { ...stats }, 'game.media-backfill.repair.batch');
    }

    return {
      batches,
      checked: sum(batches, (b) => b.checked),
      missing: sum(batches, (b) => b.missing),
      queued: sum(batches, (b) => b.queued),
      skippedNoProvider: sum(batches, (b) => b.skippedNoProvider),
      wallMs: Date.now() - startedAt,
    };
  }
}

function sum<T>(items: readonly T[], pick: (item: T) => number): number {
  return items.reduce((total, item) => total + pick(item), 0);
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      const item = items[index] as T;
      results[index] = await fn(item);
    }
  });
  await Promise.all(workers);
  return results;
}
