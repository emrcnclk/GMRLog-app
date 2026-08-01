#!/usr/bin/env node
/**
 * D3.25 — verifies real Twitch client-credentials OAuth and a real IGDB APIv4
 * request. Exits non-zero and prints the failure reason if either step fails.
 * No mocks. Deleted after the sprint's validation report is written.
 */
import { resolve } from 'node:path';

import { config as loadEnv } from 'dotenv';

loadEnv({ path: resolve(process.cwd(), '../../.env') });

const clientId = process.env.IGDB_CLIENT_ID;
const clientSecret = process.env.IGDB_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('FAIL: IGDB_CLIENT_ID / IGDB_CLIENT_SECRET not set');
  process.exit(1);
}

async function main() {
  console.log('--- Step 1: Twitch client-credentials token ---');
  const tokenUrl = new URL('https://id.twitch.tv/oauth2/token');
  tokenUrl.searchParams.set('client_id', clientId);
  tokenUrl.searchParams.set('client_secret', clientSecret);
  tokenUrl.searchParams.set('grant_type', 'client_credentials');

  const tokenRes = await fetch(tokenUrl.toString(), { method: 'POST' });
  const tokenBody = await tokenRes.json();

  if (!tokenRes.ok || !tokenBody.access_token) {
    console.error(`FAIL: Twitch token request HTTP ${tokenRes.status}`, tokenBody);
    process.exit(1);
  }
  console.log(`OK: access_token acquired (expires_in=${tokenBody.expires_in}s)`);

  console.log('--- Step 2: IGDB /v4/games query for "Portal 2" ---');
  const gamesRes = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${tokenBody.access_token}`,
      'Content-Type': 'text/plain',
    },
    body: 'search "Portal 2"; fields id,name,first_release_date,total_rating; limit 5;',
  });

  if (!gamesRes.ok) {
    const text = await gamesRes.text();
    console.error(`FAIL: IGDB request HTTP ${gamesRes.status}`, text);
    process.exit(1);
  }

  const games = await gamesRes.json();
  if (!Array.isArray(games) || games.length === 0) {
    console.error('FAIL: IGDB returned no results for "Portal 2"');
    process.exit(1);
  }

  console.log(`OK: IGDB returned ${games.length} result(s):`);
  for (const game of games) {
    console.log(`  - id=${game.id} name="${game.name}" rating=${game.total_rating ?? 'n/a'}`);
  }

  console.log('\nVERIFIED: Twitch OAuth + IGDB APIv4 both working with real credentials.');
}

main().catch((error) => {
  console.error('FAIL: unexpected error', error);
  process.exit(1);
});
