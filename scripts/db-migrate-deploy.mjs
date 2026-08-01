#!/usr/bin/env node
/**
 * Apply pending Prisma migrations with DATABASE_URL from the monorepo root `.env`.
 *
 * Prisma does not load root `.env` when run via `pnpm --filter @gmrlog/database exec`
 * (cwd is packages/database). This wrapper mirrors backend dotenv loading:
 * copy `.env.example` → `.env` at repo root, or export DATABASE_URL.
 *
 * Usage: pnpm db:migrate:deploy
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envFile = join(root, '.env');

if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

if (!process.env.DATABASE_URL?.trim()) {
  console.error(
    'DATABASE_URL is required. Copy root .env.example to .env, or export DATABASE_URL.',
  );
  process.exit(1);
}

const result = spawnSync(
  'pnpm',
  ['--filter', '@gmrlog/database', 'exec', 'prisma', 'migrate', 'deploy'],
  {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  },
);

process.exit(result.status ?? 1);
