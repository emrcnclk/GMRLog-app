#!/usr/bin/env node
/**
 * Bug 4 — gate `pnpm docker:prod:up` on a real environment file.
 *
 * `docker:prod:up` used to pass `--env-file .env.production.example` directly,
 * so the production-parity stack booted with the placeholder values checked
 * into the repo: Postgres as gmrlog/gmrlog, MinIO as gmrlog/gmrlogsecret,
 * Meilisearch on the shared dev master key, and a JWT secret whose literal text
 * is "replace-with-a-long-random-secret". Anyone who copied that command to a
 * real host inherited every one of them.
 *
 * The stack now reads `.env.production.local`, which is gitignored and does not
 * exist until someone writes it. This script refuses to start until that file
 * is present, complete, and free of the placeholder values.
 *
 * Usage: pnpm docker:prod:up   (runs automatically)
 *        pnpm docker:prod:init (writes the starter file)
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const envPath = join(root, 'infrastructure', 'docker', '.env.production.local');

/** Every key the prod overlay dereferences with `:?` or relies on for a secret. */
const REQUIRED_KEYS = [
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DB',
  'JWT_SECRET',
  'MINIO_ROOT_USER',
  'MINIO_ROOT_PASSWORD',
  'MEILI_API_KEY',
  'CORS_ORIGINS',
  'STEAM_WEB_API_KEY',
];

/**
 * Values that ship in `.env.production.example`. They are placeholders, and a
 * placeholder that happens to work is exactly how a weak secret reaches
 * production, so they are rejected by value rather than merely warned about.
 */
const PLACEHOLDER_VALUES = new Map([
  ['POSTGRES_PASSWORD', ['gmrlog', 'postgres', 'password']],
  ['MINIO_ROOT_PASSWORD', ['gmrlogsecret', 'minioadmin', 'password']],
  ['MEILI_API_KEY', ['gmrlog-dev-master-key']],
  ['JWT_SECRET', ['replace-with-a-long-random-secret-at-least-32-chars']],
  ['PGADMIN_DEFAULT_PASSWORD', ['admin']],
]);

/** Minimum length for anything that is meant to be unguessable. */
const SECRET_MIN_LENGTH = new Map([
  ['JWT_SECRET', 32],
  ['POSTGRES_PASSWORD', 16],
  ['MINIO_ROOT_PASSWORD', 16],
  ['MEILI_API_KEY', 16],
]);

function parseEnvFile(text) {
  const values = new Map();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values.set(key, value);
  }
  return values;
}

function fail(lines) {
  console.error('\nRefusing to start the production stack:\n');
  for (const line of lines) console.error(`  - ${line}`);
  console.error(
    '\nEdit infrastructure/docker/.env.production.local and try again.' +
      '\nRun `pnpm docker:prod:init` to create it from the example.\n',
  );
  process.exit(1);
}

if (!existsSync(envPath)) {
  fail([
    'infrastructure/docker/.env.production.local does not exist.',
    'It is gitignored on purpose — production secrets never live in the repo.',
  ]);
}

const env = parseEnvFile(readFileSync(envPath, 'utf8'));
const problems = [];

for (const key of REQUIRED_KEYS) {
  const value = env.get(key);
  if (value === undefined || value.length === 0) {
    problems.push(`${key} is missing or empty.`);
    continue;
  }

  const placeholders = PLACEHOLDER_VALUES.get(key) ?? [];
  if (placeholders.includes(value)) {
    problems.push(`${key} is still the example placeholder value.`);
    continue;
  }

  const minLength = SECRET_MIN_LENGTH.get(key);
  if (minLength !== undefined && value.length < minLength) {
    problems.push(`${key} is shorter than ${String(minLength)} characters.`);
  }
}

// Checked separately: pgAdmin is behind the `tools` profile and does not run in
// this stack, but a weak password here means a weak one in the dev stack too.
const pgadminPassword = env.get('PGADMIN_DEFAULT_PASSWORD');
if (pgadminPassword !== undefined && pgadminPassword === 'admin') {
  problems.push('PGADMIN_DEFAULT_PASSWORD is still "admin".');
}

if (problems.length > 0) {
  fail(problems);
}

console.log('Production env preflight passed (.env.production.local).');
