import type { GameMediaKind, GameMetadataRepository, MetadataProvider } from '@gmrlog/database';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AppLogger } from '../../infrastructure/logging/app-logger.service';
import type { ObjectStoragePort } from '../../infrastructure/storage/object-storage.port';

import { GameMetadataPublisher } from './game-metadata.publisher';
import { toMediaLinks } from './metadata-merge';
import type { MetadataConfig } from './metadata.config';
import type { GameMediaIngestJobData } from './metadata.job-data';
import { IGDB_ATTRIBUTION, IgdbMetadataProvider } from './providers/igdb.provider';
import { emptyProviderMetadata } from './providers/metadata-provider.port';

/** IGDB's `where id = (...)` answers up to 500 ids per request. */
export const LINK_BATCH_SIZE = 500;

/** HEAD requests in flight at once while checking stored objects. */
const HEAD_CONCURRENCY = 16;

export interface MediaLinkBatchStats {
  batch: number;
  scanned: number;
  answeredByIgdb: number;
  linked: number;
  inserted: number;
  coversSet: number;
  heroesSet: number;
  cursor: string;
}

export interface MediaLinkStats {
  batches: MediaLinkBatchStats[];
  scanned: number;
  linked: number;
  inserted: number;
  coversSet: number;
  heroesSet: number;
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
 * Two operator passes over catalog media.
 *
 * **Link.** Catalog images are provider URL references since 2026-09, not
 * downloads. This asks IGDB — narrowly, for the cover, artworks and
 * screenshots only — about every catalog game and records what it offers as
 * references, under the same caps the enrich path uses (`toMediaLinks`). It
 * is idempotent: an existing row for the same image is left as it is,
 * including one whose asset was downloaded before, and a cover or hero
 * pointer is only filled where it is still empty.
 *
 * **Repair.** A `game_media` row whose *stored* object is gone — a lost
 * bucket, a storage move that did not carry the data, a restore from an older
 * backup — can never heal on its own, because the ingest worker skips any
 * asset it has a row for. This HEADs each stored row's object and re-enqueues
 * the missing ones as forced jobs, which rewrite the same keys (the key is a
 * digest of the source URL) without deleting a single row. Referenced rows
 * are skipped: they have no object to lose.
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
    private readonly repository: GameMetadataRepository,
    private readonly config: MetadataConfig,
  ) {}

  async linkProviderMedia(
    options: {
      batchSize?: number;
      maxBatches?: number;
      onBatch?: (stats: MediaLinkBatchStats) => void;
    } = {},
  ): Promise<MediaLinkStats> {
    const batchSize = Math.min(options.batchSize ?? LINK_BATCH_SIZE, LINK_BATCH_SIZE);
    const maxBatches = options.maxBatches ?? Number.POSITIVE_INFINITY;
    const startedAt = Date.now();
    const batches: MediaLinkBatchStats[] = [];
    let cursor: string | null = null;

    for (let batch = 0; batch < maxBatches; batch += 1) {
      // Keyset by id, never offset — the walk has to be stable while rows
      // gain media underneath it.
      const games: { id: string; igdbId: number | null }[] = await this.prisma.game.findMany({
        where: { igdbId: { not: null }, ...(cursor === null ? {} : { id: { gt: cursor } }) },
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
      const links = [...byIgdbId].flatMap(([igdbId, gameId]) =>
        toMediaLinks(
          gameId,
          { ...emptyProviderMetadata('igdb', IGDB_ATTRIBUTION), media: media.get(igdbId) ?? [] },
          this.config,
        ),
      );
      const result = await this.repository.linkMediaRefs(links);
      cursor = games[games.length - 1]?.id ?? cursor;

      const stats: MediaLinkBatchStats = {
        batch,
        scanned: games.length,
        answeredByIgdb: media.size,
        linked: links.length,
        inserted: result.inserted,
        coversSet: result.coversSet,
        heroesSet: result.heroesSet,
        cursor: cursor ?? '',
      };
      batches.push(stats);
      options.onBatch?.(stats);
      // One line per batch, never per game — 10.7's volume rule.
      this.logger.event('info', { ...stats }, 'game.media-backfill.link.batch');
    }

    return {
      batches,
      scanned: sum(batches, (b) => b.scanned),
      linked: sum(batches, (b) => b.linked),
      inserted: sum(batches, (b) => b.inserted),
      coversSet: sum(batches, (b) => b.coversSet),
      heroesSet: sum(batches, (b) => b.heroesSet),
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
        // A referenced row has no stored object to lose, so it is not
        // checked — and HEADing a provider URL against our bucket would
        // report it missing and download it, which is the one thing a
        // reference exists to avoid.
        where: {
          sourceUrl: { not: null },
          NOT: { storageKey: { startsWith: 'https://' } },
          ...(cursor === null ? {} : { id: { gt: cursor } }),
        },
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
