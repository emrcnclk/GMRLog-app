import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestDatabase, readMigrationScripts, type TestDatabase } from './db-harness';

let db: TestDatabase;

beforeAll(async () => {
  db = await createTestDatabase();
});

afterAll(async () => {
  await db.close();
});

describe('initial migration', () => {
  it('ships at least one migration script that creates the core tables', () => {
    const scripts = readMigrationScripts();
    expect(scripts.length).toBeGreaterThanOrEqual(1);
    const combined = scripts.join('\n');
    expect(combined).toContain('CREATE TABLE "users"');
    expect(combined).toContain('CREATE TABLE "games"');
    expect(combined).toContain('CREATE TYPE "library_status"');
  });

  it('applies cleanly to an empty database (schema is queryable)', async () => {
    // Harness construction already applied the migration on a fresh database
    // (PGlite locally, real PostgreSQL when GMRLOG_TEST_DATABASE_URL is set).
    await expect(db.prisma.user.findMany()).resolves.toEqual([]);
    await expect(db.prisma.game.findMany()).resolves.toEqual([]);
  });

  it('materializes the full S2 entity catalog as tables', async () => {
    const rows = await db.prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*)::bigint AS count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> '_prisma_migrations'`,
    );
    // 86 tables as of 12.4 (adds 1: user_consents — proof of what a player was
    // shown and what they decided, TASKS.md §12.4). Was 85 as of D11.1 (adds 1:
    // sync_cursors — the bulk catalog sync's durable high-water mark). Was 84 as
    // of D3.25 (adds 7: game_series, tags, game_tags, companies, game_companies,
    // game_related_games, game_metadata_runs).
    // Bump deliberately when a sprint lands new tables — an unexpected change
    // here means a migration added or dropped something unreviewed.
    expect(Number(rows[0]?.count)).toBe(86);
  });

  // 12.4 — TASKS.md Phase 12. The consent record is evidence, so its shape is
  // asserted rather than left to the table count above.
  it('materializes the 12.4 consent record with a version-scoped unique key', async () => {
    const columns = await db.prisma.$queryRawUnsafe<{ column_name: string }[]>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'user_consents'`,
    );
    expect(columns.map((row) => row.column_name).sort()).toEqual([
      'consent_key',
      'created_at',
      'decided_at',
      'decision',
      'document_id',
      'id',
      'locale',
      'updated_at',
      'user_id',
      'version',
    ]);

    // The version belongs in the key: accepting 1.0.0 says nothing about 1.1.0,
    // and a key without it would carry an old acceptance silently forward.
    const indexes = await db.prisma.$queryRawUnsafe<{ indexdef: string }[]>(
      `SELECT indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'user_consents'`,
    );
    // The primary key is a unique index too, so exclude it rather than taking
    // whichever the catalog happens to return first.
    const unique = indexes.find(
      (row) => row.indexdef.includes('UNIQUE') && !row.indexdef.includes('_pkey'),
    );
    expect(unique?.indexdef).toContain('user_id');
    expect(unique?.indexdef).toContain('document_id');
    expect(unique?.indexdef).toContain('version');

    // A decision, not a boolean — `declined` is what makes a refusal
    // distinguishable from never having been asked.
    const decisions = await db.prisma.$queryRawUnsafe<{ enumlabel: string }[]>(
      `SELECT enumlabel FROM pg_enum e
       JOIN pg_type t ON t.oid = e.enumtypid
       WHERE t.typname = 'ConsentDecision' ORDER BY e.enumsortorder`,
    );
    expect(decisions.map((row) => row.enumlabel)).toEqual(['accepted', 'declined', 'withdrawn']);
  });

  // D3.25 — docs/18_CATALOG/GAME_METADATA_ARCHITECTURE.md §3.2
  it('materializes the D3.25 catalog metadata tables', async () => {
    const rows = await db.prisma.$queryRawUnsafe<{ table_name: string }[]>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
         AND table_name IN ('game_series','tags','game_tags','companies','game_companies','game_related_games','game_metadata_runs')
       ORDER BY table_name`,
    );

    expect(rows.map((row) => row.table_name)).toEqual([
      'companies',
      'game_companies',
      'game_metadata_runs',
      'game_related_games',
      'game_series',
      'game_tags',
      'tags',
    ]);
  });

  it('adds the D3.25 catalog columns to games without dropping anything', async () => {
    const rows = await db.prisma.$queryRawUnsafe<{ column_name: string }[]>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'games'
       ORDER BY column_name`,
    );
    const columns = rows.map((row) => row.column_name);

    // Additive: pre-D3.25 columns survive...
    expect(columns).toEqual(
      expect.arrayContaining(['id', 'title', 'slug', 'cover_key', 'release_date', 'franchise_id']),
    );
    // ...alongside the new catalog metadata.
    expect(columns).toEqual(
      expect.arrayContaining([
        'igdb_id',
        'steam_app_id',
        'rawg_id',
        'summary',
        'description',
        'hero_key',
        'trailer_url',
        'series_id',
        'metadata_status',
        'metadata_provider',
        'metadata_version',
        'metadata_refreshed_at',
        'metadata_attempts',
        'metadata_error',
      ]),
    );
  });
});
