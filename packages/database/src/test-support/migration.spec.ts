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
    // 84 tables as of D3.25 (adds 7: game_series, tags, game_tags, companies,
    // game_companies, game_related_games, game_metadata_runs).
    // Bump deliberately when a sprint lands new tables — an unexpected change
    // here means a migration added or dropped something unreviewed.
    expect(Number(rows[0]?.count)).toBe(84);
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
