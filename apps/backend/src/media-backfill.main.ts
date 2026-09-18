import 'reflect-metadata';

import { setServers } from 'node:dns';

import { NestFactory } from '@nestjs/core';
import { Agent, setGlobalDispatcher } from 'undici';

import { GameMediaBackfillService } from './games/metadata/game-media-backfill.service';
import { MetadataModule } from './games/metadata/metadata.module';
import { loadBackendDotenv } from './infrastructure/config/load-dotenv';
import { AppLogger } from './infrastructure/logging/app-logger.service';

loadBackendDotenv();

// Same scoped dev-environment workaround as `catalog-sync.main.ts`, for the
// same two hosts: `id.twitch.tv` and `api.igdb.com` resolve and connect
// flakily from this machine. This entrypoint only; the API and worker
// processes keep their own DNS and dispatcher behaviour.
setServers(['8.8.8.8', '1.1.1.1']);
setGlobalDispatcher(new Agent({ connect: { timeout: 30_000 } }));

/**
 * `pnpm --filter backend run media:backfill -- <link|repair> [maxBatches]`.
 *
 * - `link` asks IGDB for the cover, artworks and screenshots of every catalog
 *   game and records them as URL references — nothing is downloaded. The
 *   catalog's media model since 2026-09 (METADATA_LICENSING.md §5).
 * - `repair` HEADs every *stored* provider row's object and re-enqueues the
 *   missing ones as forced download jobs, rewriting the same keys. Referenced
 *   rows are skipped.
 */
async function bootstrap(): Promise<void> {
  const mode = process.argv[2];
  const maxBatchesArg = process.argv[3];
  const maxBatches = maxBatchesArg === undefined ? undefined : Number.parseInt(maxBatchesArg, 10);

  if ((mode !== 'link' && mode !== 'repair') || (maxBatches !== undefined && !(maxBatches > 0))) {
    console.error('Usage: media-backfill.main.js <link|repair> [maxBatches]');
    process.exitCode = 1;
    return;
  }

  const app = await NestFactory.createApplicationContext(MetadataModule, { bufferLogs: true });
  const logger = app.get(AppLogger);
  app.useLogger(logger);
  const backfill = app.get(GameMediaBackfillService);

  if (mode === 'link') {
    console.log('batch\tscanned\tigdb\tlinked\tinserted\tcovers\theroes');
    const stats = await backfill.linkProviderMedia({
      ...(maxBatches === undefined ? {} : { maxBatches }),
      onBatch: (b) => {
        console.log(
          [
            b.batch,
            b.scanned,
            b.answeredByIgdb,
            b.linked,
            b.inserted,
            b.coversSet,
            b.heroesSet,
          ].join('\t'),
        );
      },
    });
    console.log(
      `\nTotals: scanned=${String(stats.scanned)} linked=${String(stats.linked)} ` +
        `inserted=${String(stats.inserted)} coversSet=${String(stats.coversSet)} ` +
        `heroesSet=${String(stats.heroesSet)} wallMs=${String(stats.wallMs)}`,
    );
  } else {
    console.log('batch\tchecked\tmissing\tqueued\tnoProvider');
    const stats = await backfill.repairMissingObjects({
      ...(maxBatches === undefined ? {} : { maxBatches }),
      onBatch: (b) => {
        console.log([b.batch, b.checked, b.missing, b.queued, b.skippedNoProvider].join('\t'));
      },
    });
    console.log(
      `\nTotals: checked=${String(stats.checked)} missing=${String(stats.missing)} ` +
        `queued=${String(stats.queued)} skippedNoProvider=${String(stats.skippedNoProvider)} ` +
        `wallMs=${String(stats.wallMs)}`,
    );
  }

  await app.close();
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
