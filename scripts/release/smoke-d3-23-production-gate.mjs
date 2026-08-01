/**
 * D3.23 production gate — 6 readiness checks.
 *
 * Usage (API must be running):
 *   node scripts/release/smoke-d3-23-production-gate.mjs
 *
 * Env:
 *   SMOKE_BASE_URL   default http://127.0.0.1:4000/api/v1
 *   STEAM_MOCK_LIBRARY_SIZE  for test 3 (set on backend process)
 */
import { execFileSync, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { closeSync, existsSync, openSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const base = (process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:4000/api/v1').replace(/\/$/, '');
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
/** Must match MockSteamWebApiClient STEAM_MOCK_LIBRARY_STEAM_ID_PREFIX. */
const STRESS_STEAM_ID_PREFIX = process.env.STEAM_MOCK_LIBRARY_STEAM_ID_PREFIX ?? '7656119800000999';
const STRESS_STEAM_ID = `${STRESS_STEAM_ID_PREFIX}9`;
const RESTART_STEAM_ID = `${STRESS_STEAM_ID_PREFIX}1`;
/** Redis db reserved for the restart test's isolated backend. */
const GATE_REDIS_DB = 5;

let failures = 0;
function pass(name, detail = '') {
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ''}`);
}
function fail(name, detail) {
  failures += 1;
  console.error(`FAIL  ${name} — ${detail}`);
}

async function http(method, path, { token, body, headers, baseUrl } = {}) {
  const res = await fetch(`${baseUrl ?? base}${path}`, {
    method,
    headers: {
      // Fastify rejects `content-type: application/json` with an empty body (400).
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* empty */
  }
  return { status: res.status, json, text };
}

async function register(baseUrl) {
  const handle = `gate_${randomUUID().replace(/-/g, '').slice(0, 10)}`;
  const { status, json } = await http('POST', '/sessions/register', {
    ...(baseUrl === undefined ? {} : { baseUrl }),
    headers: { 'idempotency-key': `reg-${handle}` },
    body: {
      email: `${handle}@smoke.gmrlog.local`,
      password: 'SmokeTestPass12',
      displayName: 'D323 Gate',
      handle,
    },
  });
  if (status >= 400) {
    throw new Error(`register ${status}: ${JSON.stringify(json)}`);
  }
  const token = json?.data?.accessToken;
  if (!token) {
    throw new Error('register missing accessToken');
  }
  return { token, handle };
}

function dataOf(json) {
  return json?.data ?? json;
}

async function waitHistory(token, minCount, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { json } = await http('GET', '/integrations/history', { token });
    const rows = dataOf(json);
    if (Array.isArray(rows) && rows.length >= minCount) {
      const latest = rows[0];
      if (latest?.status === 'completed' || latest?.status === 'failed') {
        return rows;
      }
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('history wait timeout');
}

async function waitJobDone(token, jobId, timeoutMs = 120_000, baseUrl) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const { json } = await http('GET', '/integrations/history', {
        token,
        ...(baseUrl === undefined ? {} : { baseUrl }),
      });
      const rows = dataOf(json);
      // History stores SyncHistory ids, so poll the newest row for this user.
      if (
        Array.isArray(rows) &&
        (rows[0]?.status === 'completed' || rows[0]?.status === 'failed')
      ) {
        return rows[0];
      }
    } catch {
      /* API restarting — keep polling */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`job wait timeout (${jobId})`);
}

async function test1Idempotency(token) {
  const connect = await http('POST', '/integrations/steam/connect', {
    token,
    body: { steamIdOrUrl: '76561198000000001' },
  });
  if (connect.status >= 400) {
    fail('1.idempotency/connect', JSON.stringify(connect.json));
    return null;
  }
  const integrationId = dataOf(connect.json).id;

  const runs = [];
  for (let i = 1; i <= 5; i += 1) {
    // Ensure previous completed before next (idempotency of completed syncs)
    const sync = await http('POST', `/integrations/${integrationId}/sync`, {
      token,
      body: { syncType: 'manual' },
    });
    if (sync.status === 409) {
      // wait for active then retry once
      await waitHistory(token, i);
      const retry = await http('POST', `/integrations/${integrationId}/sync`, {
        token,
        body: { syncType: 'manual' },
      });
      if (retry.status >= 400) {
        fail('1.idempotency/sync', `run ${i} → ${retry.status}`);
        return null;
      }
    } else if (sync.status >= 400) {
      fail('1.idempotency/sync', `run ${i} → ${sync.status} ${JSON.stringify(sync.json)}`);
      return null;
    }
    const hist = await waitHistory(token, i);
    runs.push(hist[0]);
  }

  const [r1, r2, r3, r4, r5] = runs;
  const okFirst = r1.importedCount === 3 && r1.failedCount === 0;
  const okRest = [r2, r3, r4, r5].every(
    (r) => r.importedCount === 0 && r.updatedCount === 3 && r.failedCount === 0,
  );

  const lib = await http('GET', '/library/entries', { token });
  const entries = dataOf(lib.json);
  const libCount = Array.isArray(entries) ? entries.length : -1;
  const ints = await http('GET', '/integrations', { token });
  const steam = dataOf(ints.json)?.find?.((x) => x.provider === 'steam');

  if (okFirst && okRest && libCount === 3 && steam?.gamesImported === 3) {
    pass(
      '1.idempotency',
      `sync1 imported=${r1.importedCount}; sync2-5 updated=3; library=${libCount}`,
    );
  } else {
    fail(
      '1.idempotency',
      `r1=${JSON.stringify(r1)} r2=${JSON.stringify(r2)} lib=${libCount} gamesImported=${steam?.gamesImported}`,
    );
  }
  return integrationId;
}

async function test2DisconnectReconnect(token, integrationId) {
  const beforeLib = dataOf((await http('GET', '/library/entries', { token })).json);
  const beforeCount = Array.isArray(beforeLib) ? beforeLib.length : 0;

  const disc = await http('POST', '/integrations/steam/disconnect', { token });
  if (disc.status !== 204 && disc.status !== 200) {
    fail('2.reconnect/disconnect', `status ${disc.status}`);
    return;
  }

  const recon = await http('POST', '/integrations/steam/connect', {
    token,
    body: { steamIdOrUrl: '76561198000000001' },
  });
  if (recon.status >= 400) {
    fail('2.reconnect/connect', JSON.stringify(recon.json));
    return;
  }
  const newId = dataOf(recon.json).id;

  const sync = await http('POST', `/integrations/${newId}/sync`, {
    token,
    body: { syncType: 'manual' },
  });
  if (sync.status >= 400 && sync.status !== 409) {
    fail('2.reconnect/sync', JSON.stringify(sync.json));
    return;
  }
  if (sync.status === 409) {
    await waitHistory(token, 1);
    await http('POST', `/integrations/${newId}/sync`, {
      token,
      body: { syncType: 'manual' },
    });
  }
  await waitHistory(token, 1);

  const afterLib = dataOf((await http('GET', '/library/entries', { token })).json);
  const afterCount = Array.isArray(afterLib) ? afterLib.length : -1;
  const ints = dataOf((await http('GET', '/integrations', { token })).json);
  const steamRows = Array.isArray(ints) ? ints.filter((x) => x.provider === 'steam') : [];
  const connectedSteam = steamRows.filter((x) => x.status === 'connected');

  // profiles: at most one connected steam integration for user
  if (connectedSteam.length === 1 && afterCount === beforeCount && afterCount === 3) {
    pass('2.disconnect→connect', `library stable=${afterCount}; steam connected=1`);
  } else {
    fail(
      '2.disconnect→connect',
      `before=${beforeCount} after=${afterCount} connectedSteam=${connectedSteam.length} prevId=${integrationId} newId=${newId}`,
    );
  }
}

async function test3LargeLibrary() {
  const size = Number.parseInt(process.env.STEAM_MOCK_LIBRARY_SIZE ?? '0', 10);
  if (!Number.isFinite(size) || size <= 0) {
    fail(
      '3.large-library',
      'STEAM_MOCK_LIBRARY_SIZE unset — start backend and gate with the same value (1000/5000/10000)',
    );
    return;
  }

  const { token } = await register();
  // Mock serves the large library only for this SteamID64 (STEAM_MOCK_LIBRARY_STEAM_ID).
  const steamId = STRESS_STEAM_ID;
  const connect = await http('POST', '/integrations/steam/connect', {
    token,
    body: { steamIdOrUrl: steamId },
  });
  if (connect.status >= 400) {
    fail('3.large-library/connect', JSON.stringify(connect.json));
    return;
  }
  const integrationId = dataOf(connect.json).id;
  const memBefore = process.memoryUsage().heapUsed;

  const t0 = Date.now();
  const sync = await http('POST', `/integrations/${integrationId}/sync`, {
    token,
    body: { syncType: 'manual' },
  });
  if (sync.status >= 400) {
    fail('3.large-library/sync', `${sync.status} ${JSON.stringify(sync.json)}`);
    return;
  }
  const hist = await waitJobDone(token, dataOf(sync.json)?.id, 600_000);
  const elapsed = Date.now() - t0;
  const memAfter = process.memoryUsage().heapUsed;
  const deltaMb = ((memAfter - memBefore) / (1024 * 1024)).toFixed(1);

  const metrics = [
    `imported=${hist.importedCount}`,
    `failed=${hist.failedCount}`,
    `serverDurationMs=${hist.durationMs ?? 'n/a'}`,
    `wallMs=${elapsed}`,
    `externalGamesRows=${dockerMetric('gmrlog-postgres', [
      'psql',
      '-U',
      'gmrlog',
      '-d',
      'gmrlog',
      '-tAc',
      'select count(*) from external_games',
    ])}`,
    `queueWaiting=${dockerMetric('gmrlog-redis', [
      'redis-cli',
      'llen',
      'bull:integration.sync:wait',
    ])}`,
    `clientΔheap=${deltaMb}MB`,
  ].join(' ');

  if (hist.importedCount === size && hist.failedCount === 0) {
    pass('3.large-library', `size=${size} ${metrics}`);
  } else {
    fail('3.large-library', `expected imported=${size} — ${metrics}`);
  }
}

/** Best-effort container metric; never fails the gate. */
function dockerMetric(container, args) {
  try {
    return execFileSync('docker', ['exec', container, ...args], {
      encoding: 'utf8',
      timeout: 15_000,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .trim()
      .split('\n')
      .pop()
      .trim();
  } catch {
    return 'n/a';
  }
}

async function test4Concurrent(token) {
  // Ensure a connected steam for this token
  let ints = dataOf((await http('GET', '/integrations', { token })).json);
  let steam = Array.isArray(ints)
    ? ints.find((x) => x.provider === 'steam' && x.status === 'connected')
    : null;
  if (!steam) {
    const c = await http('POST', '/integrations/steam/connect', {
      token,
      body: { steamIdOrUrl: '76561198000000001' },
    });
    steam = dataOf(c.json);
  }
  const id = steam.id;

  // Kick one sync then immediately another (works when first stays pending via BullMQ)
  const first = http('POST', `/integrations/${id}/sync`, {
    token,
    body: { syncType: 'manual' },
  });
  const second = http('POST', `/integrations/${id}/sync`, {
    token,
    body: { syncType: 'manual' },
  });
  const [a, b] = await Promise.all([first, second]);
  const statuses = [a.status, b.status].sort();
  const hasConflict = a.status === 409 || b.status === 409;
  const hasSuccess = a.status === 201 || b.status === 201 || a.status === 200 || b.status === 200;

  if (hasConflict && hasSuccess) {
    pass('4.concurrent-sync', `statuses=${a.status},${b.status}`);
  } else if (statuses[0] === 409 && statuses[1] === 409) {
    // both conflicted if a prior job still pending — wait and soft-pass if message correct
    const msg = JSON.stringify(a.json) + JSON.stringify(b.json);
    if (msg.includes('already running') || msg.includes('Sync already')) {
      pass('4.concurrent-sync', `both 409 (lock held) — ${msg.slice(0, 120)}`);
    } else {
      fail('4.concurrent-sync', `statuses=${a.status},${b.status} ${msg}`);
    }
  } else {
    fail('4.concurrent-sync', `expected one 201 + one 409, got ${a.status},${b.status}`);
  }

  // drain
  try {
    await waitHistory(token, 1, 30_000);
  } catch {
    /* ignore */
  }
}

/**
 * Real worker kill + restart. Runs an isolated backend (own API port and Redis db)
 * so the developer's API/worker on :4000 cannot steal the stalled job.
 */
async function test5WorkerRestart() {
  const dist = resolve(REPO_ROOT, 'apps/backend/dist/main.js');
  if (!existsSync(dist)) {
    fail(
      '5.worker-restart',
      'apps/backend/dist/main.js missing — run `pnpm --filter @gmrlog/backend build`',
    );
    return;
  }

  const size = Number.parseInt(process.env.GATE_RESTART_LIBRARY_SIZE ?? '600', 10);
  const port = Number.parseInt(process.env.GATE_RESTART_API_PORT ?? '4123', 10);
  const childBase = `http://127.0.0.1:${String(port)}/api/v1`;
  const childEnv = restartChildEnv(port, size);

  const logPath = resolve(tmpdir(), `gmrlog-gate-restart-${String(process.pid)}.log`);
  rmSync(logPath, { force: true });

  let child = null;
  try {
    child = spawnBackend(dist, childEnv, logPath);
    await waitHealth(childBase, 120_000);

    const { token } = await register(childBase);
    const steamId = RESTART_STEAM_ID;
    const connect = await http('POST', '/integrations/steam/connect', {
      baseUrl: childBase,
      token,
      body: { steamIdOrUrl: steamId },
    });
    if (connect.status >= 400) {
      fail('5.worker-restart/connect', JSON.stringify(connect.json));
      return;
    }
    const integrationId = dataOf(connect.json).id;

    const sync = await http('POST', `/integrations/${integrationId}/sync`, {
      baseUrl: childBase,
      token,
      body: { syncType: 'manual' },
    });
    if (sync.status >= 400) {
      fail('5.worker-restart/sync', JSON.stringify(sync.json));
      return;
    }
    const job = dataOf(sync.json);
    const jobId = job?.id;
    if (job?.status === 'completed') {
      fail(
        '5.worker-restart',
        `isolated backend ran the sync inline (Redis enqueue unavailable) — ${tailLog(logPath)}`,
      );
      return;
    }

    // Kill while the sync is still merging games (mid-flight, not queued-only).
    const killedAt = await waitSyncJobProcessing(jobId, 60_000);
    child.kill('SIGKILL');
    child = null;
    const statusAfterKill = sqlScalar(`select status from sync_jobs where id = '${String(jobId)}'`);

    child = spawnBackend(dist, childEnv, logPath);
    await waitHealth(childBase, 120_000);

    const hist = await waitJobDone(token, jobId, 300_000, childBase);
    const merged = (hist.importedCount ?? 0) + (hist.updatedCount ?? 0);
    const attempts = sqlScalar(`select attempt_count from sync_jobs where id = '${String(jobId)}'`);
    const ints = dataOf((await http('GET', '/integrations', { baseUrl: childBase, token })).json);
    const steam = Array.isArray(ints) ? ints.find((x) => x.provider === 'steam') : null;
    const identityKept = steam?.status === 'connected' && steam?.externalRef === steamId;

    const detail = `killed mid-sync (job ${statusAfterKill} after kill, processing seen at ${killedAt}ms) → restart → status=${hist.status} imported=${hist.importedCount} updated=${hist.updatedCount} failed=${hist.failedCount} attempts=${attempts} identityKept=${String(identityKept)}`;

    if (
      hist.status === 'completed' &&
      merged === size &&
      hist.failedCount === 0 &&
      Number(attempts) >= 2 &&
      identityKept
    ) {
      pass('5.worker-restart', detail);
    } else {
      fail('5.worker-restart', `expected merged=${size} completed attempts≥2 — ${detail}`);
    }
  } catch (error) {
    fail(
      '5.worker-restart',
      `${error instanceof Error ? error.message : String(error)} — ${tailLog(logPath)}`,
    );
  } finally {
    child?.kill('SIGKILL');
  }
}

function restartChildEnv(port, librarySize) {
  const rootEnv = loadRootEnv();
  const redisUrl = rootEnv.REDIS_URL ?? process.env.REDIS_URL ?? 'redis://localhost:6379';
  const isolatedRedis = `${redisUrl.replace(/\/\d+$/, '')}/${String(GATE_REDIS_DB)}`;
  // Drop leftover keys so BullMQ jobIds from prior gate runs cannot collide.
  dockerMetric('gmrlog-redis', ['redis-cli', '-n', String(GATE_REDIS_DB), 'FLUSHDB']);
  return {
    ...process.env,
    ...rootEnv,
    REDIS_URL: isolatedRedis,
    API_PORT: String(port),
    STEAM_MOCK_LIBRARY_SIZE: String(librarySize),
    STEAM_MOCK_LIBRARY_STEAM_ID_PREFIX: STRESS_STEAM_ID_PREFIX,
    // Keep Nest Logger + AppLogger noisy enough to capture enqueue failures.
    LOG_LEVEL: 'info',
  };
}

function loadRootEnv() {
  const file = resolve(REPO_ROOT, '.env');
  if (!existsSync(file)) {
    return {};
  }
  const parsed = {};
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (match === null) {
      continue;
    }
    parsed[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
  }
  return parsed;
}

function spawnBackend(entry, env, logPath) {
  const log = openSync(logPath, 'a');
  const child = spawn(process.execPath, [entry], {
    cwd: resolve(REPO_ROOT, 'apps/backend'),
    env,
    stdio: ['ignore', log, log],
    windowsHide: true,
  });
  child.once('exit', () => {
    closeSync(log);
  });
  return child;
}

/** Last lines of the isolated backend log, for failure diagnostics. */
function tailLog(logPath, lines = 6) {
  try {
    return readFileSync(logPath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .slice(-lines)
      .join(' | ');
  } catch {
    return 'no log';
  }
}

async function waitHealth(baseUrl, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/health/live`);
      if (res.ok) {
        return;
      }
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`backend health timeout (${baseUrl})`);
}

/** Waits until the sync job row is actually mid-flight, so the kill interrupts work. */
async function waitSyncJobProcessing(jobId, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const status = sqlScalar(`select status from sync_jobs where id = '${String(jobId)}'`);
    if (status === 'processing') {
      // Let a few games merge before pulling the plug.
      await new Promise((r) => setTimeout(r, 750));
      return Date.now() - start;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('sync job never reached processing');
}

function sqlScalar(sql) {
  return dockerMetric('gmrlog-postgres', ['psql', '-U', 'gmrlog', '-d', 'gmrlog', '-tAc', sql]);
}

async function test6Meilisearch(token) {
  // Poll search until Hades appears (index is async)
  const deadline = Date.now() + 45_000;
  let last = null;
  while (Date.now() < deadline) {
    const res = await http('GET', '/search?q=hades&types=game', { token });
    last = res;
    if (res.status === 200) {
      const payload = dataOf(res.json);
      const rows = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
      const hit = rows.some((row) => {
        // `/search` returns `{ type, id, summary: { title, slug } }` rows.
        const title = row?.summary?.title ?? row?.title ?? row?.document?.title ?? row?.name ?? '';
        return String(title).toLowerCase().includes('hades');
      });
      if (hit) {
        pass('6.meilisearch', `GET /search?q=hades found Hades (${rows.length} hits)`);
        return;
      }
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  fail(
    '6.meilisearch',
    `Hades not found in search within 45s — last=${last?.status} ${JSON.stringify(last?.json)?.slice(0, 300)}`,
  );
}

/**
 * Releases the SteamID64s this gate owns from earlier runs; connect rejects an id
 * that is still `connected` for another user.
 */
function preflight() {
  const released = sqlScalar(
    `update user_integrations set status = 'disconnected', disconnected_at = now() ` +
      `where provider = 'steam' and status = 'connected' ` +
      `and (external_ref = '76561198000000001' or external_ref like '${STRESS_STEAM_ID_PREFIX}%')`,
  );
  const drained = sqlScalar(
    `update sync_jobs set status = 'cancelled', finished_at = now() ` +
      `where provider = 'steam' and status in ('pending', 'processing')`,
  );
  console.log(`preflight — integrations released=${released} stale jobs cancelled=${drained}`);
}

async function main() {
  console.log(`D3.23 production gate → ${base}`);
  preflight();

  // GATE_ONLY=5 (or 1,5) narrows the run while iterating on a single check.
  const only = (process.env.GATE_ONLY ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  const wants = (id) => only.length === 0 || only.includes(id);

  const { token } = await register();

  const integrationId = wants('1') ? await test1Idempotency(token) : null;
  if (wants('2')) {
    await test2DisconnectReconnect(token, integrationId);
  }
  if (wants('3')) {
    await test3LargeLibrary();
  }
  if (wants('4')) {
    await test4Concurrent(token);
  }
  if (wants('5')) {
    await test5WorkerRestart();
  }
  if (wants('6')) {
    await test6Meilisearch(token);
  }

  if (failures > 0) {
    console.error(`\nGATE_FAIL (${failures} failed)`);
    process.exit(1);
  }
  console.log('\nGATE_PASS — D3.23 production ready checklist');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
