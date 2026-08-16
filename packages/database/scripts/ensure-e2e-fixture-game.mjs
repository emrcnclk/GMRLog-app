#!/usr/bin/env node
/**
 * 10.4 — the log-a-game E2E flow needs one real, discoverable game to exist.
 * Local dev databases already carry ~100k real rows (9.5b's backfill); a
 * fresh CI Postgres, migrated from empty, has none — there is no seed script
 * anywhere in this repo, because the catalog is normally populated by the
 * IGDB/Steam ingestion pipeline, not by a fixture. Idempotent (upsert by
 * slug), safe to run against a database that already has real games — it
 * only ever adds the one row it needs, never removes or alters anything else.
 *
 * Usage: pnpm --filter @gmrlog/database run fixture:e2e-game
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SLUG = 'e2e-fixture-game';

try {
  await prisma.game.upsert({
    where: { slug: SLUG },
    update: {},
    create: {
      title: 'E2E Fixture Game',
      slug: SLUG,
      metadataStatus: 'complete',
    },
  });
  console.log(`Fixture game "${SLUG}" ready.`);
} finally {
  await prisma.$disconnect();
}
