#!/usr/bin/env node
/**
 * D3.25 — manually triggers one game.metadata.backfill.scan pass so the
 * currently-running worker (real IGDB/Steam credentials) picks up games
 * whose earlier "skipped" completion is blocking the repeatable's normal
 * deterministic-jobId re-enqueue. One-off; deleted after validation.
 */
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

import { Queue } from 'bullmq';
import { config as loadEnv } from 'dotenv';
import IORedis from 'ioredis';

loadEnv({ path: resolve(process.cwd(), '../../.env') });

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});
const queue = new Queue('game.metadata', { connection });

const jobId = `manual-backfill-${Date.now()}`;
await queue.add(
  'game.metadata.backfill.scan',
  {
    schemaVersion: 1,
    correlationId: randomUUID(),
    idempotencyKey: jobId,
    enqueuedAt: new Date().toISOString(),
    data: {},
  },
  { jobId, attempts: 1, removeOnComplete: true, removeOnFail: false },
);

console.log(`Enqueued manual backfill scan: ${jobId}`);
await queue.close();
await connection.quit();
