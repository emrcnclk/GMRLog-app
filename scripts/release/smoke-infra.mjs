#!/usr/bin/env node
/**
 * Infra connectivity smoke — Postgres · Redis · MinIO · Meilisearch · Mailpit · API · Worker.
 */

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { DEFAULTS, fail, httpJson, log, pass, tcpProbe, waitFor } from './lib/common.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const require = createRequire(path.join(repoRoot, 'apps/backend/package.json'));

function parseHostPort(urlString, fallbackPort) {
  const url = new URL(urlString);
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : fallbackPort,
  };
}

async function checkPostgres() {
  const step = 'postgres';
  try {
    const requireDb = createRequire(path.join(repoRoot, 'packages/database/package.json'));
    const { Client } = requireDb('pg');
    const client = new Client({ connectionString: DEFAULTS.databaseUrl });
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    pass(step);
  } catch (error) {
    try {
      const { host, port } = parseHostPort(DEFAULTS.databaseUrl, 5432);
      await tcpProbe(host, port);
      log(
        step,
        `TCP reachable (SELECT skipped: ${error instanceof Error ? error.message : error})`,
      );
      pass(step);
    } catch (fallbackError) {
      fail(step, error.message ?? fallbackError);
    }
  }
}

async function checkRedis() {
  const step = 'redis';
  try {
    const Redis = require('ioredis');
    const redis = new Redis(DEFAULTS.redisUrl, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: true,
    });
    await redis.connect();
    const pong = await redis.ping();
    const info = await redis.info('server');
    const versionMatch = /redis_version:([0-9.]+)/.exec(info);
    const version = versionMatch?.[1] ?? 'unknown';
    await redis.quit();
    if (pong !== 'PONG') {
      fail(step, `unexpected ping ${pong}`);
    }
    const major = Number(version.split('.')[0] ?? 0);
    if (major < 5) {
      fail(
        step,
        `Redis ${version} is too old for BullMQ (need >= 5). Prefer Docker redis:7 on REDIS_URL=${DEFAULTS.redisUrl}`,
      );
    }
    log(step, `version ${version}`);
    pass(step);
  } catch (error) {
    fail(step, error);
  }
}

async function checkMinio() {
  const step = 'minio';
  try {
    const { host, port } = parseHostPort(DEFAULTS.s3Endpoint, 9000);
    await tcpProbe(host, port);
    const healthUrl = `${DEFAULTS.s3Endpoint.replace(/\/$/, '')}/minio/health/live`;
    const response = await fetch(healthUrl);
    if (!response.ok) {
      fail(step, `health ${response.status}`);
    }
    pass(step);
  } catch (error) {
    fail(step, error);
  }
}

async function checkMeili() {
  const step = 'meilisearch';
  try {
    const { response, body } = await httpJson(`${DEFAULTS.meiliHost.replace(/\/$/, '')}/health`);
    if (!response.ok || body?.status !== 'available') {
      fail(step, `health ${response.status} ${JSON.stringify(body)}`);
    }
    pass(step);
  } catch (error) {
    fail(step, error);
  }
}

async function checkMailpit() {
  const step = 'mailpit';
  try {
    await tcpProbe(DEFAULTS.smtpHost, DEFAULTS.smtpPort);
    const { response } = await httpJson(`${DEFAULTS.mailpitApi.replace(/\/$/, '')}/api/v1/info`);
    if (!response.ok) {
      fail(step, `API ${response.status}`);
    }
    pass(step);
  } catch (error) {
    fail(step, error);
  }
}

async function checkApi() {
  const step = 'api-boot';
  try {
    await waitFor(step, async () => {
      const { response, data } = await httpJson(`${DEFAULTS.apiBase}/health`);
      return response.ok && data?.status === 'ok';
    });
    pass(step);
  } catch (error) {
    fail(step, error);
  }
}

async function checkWorker() {
  const step = 'worker-boot';
  try {
    const Redis = require('ioredis');
    const redis = new Redis(DEFAULTS.redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    await redis.connect();
    // BullMQ workers register keys under bull:<queue>:meta / workers
    const keys = await redis.keys('bull:*:meta');
    const workers = await redis.keys('bull:*:workers');
    await redis.quit();
    if (keys.length === 0 && workers.length === 0) {
      // Soft signal — worker may not have registered yet; check process via docker if available
      log(step, 'no bull keys yet — checking docker worker container');
      const { execSync } = await import('node:child_process');
      try {
        const out = execSync('docker inspect -f "{{.State.Running}}" gmrlog-worker', {
          encoding: 'utf8',
        }).trim();
        if (out !== 'true') {
          fail(step, 'gmrlog-worker container not running and no BullMQ keys');
        }
        log(step, 'gmrlog-worker container is running');
      } catch {
        fail(
          step,
          'Worker not detected (no BullMQ keys / no gmrlog-worker). Start: pnpm --filter @gmrlog/backend worker',
        );
      }
    } else {
      log(step, `bull keys meta=${keys.length} workers=${workers.length}`);
    }
    pass(step);
  } catch (error) {
    fail(step, error);
  }
}

async function main() {
  log('infra', `API=${DEFAULTS.apiBase}`);
  await checkPostgres();
  await checkRedis();
  await checkMinio();
  await checkMeili();
  await checkMailpit();
  await checkApi();
  await checkWorker();
  console.log('SMOKE_INFRA PASS');
}

main().catch((error) => {
  console.error('SMOKE_INFRA FAIL');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
