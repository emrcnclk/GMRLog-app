#!/usr/bin/env node
/**
 * D3.25 — one-off verification that the backend env schema loads the real
 * provider credentials. Not a permanent script; deleted after the sprint's
 * validation report is written.
 */
import { resolve } from 'node:path';

import { config as loadEnv } from 'dotenv';

loadEnv({ path: resolve(process.cwd(), '../../.env') });

const required = [
  'IGDB_CLIENT_ID',
  'IGDB_CLIENT_SECRET',
  'STEAM_WEB_API_KEY',
  'STEAM_STORE_METADATA_ENABLED',
];
let ok = true;
for (const key of required) {
  const value = process.env[key];
  const present = value !== undefined && value.length > 0;
  console.log(
    `${present ? 'OK  ' : 'FAIL'} ${key} = ${present ? (key.includes('SECRET') || key.includes('KEY') ? value.slice(0, 6) + '***' : value) : '(missing)'}`,
  );
  if (!present) ok = false;
}
process.exit(ok ? 0 : 1);
