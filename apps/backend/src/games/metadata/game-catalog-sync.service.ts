import type { GameMetadataRepository, GameMetadataStatus } from '@gmrlog/database';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AppLogger } from '../../infrastructure/logging/app-logger.service';
import { SearchIndexService } from '../../infrastructure/search/search-index.service';
// Same skeleton-row helper `library-sync.service.ts`'s `resolveOrCreateGame`
// already uses — one slugging rule for every path that creates a bare `Game`.
import { slugifyGameTitle } from '../../integrations/mappers/integrations.mapper';

import { GameMetadataPublisher } from './game-metadata.publisher';
import {
  countPopulatedFields,
  resolveMetadataStatus,
  toApplyGameMetadataInput,
  toMediaJobs,
} from './metadata-merge';
import type { MetadataConfig } from './metadata.config';
import { IgdbMetadataProvider, type IgdbCatalogRow } from './providers/igdb.provider';

/** One newly-created row this page, carried from `upsertOne` to the
 * page-level batched follow-up (reindex) after the per-row loop finishes. */
interface CreatedRow {
  gameId: string;
  metadata: IgdbCatalogRow['metadata'];
  status: GameMetadataStatus;
  fieldsWritten: number;
  durationMs: number;
}

/** D11.1 — named high-water mark row for this sync. One cursor per source, so a
 * second bulk source (Steam, RAWG) can get its own row without colliding. */
export const IGDB_CATALOG_CURSOR_NAME = 'igdb-catalog';

export interface CatalogSyncPageStats {
  page: number;
  fetched: number;
  created: number;
  enqueuedForEnrich: number;
  skippedNoIgdbId: number;
  /** D11.2 — created rows this page reflected into Meilisearch, via one
   * batched `SearchIndexService.upsertMany` call, not one call per row. */
  reindexed: number;
  /** D11.2 — cover-image ingest jobs enqueued for created rows this page. */
  mediaQueued: number;
  /** D11.2 — `GameMetadataRun` audit rows written for created rows this page. */
  runsRecorded: number;
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
  reindexed: number;
  mediaQueued: number;
  runsRecorded: number;
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
 *
 * D11.2 — bulk-path parity with the per-game enrich worker. 11.1 shipped the
 * mirror mechanism but deliberately skipped three follow-ups the enrich path
 * (`GameMetadataService.runEnrichment`) always does for a created row: search
 * reindex, media enqueue, and run-logging. Closed here, reusing the enrich
 * path's own code rather than a second implementation:
 *  6. Search reindex is batched, not one-per-row. `SearchIndexPublisher`'s
 *     per-row `publishUpsert` (what the enrich path uses) would mean one
 *     BullMQ enqueue awaited per created game — at catalog scale (~324k rows)
 *     that serializes the whole run behind Redis round-trips. Reuses the
 *     exact batching precedent `SearchRepairService` already established for
 *     the same "one row per Meili call doesn't finish at this volume" problem
 *     (D3.25.1): one `SearchIndexService.upsertMany('game', ids)` call per
 *     page (≤500 ids), not 500 individual enqueues.
 *  7. Media is enqueued for **cover only**, eagerly; screenshots/artwork/hero
 *     are not. The enrich path's `toMediaJobs` (now shared, `metadata-merge.ts`)
 *     can request up to 1+1+4+12 = 18 media jobs per game — full parity at
 *     324k rows would mean up to ~5.8M real HTTP downloads + image-processing
 *     jobs, by far the largest cost in this phase, and the large majority of
 *     that catalog is never going to be looked at. Cover is kept eager
 *     because it is the one asset every list/grid/search-result surface in
 *     this app renders unconditionally (CLAUDE.md: geometry/rarity read off
 *     the card, which needs an image) — cutting it would make the whole
 *     mirrored catalog look broken by default. That keeps the eager cost at
 *     ~324k jobs, the same order of magnitude as the reindex, not 18x that.
 *     The rest is a real, named gap, not a silent one: those rows keep
 *     `metadataStatus complete/partial` (11.1's `hasCoreFields` gate already
 *     required media to reach `complete`, and cover alone satisfies that), so
 *     they are NOT re-selected by `GameMetadataBackfillService`'s backfill
 *     scan (pending/stale/failed only) — only the daily refresh scan
 *     (`runRefreshScan`, 500/day, 30-day staleness window) will eventually
 *     re-enrich them and, at that point, request the full media set through
 *     the ordinary enrich path. At 500/day against 324k rows that is
 *     ~648 days to reach full-catalog non-cover media — too slow to call
 *     "lazy", named here as a follow-up rather than fixed: either bump
 *     `refreshBatchSize`/`refreshIntervalDays` for catalog-sync-created rows
 *     specifically, or add a real on-first-view trigger (which the read path
 *     doesn't have today — `GamesService.getGame`'s own comment: "nothing
 *     here awaits a metadata provider").
 *  8. Run-logging reuses `repository.recordRun` exactly as the enrich path
 *     does — one `GameMetadataRun` row per created game, not a log line per
 *     game (10.7's volume rule is about `AppLogger.event`, not this audit
 *     table, which already writes one row per enrichment today). This is
 *     what makes a created row's provenance ("bulk-sync", not "backfill" or
 *     "refresh") queryable after the fact.
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
    private readonly searchIndex: SearchIndexService,
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
    let reindexed = 0;
    let mediaQueued = 0;
    let runsRecorded = 0;

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
      const pageCreatedRows: CreatedRow[] = [];

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
        if (outcome.kind === 'created') {
          pageCreated += 1;
          pageCreatedRows.push(outcome.row);
        } else if (outcome.kind === 'enqueued') {
          pageEnqueued += 1;
        }
      }

      created += pageCreated;
      enqueuedForEnrich += pageEnqueued;

      // D11.2 — page-batched follow-ups for every row created this page.
      // Reindex is one Meili call for up to `pageSize` ids (decision #6);
      // media (cover-only, decision #7) and run-logging (decision #8 — a DB
      // audit row, not a log line, so it does not trip 10.7's "no line per
      // game" rule) are per-row, same as the enrich path does per game.
      const pageReindexed = await this.reindexCreatedRows(pageCreatedRows);
      const pageMediaQueued = await this.enqueueCoverMediaAndRecordRuns(pageCreatedRows);
      const pageRunsRecorded = pageCreatedRows.length;

      reindexed += pageReindexed;
      mediaQueued += pageMediaQueued;
      runsRecorded += pageRunsRecorded;

      const stats: CatalogSyncPageStats = {
        page,
        fetched: rows.length,
        created: pageCreated,
        enqueuedForEnrich: pageEnqueued,
        skippedNoIgdbId: pageSkipped,
        reindexed: pageReindexed,
        mediaQueued: pageMediaQueued,
        runsRecorded: pageRunsRecorded,
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
        reindexed,
        mediaQueued,
        runsRecorded,
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
      reindexed,
      mediaQueued,
      runsRecorded,
    };
  }

  /** D11.2, decision #6 — one batched Meili call per page, not one per row. */
  private async reindexCreatedRows(rows: readonly CreatedRow[]): Promise<number> {
    if (rows.length === 0) {
      return 0;
    }
    try {
      return await this.searchIndex.upsertMany(
        'game',
        rows.map((row) => row.gameId),
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      // Same "recoverable via pnpm repair:index, never fail the run" posture
      // as the enrich path's own reindexForSearch.
      this.logger.event(
        'warn',
        { count: rows.length, error: message },
        'game.catalog-sync.search-reindex.failed',
      );
      return 0;
    }
  }

  /**
   * D11.2, decisions #7 and #8. Cover-only eager media enqueue (see class doc
   * for the cost math), then one `GameMetadataRun` row per created game —
   * same shape the enrich path writes, `reason: 'bulk-sync'` distinguishing
   * provenance. Combined into one per-row pass because `mediaQueued` on the
   * audit row has to reflect what was actually queued for that row.
   */
  private async enqueueCoverMediaAndRecordRuns(rows: readonly CreatedRow[]): Promise<number> {
    let totalQueued = 0;
    for (const row of rows) {
      const coverJobs = toMediaJobs(row.gameId, row.metadata, this.config).filter(
        (job) => job.kind === 'cover',
      );
      const mediaQueuedForRow = await this.publisher.enqueueMediaBatch(coverJobs);
      totalQueued += mediaQueuedForRow;

      await this.repository.recordRun({
        gameId: row.gameId,
        provider: row.metadata.provider,
        outcome: row.status === 'complete' ? 'success' : 'partial',
        reason: 'bulk-sync',
        confidence: row.metadata.confidence,
        fieldsWritten: row.fieldsWritten,
        mediaQueued: mediaQueuedForRow,
        durationMs: row.durationMs,
        error: null,
      });
    }
    return totalQueued;
  }

  private async upsertOne(
    igdbId: number,
    metadata: IgdbCatalogRow['metadata'],
  ): Promise<{ kind: 'created'; row: CreatedRow } | { kind: 'enqueued' | 'skipped' }> {
    const rowStartedAt = Date.now();
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
      return jobId === null ? { kind: 'skipped' } : { kind: 'enqueued' };
    }

    const title = metadata.title;
    if (title == null || title.trim().length === 0) {
      return { kind: 'skipped' };
    }

    const skeleton = await this.createSkeleton(title, igdbId);
    if (skeleton === null) {
      return { kind: 'skipped' };
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

    return {
      kind: 'created',
      row: {
        gameId: skeleton.id,
        metadata,
        status,
        fieldsWritten: countPopulatedFields(metadata),
        durationMs: Date.now() - rowStartedAt,
      },
    };
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
