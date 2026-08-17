import 'reflect-metadata';

import { setServers } from 'node:dns';

import { NestFactory } from '@nestjs/core';
import { Agent, setGlobalDispatcher } from 'undici';

import { GameCatalogSyncService } from './games/metadata/game-catalog-sync.service';
import { MetadataModule } from './games/metadata/metadata.module';
import { loadBackendDotenv } from './infrastructure/config/load-dotenv';
import { AppLogger } from './infrastructure/logging/app-logger.service';

loadBackendDotenv();

// D11.1 dev-environment workaround, this script only: the local resolver
// intermittently timed out resolving `id.twitch.tv` (10s connect timeout,
// confirmed by direct-IP curl succeeding while hostname curl did not) while
// resolving everything else fine. Pointing this one-shot process at public
// DNS avoids retrying the whole bounded run over a resolver flake unrelated
// to IGDB itself. Scoped to this entrypoint only — never touches the main
// API/worker process's DNS behaviour.
setServers(['8.8.8.8', '1.1.1.1']);
// Same rationale, same scope: the sandbox's outbound TCP connect to
// id.twitch.tv/api.igdb.com is flaky (observed ~25% success at a 6-10s
// connect timeout via both curl and undici, not specific to either tool),
// so a longer connect timeout materially raises the odds of a given attempt
// landing without changing what's requested.
setGlobalDispatcher(new Agent({ connect: { timeout: 30_000 } }));

/**
 * `pnpm --filter backend run catalog:sync -- <maxPages> [pageSize]` (D11.1 —
 * TASKS.md §11.1). One-shot: walks up to `maxPages` pages of IGDB's catalog
 * from the persisted cursor, upserts, advances the cursor, prints a summary,
 * exits. This is the operator-facing trigger for `GameCatalogSyncService` —
 * the same class `GameCatalogSyncProcessor` calls when a run is enqueued onto
 * `QUEUE_GAME_CATALOG_SYNC` instead of invoked directly, matching
 * `repair-index.main.ts`'s precedent for a one-shot catalog operation.
 *
 * Deliberately NOT the default operating mode: a full sync is a queue job
 * (see `GameMetadataPublisher.enqueueCatalogSync`), scheduled like the
 * existing backfill/refresh scans. This entrypoint exists for a bounded,
 * manually-triggered run — proving the mechanism and, later, ops backfills.
 */
async function bootstrap(): Promise<void> {
  const maxPages = Number.parseInt(process.argv[2] ?? '2', 10);
  const pageSizeArg = process.argv[3];
  const pageSize = pageSizeArg === undefined ? undefined : Number.parseInt(pageSizeArg, 10);

  if (!Number.isFinite(maxPages) || maxPages <= 0) {
    console.error('Usage: catalog-sync.main.js <maxPages> [pageSize]');
    process.exitCode = 1;
    return;
  }

  const app = await NestFactory.createApplicationContext(MetadataModule, { bufferLogs: true });
  const logger = app.get(AppLogger);
  app.useLogger(logger);

  const sync = app.get(GameCatalogSyncService);
  const stats = await sync.syncPages(maxPages, pageSize);

  console.log('\n=== catalog-sync (D11.1 — IGDB catalog mirror) ===\n');
  console.log(['page', 'fetched', 'created', 'enqueuedForEnrich', 'skippedNoIgdbId'].join('\t'));
  for (const page of stats.pages) {
    console.log(
      [page.page, page.fetched, page.created, page.enqueuedForEnrich, page.skippedNoIgdbId].join(
        '\t',
      ),
    );
  }
  console.log(
    `\nTotals: pagesFetched=${String(stats.pagesFetched)} rawFetched=${String(stats.rawFetched)} ` +
      `created=${String(stats.created)} enqueuedForEnrich=${String(stats.enqueuedForEnrich)} ` +
      `cursor ${String(stats.cursorBefore)} -> ${String(stats.cursorAfter)} wallMs=${String(stats.wallMs)}\n`,
  );

  await app.close();
  process.exitCode = 0;
}

void bootstrap();
