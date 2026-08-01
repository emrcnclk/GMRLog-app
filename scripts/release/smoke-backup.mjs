#!/usr/bin/env node
/**
 * Backup / restore smoke — pg_dump then restore into a throwaway database.
 * Windows-friendly (no local gunzip / sh required).
 */

import { execSync, spawnSync } from 'node:child_process';
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { createGunzip, gzipSync } from 'node:zlib';

import { fail, log, pass } from './lib/common.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const CONTAINER = process.env.POSTGRES_CONTAINER ?? 'gmrlog-postgres';
const USER_NAME = process.env.POSTGRES_USER ?? 'gmrlog';
const DB_NAME = process.env.POSTGRES_DB ?? 'gmrlog';
const RESTORE_DB = process.env.RESTORE_DB ?? 'gmrlog_restore_smoke';

function dockerRunning(name) {
  try {
    const out = execSync(`docker inspect -f "{{.State.Running}}" ${name}`, {
      encoding: 'utf8',
    }).trim();
    return out === 'true';
  } catch {
    return false;
  }
}

async function gunzipToFile(archive, destSql) {
  await pipeline(createReadStream(archive), createGunzip(), createWriteStream(destSql));
}

async function main() {
  if (!dockerRunning(CONTAINER)) {
    fail('backup', `container ${CONTAINER} is not running`);
  }

  const outDir = path.join(repoRoot, 'backups');
  mkdirSync(outDir, { recursive: true });

  log('backup', 'running pg_dump via docker exec');
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d+Z$/, 'Z');
  const archive = path.join(outDir, `gmrlog-${stamp}.sql.gz`);
  const sqlPath = path.join(outDir, `gmrlog-${stamp}.sql`);

  const dump = spawnSync('docker', ['exec', '-i', CONTAINER, 'pg_dump', '-U', USER_NAME, DB_NAME], {
    encoding: 'buffer',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (dump.status !== 0) {
    fail('backup', dump.stderr?.toString() || 'pg_dump failed');
  }
  writeFileSync(archive, gzipSync(dump.stdout));
  if (!existsSync(archive) || dump.stdout.length < 32) {
    fail('backup', 'empty dump');
  }
  log('backup', `written ${archive} (${dump.stdout.length} bytes)`);
  pass('backup');

  await gunzipToFile(archive, sqlPath);

  log('restore', `into ${RESTORE_DB}`);
  execSync(
    `docker exec -i ${CONTAINER} psql -U ${USER_NAME} -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS ${RESTORE_DB};"`,
    { stdio: 'inherit' },
  );
  execSync(
    `docker exec -i ${CONTAINER} psql -U ${USER_NAME} -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${RESTORE_DB};"`,
    { stdio: 'inherit' },
  );

  const sqlBytes = readFileSync(sqlPath);
  const restoreRun = spawnSync(
    'docker',
    ['exec', '-i', CONTAINER, 'psql', '-U', USER_NAME, '-d', RESTORE_DB, '-v', 'ON_ERROR_STOP=1'],
    { input: sqlBytes, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  if (restoreRun.status !== 0) {
    fail('restore', restoreRun.stderr || restoreRun.stdout || 'psql restore failed');
  }

  const verify = execSync(
    `docker exec -i ${CONTAINER} psql -U ${USER_NAME} -d ${RESTORE_DB} -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"`,
    { encoding: 'utf8' },
  ).trim();
  if (!verify || Number(verify) < 1) {
    fail('restore', `no public tables (count=${verify})`);
  }
  log('restore', `public tables=${verify}`);
  pass('restore');

  execSync(
    `docker exec -i ${CONTAINER} psql -U ${USER_NAME} -d postgres -c "DROP DATABASE IF EXISTS ${RESTORE_DB};"`,
    { stdio: 'inherit' },
  );

  try {
    unlinkSync(sqlPath);
  } catch {
    /* ignore */
  }

  console.log('SMOKE_BACKUP PASS');
}

main().catch((error) => {
  console.error('SMOKE_BACKUP FAIL');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
