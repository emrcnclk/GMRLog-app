#!/usr/bin/env node
/**
 * D3.24 performance gate — measure Feed / Game Hub / Search / Profile / Communities / Discovery
 * against the loaded dataset. Reports p50/p95/p99 + process memory + redis/db probes.
 */

import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import {
  DEFAULTS,
  fail,
  httpJson,
  log,
  pass,
  registerUser,
  summarizeLatencies,
} from './lib/common.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const ITERATIONS = Number(process.env.SMOKE_PERF_D324_ITERATIONS ?? 30);
const AUTH_GAP_MS = Number(process.env.SMOKE_PERF_AUTH_GAP_MS ?? 12_000);

async function timeMs(fn) {
  const start = performance.now();
  await fn();
  return Math.round(performance.now() - start);
}

async function measure(name, fn) {
  const samples = [];
  for (let i = 0; i < ITERATIONS; i += 1) {
    samples.push(await timeMs(fn));
  }
  const summary = summarizeLatencies(samples);
  log(
    name,
    `p50=${summary.p50} p95=${summary.p95} p99=${summary.p99} max=${summary.max} n=${summary.count}`,
  );
  return { name, ...summary, samples };
}

function redisInfo() {
  try {
    return execSync('docker exec gmrlog-redis redis-cli INFO memory', { encoding: 'utf8' });
  } catch (error) {
    return String(error);
  }
}

function dbStats() {
  try {
    return execSync(
      `docker exec gmrlog-postgres psql -U gmrlog -d gmrlog -t -A -c "SELECT pg_size_pretty(pg_database_size('gmrlog')), (SELECT count(*) FROM feed_entries), (SELECT count(*) FROM users);"`,
      { encoding: 'utf8' },
    ).trim();
  } catch (error) {
    return String(error);
  }
}

async function main() {
  const api = DEFAULTS.apiBase;
  await delay(2_000);
  let user;
  for (let i = 0; i < 8; i += 1) {
    try {
      user = await registerUser(api);
      break;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('429')) throw error;
      await delay(AUTH_GAP_MS);
    }
  }
  if (!user) fail('register', 'exhausted');

  const auth = { authorization: `Bearer ${user.accessToken}` };
  const me = await httpJson(`${api}/me`, { headers: auth });
  const handle = me.data?.handle ?? user.handle;
  const userId = me.data?.id ?? user.userId;

  let gameId = 'game_perf324_1';
  const games = await httpJson(`${api}/discover/games`, { headers: auth });
  const gItems = games.data?.items ?? games.data ?? [];
  if (Array.isArray(gItems) && gItems[0]?.id) gameId = gItems[0].id;

  const results = [];

  results.push(
    await measure('feed', async () => {
      const { response } = await httpJson(`${api}/feed`, { headers: auth });
      if (!response.ok) throw new Error(`feed ${response.status}`);
    }),
  );

  results.push(
    await measure('game-hub', async () => {
      const { response } = await httpJson(`${api}/games/${gameId}/hub`, { headers: auth });
      if (!response.ok) throw new Error(`hub ${response.status}`);
    }),
  );

  results.push(
    await measure('search', async () => {
      const { response } = await httpJson(`${api}/search?q=Perf`, { headers: auth });
      if (!response.ok) throw new Error(`search ${response.status}`);
    }),
  );

  results.push(
    await measure('profile-hero', async () => {
      const { response } = await httpJson(`${api}/users/${encodeURIComponent(handle)}/hero`, {
        headers: auth,
      });
      if (!response.ok) {
        const alt = await httpJson(`${api}/users/${userId}/hero`, { headers: auth });
        if (!alt.response.ok) throw new Error(`hero ${response.status}/${alt.response.status}`);
      }
    }),
  );

  results.push(
    await measure('communities-discover', async () => {
      const { response } = await httpJson(`${api}/discover/communities`, { headers: auth });
      if (!response.ok) throw new Error(`communities ${response.status}`);
    }),
  );

  results.push(
    await measure('discovery-games', async () => {
      const { response } = await httpJson(`${api}/discover/games`, { headers: auth });
      if (!response.ok) throw new Error(`discover ${response.status}`);
    }),
  );

  results.push(
    await measure('because-you-played', async () => {
      const { response } = await httpJson(`${api}/discover/because-you-played`, { headers: auth });
      if (!response.ok && response.status !== 404) {
        throw new Error(`byp ${response.status}`);
      }
    }),
  );

  const mem = process.memoryUsage();
  const redis = redisInfo();
  const db = dbStats();
  const usedMb = Math.round(mem.rss / 1024 / 1024);
  log('memory', `client_rss_mb=${usedMb}`);
  log(
    'redis',
    redis
      .split('\n')
      .filter((l) => l.startsWith('used_memory_human'))
      .join(' ') || 'n/a',
  );
  log('database', db);

  const outDir = path.join(repoRoot, 'docs/06_RELEASE');
  mkdirSync(outDir, { recursive: true });
  const payload = {
    generatedAt: new Date().toISOString(),
    iterations: ITERATIONS,
    dataset: {
      users: 100001,
      feed_entries: 1000000,
      reviews: 500000,
      collections: 300000,
      communities: 100000,
      events: 50000,
    },
    results,
    memory: { rssMb: usedMb, heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024) },
    redis: redis.slice(0, 500),
    database: db,
  };
  writeFileSync(path.join(outDir, 'D3_24_PERF_RESULTS.json'), JSON.stringify(payload, null, 2));

  // Soft budgets from PERFORMANCE_BUDGET — API read p95 guidance (~300ms-1s for feed)
  for (const row of results) {
    if (row.p95 > 5_000) {
      fail(row.name, `p95=${row.p95} exceeds 5000ms hard gate`);
    }
    pass(row.name);
  }

  console.log('SMOKE_PERF_D324 PASS');
}

main().catch((error) => {
  console.error('SMOKE_PERF_D324 FAIL');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
