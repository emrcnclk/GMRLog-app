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
 * `pnpm --filter backend run media:backfill -- <banners|repair> [maxBatches]`.
 *
 * - `banners` asks IGDB for artworks and screenshots of every game that has
 *   neither a hero nor a screenshot yet, and enqueues one banner per game.
 * - `repair` HEADs every provider media row's object and re-enqueues the
 *   missing ones as forced jobs, rewriting the same keys.
 *
 * Both only enqueue. The media worker (`pnpm --filter backend run worker`)
 * does the downloading, so this finishes in minutes while the downloads take
 * as long as the connection and `GAME_MEDIA_WORKER_CONCURRENCY` allow.
 */
async function bootstrap(): Promise<void> {
  const mode = process.argv[2];
  const maxBatchesArg = process.argv[3];
  const maxBatches = maxBatchesArg === undefined ? undefined : Number.parseInt(maxBatchesArg, 10);

  if (
    (mode !== 'banners' && mode !== 'repair') ||
    (maxBatches !== undefined && !(maxBatches > 0))
  ) {
    console.error('Usage: media-backfill.main.js <banners|repair> [maxBatches]');
    process.exitCode = 1;
    return;
  }

  const app = await NestFactory.createApplicationContext(MetadataModule, { bufferLogs: true });
  const logger = app.get(AppLogger);
  app.useLogger(logger);
  const backfill = app.get(GameMediaBackfillService);

  if (mode === 'banners') {
    console.log('batch\tscanned\tigdb\thero\tscreenshot\tnoSource');
    const stats = await backfill.enqueueBanners({
      ...(maxBatches === undefined ? {} : { maxBatches }),
      onBatch: (b) => {
        console.log(
          [b.batch, b.scanned, b.answeredByIgdb, b.heroQueued, b.screenshotQueued, b.noSource].join(
            '\t',
          ),
        );
      },
    });
    console.log(
      `\nTotals: scanned=${String(stats.scanned)} heroQueued=${String(stats.heroQueued)} ` +
        `screenshotQueued=${String(stats.screenshotQueued)} noSource=${String(stats.noSource)} ` +
        `wallMs=${String(stats.wallMs)}`,
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
