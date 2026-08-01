import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { PrismaClient } from '@prisma/client';
import { Client } from 'pg';
import { PrismaPGlite } from 'pglite-prisma-adapter';

/**
 * Persistence test harness. Two modes, one contract:
 *
 * - Default (development verification): in-process PGlite (WASM PostgreSQL).
 *   No Docker, no external DB — fast local runs.
 * - `GMRLOG_TEST_DATABASE_URL` set (release verification): a real PostgreSQL
 *   server. The public schema is dropped and rebuilt from the same
 *   `prisma/migrations/*` SQL, so the identical suite runs on real Postgres.
 *
 * Applying the migration scripts to a clean database doubles as the migration
 * test: if `0_init` cannot build the schema on an empty database, harness
 * construction fails. See docs/07_DATABASE/MIGRATION_VERIFICATION_POLICY.md.
 */
export interface TestDatabase {
  prisma: PrismaClient;
  close: () => Promise<void>;
}

function migrationsDir(): string {
  // src/test-support -> package root -> prisma/migrations
  return join(__dirname, '..', '..', 'prisma', 'migrations');
}

/** Ordered list of migration.sql scripts, lexicographically by folder name. */
export function readMigrationScripts(): string[] {
  const dir = migrationsDir();
  return readdirSync(dir)
    .filter((entry) => statSync(join(dir, entry)).isDirectory())
    .sort()
    .map((entry) => join(dir, entry, 'migration.sql'))
    .filter((file) => existsSync(file))
    .map((file) => readFileSync(file, 'utf-8'));
}

async function createPgliteDatabase(): Promise<TestDatabase> {
  const pglite = new PGlite();
  for (const sql of readMigrationScripts()) {
    await pglite.exec(sql);
  }

  // pglite-prisma-adapter bundles its own driver-adapter-utils copy; the runtime
  // contract matches but the duplicated type identity does not. Assert at this
  // single test-only boundary (the adapter is exercised for real by every spec).
  const adapter = new PrismaPGlite(pglite);
  const prisma = new PrismaClient({
    adapter,
  } as unknown as ConstructorParameters<typeof PrismaClient>[0]);
  await prisma.$connect();

  return {
    prisma,
    async close() {
      await prisma.$disconnect();
      await pglite.close();
    },
  };
}

async function createPostgresDatabase(databaseUrl: string): Promise<TestDatabase> {
  // node-postgres simple-query protocol accepts multi-statement scripts,
  // so the real migration.sql files run unmodified against real PostgreSQL.
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
    for (const sql of readMigrationScripts()) {
      await client.query(sql);
    }
  } finally {
    await client.end();
  }

  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  await prisma.$connect();

  return {
    prisma,
    async close() {
      await prisma.$disconnect();
    },
  };
}

export async function createTestDatabase(): Promise<TestDatabase> {
  const databaseUrl = process.env.GMRLOG_TEST_DATABASE_URL;
  if (databaseUrl !== undefined && databaseUrl !== '') {
    return createPostgresDatabase(databaseUrl);
  }
  return createPgliteDatabase();
}
