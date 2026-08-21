#!/usr/bin/env node
/**
 * Shared helpers for D3.20 release smoke runners.
 */

import { createConnection } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

export const DEFAULTS = {
  apiBase: process.env.GMRLOG_API_BASE ?? 'http://127.0.0.1:4000/api/v1',
  redisUrl: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
  databaseUrl:
    process.env.DATABASE_URL ?? 'postgresql://gmrlog:gmrlog@127.0.0.1:5433/gmrlog?schema=public',
  s3Endpoint: process.env.S3_ENDPOINT ?? 'http://127.0.0.1:9000',
  s3Bucket: process.env.S3_BUCKET ?? 'gmrlog',
  s3AccessKey: process.env.S3_ACCESS_KEY ?? process.env.MINIO_ROOT_USER ?? 'gmrlog',
  s3SecretKey: process.env.S3_SECRET_KEY ?? process.env.MINIO_ROOT_PASSWORD ?? 'gmrlogsecret',
  meiliHost: process.env.MEILI_HOST ?? 'http://127.0.0.1:7700',
  meiliKey: process.env.MEILI_API_KEY ?? 'gmrlog-dev-master-key',
  mailpitApi: process.env.MAILPIT_API ?? 'http://127.0.0.1:8025',
  smtpHost: process.env.SMTP_HOST ?? '127.0.0.1',
  smtpPort: Number(process.env.SMTP_PORT ?? 1025),
};

export function log(step, message) {
  console.log(`[${step}] ${message}`);
}

export function pass(step) {
  console.log(`[${step}] PASS`);
}

export function fail(step, error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${step}] FAIL — ${message}`);
  throw new Error(`${step}: ${message}`);
}

export async function tcpProbe(host, port, timeoutMs = 2_000) {
  await new Promise((resolve, reject) => {
    const socket = createConnection({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error(`timeout connecting ${host}:${port}`));
    }, timeoutMs);
    socket.once('connect', () => {
      clearTimeout(timer);
      socket.end();
      resolve();
    });
    socket.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

export async function httpJson(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      accept: 'application/json',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let body = null;
  if (text.length > 0) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { response, body, text, data: unwrapData(body) };
}

/** S1 envelope: `{ data, meta }` → `data` (passthrough for non-enveloped bodies). */
export function unwrapData(body) {
  if (body !== null && typeof body === 'object' && !Array.isArray(body) && 'data' in body) {
    return body.data;
  }
  return body;
}

export async function waitFor(label, fn, { timeoutMs = 60_000, intervalMs = 1_000 } = {}) {
  const started = Date.now();
  let lastError = null;
  while (Date.now() - started < timeoutMs) {
    try {
      const value = await fn();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await delay(intervalMs);
  }
  const detail =
    lastError instanceof Error ? lastError.message : String(lastError ?? 'condition unmet');
  throw new Error(`${label} timed out after ${timeoutMs}ms — ${detail}`);
}

export function percentile(sortedAsc, p) {
  if (sortedAsc.length === 0) return 0;
  const rank = Math.ceil((p / 100) * sortedAsc.length) - 1;
  return sortedAsc[Math.max(0, Math.min(sortedAsc.length - 1, rank))];
}

export function summarizeLatencies(samplesMs) {
  const sorted = [...samplesMs].sort((a, b) => a - b);
  return {
    count: sorted.length,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    max: sorted[sorted.length - 1] ?? 0,
  };
}

/** Minimal valid 1×1 PNG. */
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

export function uniqueHandle(prefix = 'smoke') {
  const stamp = Date.now().toString(36).slice(-6);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${prefix}_${stamp}${rand}`.slice(0, 24);
}

export async function withAuthRateLimitRetry(
  fn,
  { attempts = 8, delayMs = 15_000, label = 'auth' } = {},
) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const limited = message.includes('429') || message.includes('RATE_LIMITED');
      if (!limited || i === attempts - 1) {
        throw error;
      }
      log(label, `rate limited — waiting (${i + 1}/${attempts})`);
      await delay(delayMs);
    }
  }
  throw new Error(`${label}: rate-limit retries exhausted`);
}

/**
 * 12.4 — the documents a new account must accept, read from the running server
 * rather than hardcoded here.
 *
 * Hardcoding a version would make every smoke run start failing the moment a
 * legal document is revised, and worse, would hide the failure that actually
 * matters: registration refusing a stale acceptance is correct behaviour, and a
 * fixture that pins an old version would report it as a broken endpoint.
 */
export async function currentLegalAcceptance(apiBase) {
  const { response, body, data } = await httpJson(`${apiBase}/legal`, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`legal listing failed (${response.status}): ${JSON.stringify(body)}`);
  }
  return data
    .filter((document) => document.requiresAcceptance)
    .map((document) => ({
      documentId: document.id,
      version: document.version,
      locale: document.locale,
    }));
}

export async function registerUser(apiBase, overrides = {}) {
  const handle = overrides.handle ?? uniqueHandle();
  const acceptedLegalDocuments =
    overrides.acceptedLegalDocuments ?? (await currentLegalAcceptance(apiBase));
  const email = overrides.email ?? `${handle}@smoke.gmrlog.local`;
  const password = overrides.password ?? 'SmokeTestPass12';
  return withAuthRateLimitRetry(
    async () => {
      const { response, body, data } = await httpJson(`${apiBase}/sessions/register`, {
        method: 'POST',
        headers: { 'idempotency-key': `reg-${handle}` },
        body: JSON.stringify({
          email,
          password,
          displayName: overrides.displayName ?? 'Smoke Tester',
          handle,
          acceptedLegalDocuments,
        }),
      });
      if (!response.ok) {
        throw new Error(`register failed (${response.status}): ${JSON.stringify(body)}`);
      }
      return { email, password, handle, ...data };
    },
    { label: 'register' },
  );
}

export async function login(apiBase, email, password) {
  return withAuthRateLimitRetry(
    async () => {
      const { response, body, data } = await httpJson(`${apiBase}/sessions`, {
        method: 'POST',
        headers: { 'idempotency-key': `login-${email}-${Date.now()}` },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        throw new Error(`login failed (${response.status}): ${JSON.stringify(body)}`);
      }
      return data;
    },
    { label: 'login' },
  );
}

export function resolveModule(specifier) {
  return import(specifier);
}
