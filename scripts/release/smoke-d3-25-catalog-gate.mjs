#!/usr/bin/env node
/**
 * D3.25 CATALOG PRODUCTION GATE — Game Metadata & Catalog Foundation.
 *
 * Verifies:
 *  - OpenAPI (/docs-json) exposes the new catalog read endpoints.
 *  - GET /games/:id never blocks — no provider call on the request path
 *    (docs/18_CATALOG/GAME_METADATA_ARCHITECTURE.md §5 invariant 1).
 *  - The new catalog metadata block is always present, even pre-enrichment.
 *  - /games/:id/media, /games/:id/similar, /games/:id/metadata all serve reads.
 *  - The zero-credential deployment is valid: games stay `pending`, no crash,
 *    no dangling request (docs/18_CATALOG/METADATA_PROVIDERS.md §1).
 *  - A newly created skeleton game (via CSV import) is enqueued for
 *    enrichment and the worker records a `skipped` run without ever calling
 *    a provider or corrupting catalog state.
 *  - Discovery's game-card cover resolution no longer hardcodes `null`
 *    (SPRINT_0_PROJECT_AUDIT.md C3) — verified against a game with a real
 *    `coverKey` set directly against the database.
 */

import { setTimeout as delay } from 'node:timers/promises';

import { Client } from 'pg';

import { DEFAULTS, fail, httpJson, log, pass, registerUser, login } from './lib/common.mjs';

const api = DEFAULTS.apiBase;
const results = [];

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  if (ok) pass(name);
  else fail(name, detail || 'failed');
}

async function withDb(fn) {
  const client = new Client({ connectionString: DEFAULTS.databaseUrl });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function main() {
  log('gate', `API=${api}`);

  // --- OpenAPI exposes the D3.25 catalog surface ---
  {
    const docs = await fetch(`${api.replace(/\/api\/v1$/, '')}/docs-json`);
    if (!docs.ok) fail('openapi-docs', `docs-json ${docs.status}`);
    const doc = await docs.json();
    const paths = Object.keys(doc.paths ?? {});

    const hasMedia = paths.some(
      (p) => p === '/games/{id}/media' || (p.includes('/games/') && p.endsWith('/media')),
    );
    const hasSimilar = paths.some(
      (p) => p === '/games/{id}/similar' || (p.includes('/games/') && p.endsWith('/similar')),
    );
    const hasMetadata = paths.some(
      (p) => p === '/games/{id}/metadata' || (p.includes('/games/') && p.endsWith('/metadata')),
    );

    record('openapi-games-media-path', hasMedia, `paths=${paths.length}`);
    record('openapi-games-similar-path', hasSimilar);
    record('openapi-games-metadata-path', hasMetadata);
  }

  // --- Locate a seeded game to exercise reads against ---
  const gameId = await withDb(async (client) => {
    const { rows } = await client.query(
      'SELECT id, title FROM games ORDER BY created_at ASC LIMIT 1',
    );
    if (rows.length === 0)
      throw new Error('no seeded games found — expected fixtures from prior sprints');
    return rows[0].id;
  });
  log('gate', `probing game ${gameId}`);

  // --- GET /games/:id never blocks on a provider (invariant 1) ---
  {
    const startedAt = Date.now();
    const { response, data } = await httpJson(`${api}/games/${gameId}`);
    const durationMs = Date.now() - startedAt;

    record('game-detail-200', response.ok, `status=${response.status}`);
    // Generous ceiling — this only needs to prove "no network round-trip to
    // a third party", not assert a tight latency SLO.
    record('game-detail-no-provider-block', durationMs < 2000, `durationMs=${durationMs}`);
    record(
      'game-detail-has-metadata-block',
      data?.metadata !== undefined,
      JSON.stringify(data?.metadata),
    );
    record(
      'game-detail-metadata-shape',
      typeof data?.metadata?.status === 'string' && 'provider' in data.metadata,
      JSON.stringify(data?.metadata),
    );
    // Every additive D3.25 field must be present, even when null.
    const requiredKeys = [
      'heroUrl',
      'summary',
      'description',
      'trailerUrl',
      'externalRating',
      'externalRatingCount',
      'genres',
      'tags',
      'developers',
      'publishers',
      'franchise',
      'series',
      'screenshots',
      'metadata',
    ];
    const missing = requiredKeys.filter((key) => !(key in (data ?? {})));
    record(
      'game-detail-catalog-fields-present',
      missing.length === 0,
      `missing=${missing.join(',')}`,
    );
  }

  // --- New read endpoints ---
  {
    const { response, data } = await httpJson(`${api}/games/${gameId}/media`);
    record('game-media-200', response.ok, `status=${response.status}`);
    record('game-media-is-array', Array.isArray(data), typeof data);
  }
  {
    const { response, data } = await httpJson(`${api}/games/${gameId}/similar`);
    record('game-similar-200', response.ok, `status=${response.status}`);
    record('game-similar-is-array', Array.isArray(data), typeof data);
  }
  {
    const { response, data } = await httpJson(`${api}/games/${gameId}/metadata`);
    record('game-metadata-status-200', response.ok, `status=${response.status}`);
    record('game-metadata-status-shape', data?.gameId === gameId && data?.metadata !== undefined);
  }
  {
    const { response } = await httpJson(`${api}/games/00000000000000000000000000`);
    record('game-detail-404-for-missing', response.status === 404, `status=${response.status}`);
  }

  // --- Cover resolution is no longer hardcoded null (audit C3) ---
  {
    const marker = `smoke/d325/${Date.now()}.jpg`;
    await withDb(async (client) => {
      await client.query('UPDATE games SET cover_key = $1 WHERE id = $2', [marker, gameId]);
    });
    try {
      const { data } = await httpJson(`${api}/games/${gameId}`);
      record(
        'game-cover-resolves-real-url',
        typeof data?.coverUrl === 'string' && data.coverUrl.includes(encodeURIComponent(marker)),
        String(data?.coverUrl),
      );

      const discoverPage = await httpJson(`${api}/discover/games?limit=50`);
      const items = discoverPage.data?.items ?? [];
      const found = items.find((item) => item.id === gameId);
      if (found !== undefined) {
        record(
          'discover-card-cover-not-hardcoded-null',
          found.coverImageUrl !== null,
          String(found.coverImageUrl),
        );
      } else {
        log('discover-card-cover-not-hardcoded-null', 'game not on first discover page — skipped');
      }
    } finally {
      await withDb(async (client) => {
        await client.query('UPDATE games SET cover_key = NULL WHERE id = $1', [gameId]);
      });
    }
  }

  // --- Zero-credential provider chain + enrichment queue path ---
  {
    const user = await registerUser(api);
    const auth = await login(api, user.email, user.password);
    const headers = { authorization: `Bearer ${auth.accessToken}` };

    const title = `Smoke Catalog Game ${Date.now()}`;
    const csv = `title,status,playtimeMin\n"${title}",owned,0\n`;

    const previewResponse = await httpJson(`${api}/integrations/import/csv/preview`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ csv }),
    });
    record(
      'csv-import-preview-200',
      previewResponse.response.ok,
      `status=${previewResponse.response.status}`,
    );

    const runImport = await httpJson(`${api}/integrations/import/csv`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ csv }),
    });
    record('csv-import-run-accepted', runImport.response.ok, `status=${runImport.response.status}`);

    const newGameId = await withDb(async (client) => {
      let row = null;
      for (let attempt = 0; attempt < 10 && row === null; attempt += 1) {
        const { rows } = await client.query(
          'SELECT id, metadata_status FROM games WHERE title = $1',
          [title],
        );
        row = rows[0] ?? null;
        if (row === null) await delay(500);
      }
      return row;
    });

    if (newGameId === null) {
      record('skeleton-game-created', false, 'CSV import did not create a game row in time');
    } else {
      record('skeleton-game-created', true, `id=${newGameId.id}`);

      // Never awaited by the request — poll for the worker's async run row.
      const run = await withDb(async (client) => {
        let found = null;
        for (let attempt = 0; attempt < 20 && found === null; attempt += 1) {
          const { rows } = await client.query(
            'SELECT outcome, provider FROM game_metadata_runs WHERE game_id = $1 ORDER BY created_at DESC LIMIT 1',
            [newGameId.id],
          );
          found = rows[0] ?? null;
          if (found === null) await delay(500);
        }
        return found;
      });

      record('enrichment-run-recorded', run !== null, JSON.stringify(run));
      record(
        'enrichment-skipped-with-zero-credentials',
        run?.outcome === 'skipped' && run?.provider === null,
        JSON.stringify(run),
      );

      const finalStatus = await withDb(async (client) => {
        const { rows } = await client.query('SELECT metadata_status FROM games WHERE id = $1', [
          newGameId.id,
        ]);
        return rows[0]?.metadata_status ?? null;
      });
      record(
        'skeleton-game-stays-pending-not-corrupted',
        finalStatus === 'pending',
        `status=${finalStatus}`,
      );
    }
  }

  // --- Summary ---
  const failed = results.filter((r) => !r.ok);
  log('gate', `${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length > 0) {
    for (const f of failed) log('FAIL', `${f.name} — ${f.detail}`);
    process.exitCode = 1;
    return;
  }
  log('gate', 'D3.25 CATALOG PRODUCTION GATE: PASS');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
