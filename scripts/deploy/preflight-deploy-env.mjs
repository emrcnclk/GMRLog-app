#!/usr/bin/env node
/**
 * Gate the remote production stack on a complete, non-placeholder environment
 * file, the same way `scripts/docker/preflight-prod-env.mjs` gates the local
 * production-parity stack.
 *
 * The two are separate on purpose rather than shared: the local stack is allowed
 * to talk to Mailpit and to answer on `localhost`, and this one is not. Merging
 * them would mean relaxing every check here to whatever the laptop stack needs.
 *
 * Usage: node scripts/deploy/preflight-deploy-env.mjs [path-to-env-file]
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const envPath = process.argv[2] ?? join(root, 'infrastructure', 'deploy', '.env.deploy.local');

/** Every key the deploy compose dereferences with `:?`, plus the ones a working product needs. */
const REQUIRED_KEYS = [
  'API_DOMAIN',
  'LETSENCRYPT_EMAIL',
  'GMRLOG_IMAGE',
  'CORS_ORIGINS',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DB',
  'JWT_SECRET',
  'MEILI_API_KEY',
  'MINIO_ROOT_USER',
  'MINIO_ROOT_PASSWORD',
  'S3_BUCKET',
  'SMTP_HOST',
  'SMTP_FROM',
  'PASSWORD_RESET_URL_BASE',
  // Bug 3 — with no key the Steam client silently falls back to the mock, and
  // the product serves fixture libraries as though they were real player data.
  'STEAM_WEB_API_KEY',
];

const SECRET_MIN_LENGTH = new Map([
  ['JWT_SECRET', 32],
  ['POSTGRES_PASSWORD', 16],
  ['MINIO_ROOT_PASSWORD', 16],
  ['MEILI_API_KEY', 16],
]);

/**
 * Rejected by value: a placeholder that happens to work is how a weak secret
 * reaches production. Keyed per variable rather than a flat list, because
 * `gmrlog` is a weak password and a perfectly good database name — a global
 * denylist rejects POSTGRES_USER, POSTGRES_DB, MINIO_ROOT_USER and S3_BUCKET
 * for holding the value they are supposed to hold.
 */
const PLACEHOLDERS = new Map([
  ['POSTGRES_PASSWORD', ['CHANGE_ME', 'gmrlog', 'postgres', 'password']],
  ['MINIO_ROOT_PASSWORD', ['CHANGE_ME', 'gmrlogsecret', 'minioadmin', 'password']],
  ['MEILI_API_KEY', ['CHANGE_ME', 'gmrlog-dev-master-key']],
  ['JWT_SECRET', ['CHANGE_ME', 'replace-with-a-long-random-secret-at-least-32-chars']],
  ['METRICS_TOKEN', ['CHANGE_ME']],
  ['STEAM_WEB_API_KEY', ['CHANGE_ME']],
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

if (!existsSync(envPath)) {
  console.error(
    `\nRefusing to deploy: ${envPath} does not exist.\n` +
      '\nIt is gitignored on purpose — production secrets never live in the repo.\n' +
      'Create it with:\n' +
      '  node scripts/deploy/gen-secrets.mjs --domain <api-hostname> --email <email>\n',
  );
  process.exit(1);
}

const env = parseEnvFile(readFileSync(envPath, 'utf8'));
const problems = [];
const warnings = [];

for (const key of REQUIRED_KEYS) {
  const value = env.get(key);
  if (value === undefined || value.length === 0) {
    problems.push(`${key} is missing or empty.`);
    continue;
  }
  if ((PLACEHOLDERS.get(key) ?? []).includes(value)) {
    problems.push(`${key} is still a template placeholder.`);
    continue;
  }
  const minLength = SECRET_MIN_LENGTH.get(key);
  if (minLength !== undefined && value.length < minLength) {
    problems.push(`${key} is shorter than ${String(minLength)} characters.`);
  }
}

const domain = env.get('API_DOMAIN') ?? '';
if (domain.includes('example.com') || domain === 'localhost') {
  problems.push('API_DOMAIN is still the example hostname.');
}
if (domain.includes('://') || domain.includes('/')) {
  problems.push(
    'API_DOMAIN must be a bare hostname, not a URL (nginx and certbot both take a name).',
  );
}

const email = env.get('LETSENCRYPT_EMAIL') ?? '';
if (email.includes('example.com')) {
  problems.push(
    'LETSENCRYPT_EMAIL is still the example address — expiry warnings would go nowhere.',
  );
}

const image = env.get('GMRLOG_IMAGE') ?? '';
if (image.includes('OWNER') || image.includes('REPO')) {
  problems.push('GMRLOG_IMAGE still contains the OWNER/REPO placeholder.');
}

for (const origin of (env.get('CORS_ORIGINS') ?? '').split(',')) {
  const trimmed = origin.trim();
  if (trimmed.length === 0) continue;
  if (!trimmed.startsWith('https://')) {
    problems.push(`CORS_ORIGINS entry "${trimmed}" is not https.`);
  }
  if (trimmed.endsWith('/')) {
    problems.push(
      `CORS_ORIGINS entry "${trimmed}" has a trailing slash; origins are compared exactly.`,
    );
  }
}

// Mailpit has no auth and no delivery. Pointing production at it means password
// reset mails vanish silently — the failure looks like a broken reset token.
const smtpHost = env.get('SMTP_HOST') ?? '';
if (['mailpit', 'localhost', '127.0.0.1'].includes(smtpHost)) {
  problems.push(
    `SMTP_HOST is "${smtpHost}" — that is the development mail catcher, not a delivery provider.`,
  );
}
if (smtpHost.includes('example.com')) {
  problems.push('SMTP_HOST is still the example host.');
}

const resetBase = env.get('PASSWORD_RESET_URL_BASE') ?? '';
if (!resetBase.startsWith('https://')) {
  problems.push('PASSWORD_RESET_URL_BASE must be https — the token travels in that link.');
}

if ((env.get('SENTRY_DSN') ?? '').length === 0) {
  warnings.push(
    'SENTRY_DSN is empty: main.ts skips Sentry.init entirely, so there is no error reporting.',
  );
}
if ((env.get('METRICS_TOKEN') ?? '').length === 0) {
  warnings.push('METRICS_TOKEN is empty: /api/v1/metrics is unauthenticated.');
}
if ((env.get('BACKUP_S3_TARGET') ?? '').length === 0) {
  warnings.push('BACKUP_S3_TARGET is empty: backups stay on this host only.');
}
if (env.get('LETSENCRYPT_STAGING') === '1') {
  warnings.push('LETSENCRYPT_STAGING=1: the certificate will not be trusted by browsers.');
}

for (const warning of warnings) {
  console.warn(`  warn: ${warning}`);
}

if (problems.length > 0) {
  console.error('\nRefusing to deploy:\n');
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(`\nEdit ${envPath} and try again.\n`);
  process.exit(1);
}

console.log(`\n${envPath} looks deployable.\n`);
