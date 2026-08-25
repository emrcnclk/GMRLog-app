#!/usr/bin/env node
/**
 * Write `infrastructure/deploy/.env.deploy.local` from the template, with every
 * generated secret actually generated.
 *
 * The failure this prevents is the one `scripts/docker/preflight-prod-env.mjs`
 * was written for a second time: a template full of placeholders is copied to a
 * host, the placeholders "work", and the box runs on a JWT secret whose literal
 * text is in the repository. Here the placeholders are replaced before the file
 * is ever readable, so the weak values never exist.
 *
 * Usage:
 *   node scripts/deploy/gen-secrets.mjs --domain api.gmrlog.com --email ops@gmrlog.com
 *   node scripts/deploy/gen-secrets.mjs --domain ... --email ... --app-origin https://gmrlog.com
 *
 * Third-party keys (Steam, Google, Discord, IGDB, SMTP, Sentry) cannot be
 * generated. They are left blank and the preflight refuses to start the stack
 * until the required ones are filled in.
 */
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const templatePath = join(root, 'infrastructure', 'deploy', '.env.deploy.example');
const outputPath = join(root, 'infrastructure', 'deploy', '.env.deploy.local');

/** base64url, so nothing downstream has to worry about `/`, `+` or `=` in a URL or a shell. */
function secret(bytes) {
  return randomBytes(bytes).toString('base64url');
}

function parseArgs(argv) {
  const args = new Map();
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const eq = token.indexOf('=');
    if (eq !== -1) {
      args.set(token.slice(2, eq), token.slice(eq + 1));
    } else {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        args.set(token.slice(2), 'true');
      } else {
        args.set(token.slice(2), next);
        i += 1;
      }
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const domain = args.get('domain');
const email = args.get('email');
const appOrigin = args.get('app-origin') ?? (domain ? `https://${domain}` : undefined);
const image = args.get('image');
const force = args.get('force') === 'true';

if (!domain || !email) {
  console.error(
    'usage: node scripts/deploy/gen-secrets.mjs --domain <api-hostname> --email <letsencrypt-email>' +
      '\n       [--app-origin https://app.example.com] [--image ghcr.io/owner/repo/backend] [--force]',
  );
  process.exit(1);
}

if (existsSync(outputPath) && !force) {
  console.error(
    `Refusing to overwrite ${outputPath}.\n` +
      'It holds live secrets — overwriting JWT_SECRET signs every user out, and\n' +
      'overwriting POSTGRES_PASSWORD locks the API out of its own database.\n' +
      'Pass --force only if you mean exactly that.',
  );
  process.exit(1);
}

/** Keys whose template value is replaced outright. */
const replacements = new Map([
  ['API_DOMAIN', domain],
  ['LETSENCRYPT_EMAIL', email],
  ['LETSENCRYPT_STAGING', '0'],
  ['CORS_ORIGINS', appOrigin],
  ['PASSWORD_RESET_URL_BASE', `${appOrigin}/reset-password`],
  ['STEAM_OPENID_REALM', `https://${domain}`],
  ['STEAM_OPENID_ALLOWED_RETURN_URIS', `${appOrigin}/auth/steam/callback`],
  ['POSTGRES_PASSWORD', secret(24)],
  // 48 bytes, well past the schema's 32-character floor. This signs every
  // access and refresh token in the system.
  ['JWT_SECRET', secret(48)],
  ['MEILI_API_KEY', secret(24)],
  ['METRICS_TOKEN', secret(24)],
  ['MINIO_ROOT_PASSWORD', secret(24)],
]);

if (image) {
  replacements.set('GMRLOG_IMAGE', image);
}

const template = readFileSync(templatePath, 'utf8');
const seen = new Set();

const output = template
  .split(/\r?\n/)
  .map((line) => {
    const match = /^([A-Z0-9_]+)=/.exec(line);
    if (match === null) return line;
    const key = match[1];
    if (!replacements.has(key)) return line;
    seen.add(key);
    return `${key}=${replacements.get(key)}`;
  })
  .join('\n');

const missing = [...replacements.keys()].filter((key) => !seen.has(key));
if (missing.length > 0) {
  console.error(
    `Template ${templatePath} no longer declares: ${missing.join(', ')}.\n` +
      'The generator and the template have drifted — fix the template rather than\n' +
      'shipping a file that silently omits a secret.',
  );
  process.exit(1);
}

// 0o600: the file is a secret, and a deploy directory is often group-readable.
// Windows ignores the mode, which is fine — this file belongs on a Linux host.
writeFileSync(outputPath, output, { encoding: 'utf8', mode: 0o600 });

console.log(`Wrote ${outputPath}`);
console.log('');
console.log(
  'Generated: POSTGRES_PASSWORD, JWT_SECRET, MEILI_API_KEY, METRICS_TOKEN, MINIO_ROOT_PASSWORD',
);
console.log('Still to fill in by hand:');
console.log('  STEAM_WEB_API_KEY   (required — the backend refuses to boot without it)');
console.log('  SMTP_HOST/USERNAME/PASSWORD/FROM   (required — password reset needs real mail)');
console.log('  SENTRY_DSN          (optional, but this is the only error reporting there is)');
console.log('  GOOGLE_*/DISCORD_*/IGDB_*  (optional, per feature)');
console.log('');
console.log('Then: node scripts/deploy/preflight-deploy-env.mjs');
