/**
 * Release verification against real PostgreSQL 17 (MIGRATION_VERIFICATION_POLICY).
 *
 * Preferred path: `docker compose -f infrastructure/docker/docker-compose.yml up -d`
 * and point GMRLOG_PG_VALIDATION_URL at that server. When Docker is unavailable
 * (this script's default), it boots the same PostgreSQL 17 major line via
 * embedded native binaries — a real server process, not an emulation — then:
 *
 *   1. runs `prisma migrate dev` against a completely empty database,
 *   2. runs `prisma generate`,
 *   3. runs the full persistence test suite with GMRLOG_TEST_DATABASE_URL set,
 *      so every spec executes against real PostgreSQL instead of PGlite.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import EmbeddedPostgres from 'embedded-postgres';

const packageRoot = join(fileURLToPath(import.meta.url), '..', '..');
const PORT = Number(process.env.GMRLOG_PG_VALIDATION_PORT ?? 5433);
const DB_NAME = 'gmrlog_validation';

function run(title, command, args, env) {
  console.log(`\n=== ${title} ===`);
  const result = spawnSync(command, args, {
    cwd: packageRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    throw new Error(`${title} failed with exit code ${String(result.status)}`);
  }
}

async function main() {
  const externalUrl = process.env.GMRLOG_PG_VALIDATION_URL;
  let pg = null;
  let dataDir = null;
  let databaseUrl = externalUrl;

  if (externalUrl) {
    console.log(`Using external PostgreSQL: ${externalUrl}`);
  } else {
    dataDir = mkdtempSync(join(tmpdir(), 'gmrlog-pg-validate-'));
    pg = new EmbeddedPostgres({
      databaseDir: dataDir,
      user: 'gmrlog',
      password: 'gmrlog',
      port: PORT,
      persistent: false,
    });
    console.log(`Starting embedded PostgreSQL 17 on port ${String(PORT)} (data: ${dataDir})…`);
    await pg.initialise();
    await pg.start();
    await pg.createDatabase(DB_NAME);
    databaseUrl = `postgresql://gmrlog:gmrlog@localhost:${String(PORT)}/${DB_NAME}?schema=public`;
  }

  try {
    run(
      'prisma migrate dev (empty real PostgreSQL)',
      'pnpm',
      ['exec', 'prisma', 'migrate', 'dev', '--skip-generate', '--skip-seed'],
      {
        DATABASE_URL: databaseUrl,
      },
    );
    run('prisma generate', 'pnpm', ['exec', 'prisma', 'generate'], {
      DATABASE_URL: databaseUrl,
    });
    run('persistence test suite (real PostgreSQL)', 'pnpm', ['exec', 'vitest', 'run'], {
      GMRLOG_TEST_DATABASE_URL: databaseUrl,
    });
    console.log('\nReal PostgreSQL validation PASSED.');
  } finally {
    if (pg) {
      await pg.stop();
    }
    if (dataDir) {
      rmSync(dataDir, { recursive: true, force: true });
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
