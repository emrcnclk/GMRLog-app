import type { GameMetadataRepository } from '@gmrlog/database';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AppLogger } from '../../infrastructure/logging/app-logger.service';
// Same skeleton-row helper `library-sync.service.ts`'s `resolveOrCreateGame`
// already uses — one slugging rule for every path that creates a bare `Game`.
import { slugifyGameTitle } from '../../integrations/mappers/integrations.mapper';

import { GameMetadataPublisher } from './game-metadata.publisher';
import { resolveMetadataStatus, toApplyGameMetadataInput } from './metadata-merge';
import type { MetadataConfig } from './metadata.config';
import { IgdbMetadataProvider, type IgdbCatalogRow } from './providers/igdb.provider';

/** D11.1 — named high-water mark row for this sync. One cursor per source, so a
 * second bulk source (Steam, RAWG) can get its own row without colliding. */
export const IGDB_CATALOG_CURSOR_NAME = 'igdb-catalog';

export interface CatalogSyncPageStats {
  page: number;
  fetched: number;
  created: number;
  enqueuedForEnrich: number;
  skippedNoIgdbId: number;
}

export interface CatalogSyncStats {
  pagesFetched: number;
  rawFetched: number;
  created: number;
  enqueuedForEnrich: number;
  cursorBefore: number;
  cursorAfter: number;
  wallMs: number;
  pages: CatalogSyncPageStats[];
}

/**
 * D11.1 — mirrors IGDB's main-game catalog into `Game` rows.
 *
 * Confirmed at design time (TASKS.md §11.1): no ingestion path existed before
 * this — `IgdbMetadataProvider.lookup` only does single-record lookups, and
 * `GameMetadataBackfillService` only enriches rows that already exist. This
 * service is what actually creates rows at catalog scale.
 *
 * Decisions (state, don't re-litigate — see TASKS.md §11.1's closing note):
 *  1. Mirror, not on-demand — catalog completeness is load-bearing for
 *     search/DNA-match, so a job walks IGDB rather than creating rows lazily
 *     off a user's search string.
 *  2. Scope filter is IGDB's `game_type` field (main_game + close kin — see
 *     `IGDB_CATALOG_CATEGORIES`), applied server-side in
 *     `IgdbMetadataProvider.listCatalogPage`'s `where` clause, plus a real
 *     past `first_release_date`. NOT the older `category` field — verified
 *     live against the real API that `category` is a dead filter on this
 *     account's IGDB v4 access (see `igdb.provider.ts`'s `IgdbGame.game_type`
 *     doc comment for the count-based proof).
 *  3. Idempotency/merge reuses the exact functions the per-game worker path
 *     uses (`toApplyGameMetadataInput`/`resolveMetadataStatus` from
 *     `metadata-merge.ts`) — never a second, ad hoc `Game` update. A game
 *     IGDB already gave us full metadata for (this endpoint returns the full
 *     field set, not just an id) is written directly via
 *     `repository.applyMetadata`; a game already present in our catalog is
 *     left alone here and routed through the existing `enqueueEnrich` job so
 *     the normal worker path (which respects `metadataStatus`/staleness)
 *     handles it.
 *  4. Incremental sync via IGDB's `updated_at` — the run persists the max
 *     `updated_at` it observed to `SyncCursor` (name `IGDB_CATALOG_CURSOR_NAME`)
 *     so a second run only asks for `updated_at > <cursor>`.
 *  5. Isolation: this class is invoked either directly (the `catalog-sync`
 *     application-context script) or via `GameCatalogSyncProcessor` on
 *     `QUEUE_GAME_CATALOG_SYNC` — a queue separate from `QUEUE_GAME_METADATA`
 *     so a bulk run never competes with per-game enrich concurrency.
 */
@Injectable()
export class GameCatalogSyncService {
  constructor(
    private readonly igdb: IgdbMetadataProvider,
    private readonly repository: GameMetadataRepository,
    private readonly prisma: PrismaService,
    private readonly publisher: GameMetadataPublisher,
    private readonly logger: AppLogger,
    private readonly config: MetadataConfig,
  ) {}

  /**
   * Fetches up to `maxPages * pageSize` catalog rows starting from the
   * persisted cursor, upserts them, and advances the cursor to the max
   * `updated_at` actually observed. Never advances the cursor past what was
   * actually processed — a crash mid-run loses at most the in-flight page,
   * never silently skips ahead.
   */
  async syncPages(maxPages: number, pageSize = 500): Promise<CatalogSyncStats> {
    const startedAt = Date.now();
    const cursorBefore = await this.readCursor();
    let maxUpdatedAtSeen = cursorBefore;

    const pages: CatalogSyncPageStats[] = [];
    let rawFetched = 0;
    let created = 0;
    let enqueuedForEnrich = 0;
    let pagesFetched = 0;

    for (let page = 0; page < maxPages; page += 1) {
      const rows = await this.igdb.listCatalogPage({
        limit: pageSize,
        offset: page * pageSize,
        updatedAfterUnix: cursorBefore,
      });
      pagesFetched += 1;

      if (rows.length === 0) {
        this.logger.event('info', { page, cursorBefore }, 'game.catalog-sync.page.empty');
        break;
      }

      let pageCreated = 0;
      let pageEnqueued = 0;
      let pageSkipped = 0;

      for (const row of rows) {
        rawFetched += 1;
        if (row.updatedAtUnix > maxUpdatedAtSeen) {
          maxUpdatedAtSeen = row.updatedAtUnix;
        }

        const igdbId = row.metadata.externalIds.igdbId;
        if (igdbId == null) {
          // Should not happen — listCatalogPage matches by id — but a
          // defensive skip beats a crashed run over a malformed row.
          pageSkipped += 1;
          continue;
        }

        const outcome = await this.upsertOne(igdbId, row.metadata);
        if (outcome === 'created') {
          pageCreated += 1;
        } else if (outcome === 'enqueued') {
          pageEnqueued += 1;
        }
      }

      created += pageCreated;
      enqueuedForEnrich += pageEnqueued;

      const stats: CatalogSyncPageStats = {
        page,
        fetched: rows.length,
        created: pageCreated,
        enqueuedForEnrich: pageEnqueued,
        skippedNoIgdbId: pageSkipped,
      };
      pages.push(stats);

      // 10.7's volume rule: log once per page, not once per game.
      this.logger.event('info', stats, 'game.catalog-sync.page.done');

      if (rows.length < pageSize) {
        // Short page — this was the last one for this cursor.
        break;
      }
    }

    // Only persist the cursor after the whole bounded run completes without
    // throwing — a mid-run failure leaves the cursor at its old value so the
    // next run re-fetches (idempotent: upsertOne never double-creates).
    if (maxUpdatedAtSeen > cursorBefore) {
      await this.writeCursor(maxUpdatedAtSeen);
    }

    const wallMs = Date.now() - startedAt;
    this.logger.event(
      'info',
      {
        pagesFetched,
        rawFetched,
        created,
        enqueuedForEnrich,
        cursorBefore,
        cursorAfter: maxUpdatedAtSeen,
        wallMs,
      },
      'game.catalog-sync.run.done',
    );

    return {
      pagesFetched,
      rawFetched,
      created,
      enqueuedForEnrich,
      cursorBefore,
      cursorAfter: maxUpdatedAtSeen,
      wallMs,
      pages,
    };
  }

  private async upsertOne(
    igdbId: number,
    metadata: IgdbCatalogRow['metadata'],
  ): Promise<'created' | 'enqueued' | 'skipped'> {
    const existing = await this.prisma.game.findUnique({
      where: { igdbId },
      select: { id: true },
    });

    if (existing !== null) {
      // Decision #3: an existing row is never touched directly here — route
      // it through the same enqueue path a per-game create would use, so the
      // worker's metadataStatus/staleness rules stay the single source of
      // truth for whether a re-enrich actually runs.
      const jobId = await this.publisher.enqueueEnrich({
        gameId: existing.id,
        reason: 'refresh',
        igdbId,
      });
      return jobId === null ? 'skipped' : 'enqueued';
    }

    const title = metadata.title;
    if (title == null || title.trim().length === 0) {
      return 'skipped';
    }

    const skeleton = await this.createSkeleton(title, igdbId);
    if (skeleton === null) {
      return 'skipped';
    }

    // Decision #3, throughput branch: IGDB's catalog-listing response already
    // carries the full field set (same `IGDB_FIELDS` the single-lookup path
    // requests), so writing it now — via the exact same
    // `toApplyGameMetadataInput`/`applyMetadata` the worker uses — avoids a
    // second, wasted per-game IGDB round trip through `enqueueEnrich`.
    const status = resolveMetadataStatus(metadata, this.config.completeConfidence);
    await this.repository.applyMetadata(
      toApplyGameMetadataInput(skeleton.id, metadata, status, new Date()),
    );

    return 'created';
  }

  private async createSkeleton(title: string, igdbId: number): Promise<{ id: string } | null> {
    const slug = slugifyGameTitle(title);
    try {
      return await this.prisma.game.create({
        data: { title, slug, igdbId },
        select: { id: true },
      });
    } catch {
      // Unique clash on slug (or a racing writer already created this igdbId)
      // — fall back to a disambiguated slug rather than failing the run.
      try {
        return await this.prisma.game.create({
          data: { title, slug: `${slug}-${String(igdbId)}`, igdbId },
          select: { id: true },
        });
      } catch {
        return null;
      }
    }
  }

  private async readCursor(): Promise<number> {
    const row = await this.prisma.syncCursor.findUnique({
      where: { name: IGDB_CATALOG_CURSOR_NAME },
    });
    if (row === null) {
      return 0;
    }
    const parsed = Number.parseInt(row.value, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }

  private async writeCursor(value: number): Promise<void> {
    await this.prisma.syncCursor.upsert({
      where: { name: IGDB_CATALOG_CURSOR_NAME },
      create: { name: IGDB_CATALOG_CURSOR_NAME, value: String(value) },
      update: { value: String(value) },
    });
  }
}
