import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { loadBackendDotenv } from './infrastructure/config/load-dotenv';
import { AppLogger } from './infrastructure/logging/app-logger.service';
import { SearchRepairModule } from './infrastructure/search/search-repair.module';
import { SearchRepairService } from './infrastructure/search/search-repair.service';

loadBackendDotenv();

/**
 * `pnpm repair:index` (D3.25.1 — docs/18_CATALOG/CATALOG_OPERATIONS.md).
 * One-shot: reconciles every Meilisearch index against Postgres, prints a
 * summary, exits. Read-only on Postgres; writes only to Meilisearch.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(SearchRepairModule, {
    bufferLogs: true,
  });

  const logger = app.get(AppLogger);
  app.useLogger(logger);

  const repair = app.get(SearchRepairService);
  const results = await repair.repairAll();

  let totalUpserted = 0;
  let totalOrphansRemoved = 0;
  let totalErrors = 0;

  console.log('\n=== pnpm repair:index — PostgreSQL ↔ Meilisearch ===\n');
  console.log(['type', 'postgres', 'upserted', 'orphans removed', 'errors'].join('\t'));
  for (const result of results) {
    console.log(
      [
        result.type,
        result.postgresActiveCount,
        result.upserted,
        result.orphansRemoved,
        result.upsertErrors + result.orphanErrors,
      ].join('\t'),
    );
    totalUpserted += result.upserted;
    totalOrphansRemoved += result.orphansRemoved;
    totalErrors += result.upsertErrors + result.orphanErrors;
  }
  console.log(
    `\nTotals: upserted=${String(totalUpserted)} orphansRemoved=${String(totalOrphansRemoved)} errors=${String(totalErrors)}\n`,
  );

  await app.close();
  process.exitCode = totalErrors > 0 ? 1 : 0;
}

void bootstrap();
