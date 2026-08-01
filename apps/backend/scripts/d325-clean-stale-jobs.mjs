#!/usr/bin/env node
/**
 * D3.25 — one-off cleanup. Earlier "skipped" job completions (recorded before
 * IGDB/Steam credentials were configured in this session) are still holding
 * their deterministic BullMQ job ids as "completed", so the backfill scan's
 * re-enqueue of the same gameId+reason is silently deduped and never re-runs.
 *
 * This removes completed/failed job records from the game.metadata queue so
 * a fresh backfill scan can actually issue new jobs. Safe: it only touches
 * BullMQ bookkeeping, never Postgres. Deleted after validation.
 */
import { resolve } from 'node:path';

import { Queue } from 'bullmq';
import { config as loadEnv } from 'dotenv';
import IORedis from 'ioredis';

loadEnv({ path: resolve(process.cwd(), '../../.env') });

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});
const queue = new Queue('game.metadata', { connection });

const completed = await queue.clean(0, 100000, 'completed');
const failed = await queue.clean(0, 100000, 'failed');
console.log(`Cleaned ${completed.length} completed job records`);
console.log(`Cleaned ${failed.length} failed job records`);

await queue.close();
await connection.quit();
