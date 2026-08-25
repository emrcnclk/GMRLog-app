#!/usr/bin/env node
/**
 * Create `infrastructure/docker/.env.production.local` from the example so the
 * secrets can be filled in by hand. The file is gitignored (`.env.*.local`);
 * this script never overwrites an existing one, because doing so would discard
 * real secrets.
 *
 * Usage: pnpm docker:prod:init
 */
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dockerDir = join(root, 'infrastructure', 'docker');
const source = join(dockerDir, '.env.production.example');
const target = join(dockerDir, '.env.production.local');

if (existsSync(target)) {
  console.log('infrastructure/docker/.env.production.local already exists — leaving it alone.');
  process.exit(0);
}

copyFileSync(source, target);
console.log(
  'Created infrastructure/docker/.env.production.local.\n' +
    'Replace every placeholder secret in it before running `pnpm docker:prod:up`;\n' +
    'the preflight refuses the example values.',
);
