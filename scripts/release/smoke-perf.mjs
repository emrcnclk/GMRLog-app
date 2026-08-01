#!/usr/bin/env node
/**
 * Performance benchmarks — login · refresh · feed · search · upload grant · upload confirm.
 * Reports p50 / p95 / p99 (ms).
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import {
  DEFAULTS,
  TINY_PNG,
  fail,
  httpJson,
  log,
  pass,
  registerUser,
  summarizeLatencies,
} from './lib/common.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const require = createRequire(path.join(repoRoot, 'apps/backend/package.json'));
const ITERATIONS = Number(process.env.SMOKE_PERF_ITERATIONS ?? 20);
/** Auth class is 5/min — space login/refresh samples to keep benchmarks valid. */
const AUTH_GAP_MS = Number(process.env.SMOKE_PERF_AUTH_GAP_MS ?? 15_000);

async function timeMs(fn, { retryRateLimit = false } = {}) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      const start = performance.now();
      await fn();
      return Math.round(performance.now() - start);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const limited = message.includes('429') || message.includes('RATE_LIMITED');
      if (!retryRateLimit || !limited || attempt === 7) {
        throw error;
      }
      log('perf', `rate limited before sample — waiting (${attempt + 1}/8)`);
      await delay(AUTH_GAP_MS);
    }
  }
  throw new Error('timeMs: exhausted');
}

async function measure(name, fn, { gapMs = 0, retryRateLimit = false } = {}) {
  const samples = [];
  for (let i = 0; i < ITERATIONS; i += 1) {
    if (i > 0 && gapMs > 0) {
      await delay(gapMs);
    }
    samples.push(await timeMs(fn, { retryRateLimit }));
  }
  const summary = summarizeLatencies(samples);
  log(
    name,
    `p50=${summary.p50} p95=${summary.p95} p99=${summary.p99} max=${summary.max} n=${summary.count}`,
  );
  return { name, ...summary, samples };
}

async function main() {
  const api = DEFAULTS.apiBase;
  const user = await registerUser(api);
  let tokens = { accessToken: user.accessToken, refreshToken: user.refreshToken };

  // Register consumed one auth slot — wait before login benchmarks.
  await delay(AUTH_GAP_MS);

  const results = [];

  results.push(
    await measure(
      'login',
      async () => {
        // Direct login without inner wait so gaps own the pacing.
        const { response, body, data } = await httpJson(`${api}/sessions`, {
          method: 'POST',
          headers: { 'idempotency-key': `login-perf-${Date.now()}-${Math.random()}` },
          body: JSON.stringify({ email: user.email, password: user.password }),
        });
        if (!response.ok) {
          throw new Error(`login failed (${response.status}): ${JSON.stringify(body)}`);
        }
        tokens = data;
      },
      { gapMs: AUTH_GAP_MS, retryRateLimit: true },
    ),
  );

  await delay(AUTH_GAP_MS);

  results.push(
    await measure(
      'refresh',
      async () => {
        const { response, body, data } = await httpJson(`${api}/sessions/refresh`, {
          method: 'POST',
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });
        if (!response.ok) {
          throw new Error(`refresh ${response.status}: ${JSON.stringify(body)}`);
        }
        tokens = data;
      },
      { gapMs: AUTH_GAP_MS, retryRateLimit: true },
    ),
  );

  results.push(
    await measure('feed', async () => {
      const { response } = await httpJson(`${api}/feed`, {
        headers: { authorization: `Bearer ${tokens.accessToken}` },
      });
      if (!response.ok && response.status !== 404) {
        // Some deployments may use /activity — try fallback
        const alt = await httpJson(`${api}/activity`, {
          headers: { authorization: `Bearer ${tokens.accessToken}` },
        });
        if (!alt.response.ok) {
          throw new Error(`feed/activity ${response.status}/${alt.response.status}`);
        }
      }
    }),
  );

  results.push(
    await measure('search', async () => {
      const { response } = await httpJson(`${api}/search?q=gaming`, {
        headers: { authorization: `Bearer ${tokens.accessToken}` },
      });
      if (!response.ok) {
        throw new Error(`search ${response.status}`);
      }
    }),
  );

  // Grant + confirm need unique grants; measure separately with fresh grants
  const grantSamples = [];
  const confirmSamples = [];
  for (let i = 0; i < ITERATIONS; i += 1) {
    const grantStart = performance.now();
    const grantRes = await httpJson(`${api}/uploads/grants`, {
      method: 'POST',
      headers: { authorization: `Bearer ${tokens.accessToken}` },
      body: JSON.stringify({
        purpose: 'avatar',
        contentType: 'image/png',
        byteSize: TINY_PNG.length,
      }),
    });
    grantSamples.push(Math.round(performance.now() - grantStart));
    if (!grantRes.response.ok) {
      fail('upload-grant', JSON.stringify(grantRes.body));
    }
    const grant = grantRes.data;
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    const s3 = new S3Client({
      region: process.env.S3_REGION ?? 'us-east-1',
      endpoint: DEFAULTS.s3Endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: DEFAULTS.s3AccessKey,
        secretAccessKey: DEFAULTS.s3SecretKey,
      },
    });
    // Presigned PUT can lose Content-Type on MinIO; SDK put keeps MIME valid for confirm.
    await s3.send(
      new PutObjectCommand({
        Bucket: DEFAULTS.s3Bucket,
        Key: grant.storageKey,
        Body: TINY_PNG,
        ContentType: 'image/png',
        ContentLength: TINY_PNG.length,
      }),
    );
    const confirmStart = performance.now();
    const confirmRes = await httpJson(`${api}/uploads/confirmations`, {
      method: 'POST',
      headers: { authorization: `Bearer ${tokens.accessToken}` },
      body: JSON.stringify({ grantId: grant.grantId, storageKey: grant.storageKey }),
    });
    confirmSamples.push(Math.round(performance.now() - confirmStart));
    if (!confirmRes.response.ok) {
      fail('upload-confirm', JSON.stringify(confirmRes.body));
    }
  }
  const grantSummary = { name: 'upload-grant', ...summarizeLatencies(grantSamples) };
  const confirmSummary = { name: 'upload-confirm', ...summarizeLatencies(confirmSamples) };
  log('upload-grant', `p50=${grantSummary.p50} p95=${grantSummary.p95} p99=${grantSummary.p99}`);
  log(
    'upload-confirm',
    `p50=${confirmSummary.p50} p95=${confirmSummary.p95} p99=${confirmSummary.p99}`,
  );
  results.push(grantSummary, confirmSummary);

  const outDir = path.join(__dirname, '../../docs/06_RELEASE');
  mkdirSync(outDir, { recursive: true });
  const reportPath = path.join(outDir, 'PERF_RESULTS.json');
  writeFileSync(
    reportPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2),
  );
  log('perf', `wrote ${reportPath}`);
  pass('perf');
  console.log('SMOKE_PERF PASS');
}

main().catch((error) => {
  console.error('SMOKE_PERF FAIL');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
