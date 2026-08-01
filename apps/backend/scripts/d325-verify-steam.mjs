#!/usr/bin/env node
/**
 * D3.25 — verifies the Steam Web API key against a real ISteamUser endpoint,
 * and fetches real Steam Store appdetails for Portal 2 (620) and Elden Ring
 * (1245620). No mocks. Deleted after the sprint's validation report is written.
 */
import { resolve } from 'node:path';

import { config as loadEnv } from 'dotenv';

loadEnv({ path: resolve(process.cwd(), '../../.env') });

const apiKey = process.env.STEAM_WEB_API_KEY;
if (!apiKey) {
  console.error('FAIL: STEAM_WEB_API_KEY not set');
  process.exit(1);
}

async function main() {
  console.log('--- Step 1: Validate Steam Web API key (ISteamUser/ResolveVanityURL) ---');
  const vanityUrl = new URL('https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/');
  vanityUrl.searchParams.set('key', apiKey);
  vanityUrl.searchParams.set('vanityurl', 'gabelogannewell'); // a known, stable public vanity
  const vanityRes = await fetch(vanityUrl.toString());
  const vanityBody = await vanityRes.json();

  if (!vanityRes.ok) {
    console.error(`FAIL: Steam Web API key rejected — HTTP ${vanityRes.status}`, vanityBody);
    process.exit(1);
  }
  console.log(
    `OK: Steam Web API key accepted (HTTP ${vanityRes.status})`,
    JSON.stringify(vanityBody),
  );

  console.log('\n--- Step 2: Steam Store appdetails for Portal 2 (appid 620) ---');
  const portal2 = await fetchAppDetails(620);
  console.log(
    `OK: name="${portal2.name}" genres=${portal2.genres?.map((g) => g.description).join(', ')}`,
  );
  console.log(`    short_description="${(portal2.short_description ?? '').slice(0, 80)}..."`);
  console.log(`    header_image=${portal2.header_image}`);

  console.log('\n--- Step 3: Steam Store appdetails for Elden Ring (appid 1245620) ---');
  const eldenRing = await fetchAppDetails(1245620);
  console.log(
    `OK: name="${eldenRing.name}" genres=${eldenRing.genres?.map((g) => g.description).join(', ')}`,
  );
  console.log(`    short_description="${(eldenRing.short_description ?? '').slice(0, 80)}..."`);
  console.log(`    header_image=${eldenRing.header_image}`);

  console.log(
    '\nVERIFIED: Steam Web API key valid; Steam Store metadata reachable for both titles.',
  );
}

async function fetchAppDetails(appId) {
  const url = new URL('https://store.steampowered.com/api/appdetails');
  url.searchParams.set('appids', String(appId));
  url.searchParams.set('l', 'english');
  const res = await fetch(url.toString());
  if (!res.ok) {
    console.error(`FAIL: Steam Store HTTP ${res.status} for appid ${appId}`);
    process.exit(1);
  }
  const json = await res.json();
  const entry = json[String(appId)];
  if (!entry?.success) {
    console.error(`FAIL: Steam Store returned success=false for appid ${appId}`, entry);
    process.exit(1);
  }
  return entry.data;
}

main().catch((error) => {
  console.error('FAIL: unexpected error', error);
  process.exit(1);
});
