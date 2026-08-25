import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { afterEach, describe, expect, it } from 'vitest';

import {
  isRedisReachable,
  shouldSkipWithoutRedis,
  TEST_REDIS_URL,
} from '../redis/testing/redis-availability';

import { JobsService } from './jobs.service';

/**
 * Regression test for the 10.1 "Redis is already connecting/connected" flake.
 *
 * Uses the REAL ioredis client and a REAL BullMQ Worker against the REAL
 * local Redis (docker gmrlog-redis) — no mocks — because the bug only exists
 * in the interaction between ioredis's actual status machine and BullMQ's
 * actual RedisConnection, not in anything a fake could stand in for.
 *
 * `IntegrationsWorkerService.onModuleInit` builds five BullMQ Workers sharing
 * one JOBS_CONNECTION Redis client; each Worker independently brings that
 * shared client up via BullMQ's own RedisConnection.waitUntilReady, which is
 * race-safe (checks status once, only calls connect() from 'wait', otherwise
 * awaits the 'ready'/'error'/'end' events). JobsService.getQueue() used to
 * duplicate that connect logic by hand with a guard that missed ioredis's
 * 'connect' status — the instant between the TCP handshake completing and
 * the 'ready' event firing. A getQueue() call landing in exactly that window
 * (e.g. GameMetadataPublisher enqueueing work for a newly-created game
 * during integration sync, moments after IntegrationsWorkerService's own
 * Workers kicked off the first real connect) called connect() a second time,
 * which ioredis rejects with "Redis is already connecting/connected" — as an
 * unhandled rejection, since the call was fire-and-forget (`void
 * this.connection.connect()`).
 *
 * The fix removed the hand-rolled guard entirely: `new Queue(...)` already
 * brings the connection up the same safe way Worker does, so a second,
 * independent connect race can't happen. This test forces a getQueue() call
 * into the 'connect' window on every run (via the 'connect' event, not
 * timing luck) and asserts no unhandled rejection occurs.
 *
 * Because the real server is the point, this test skips itself when none
 * answers rather than timing out — but only off CI, which always provisions
 * one, so an unreachable Redis there stays a failure. The probe runs inside
 * the test rather than beside `describe`: this package compiles as CommonJS,
 * where a top-level `await` is a `tsc` error even though vitest's own esbuild
 * transform accepts it.
 */
describe('10.1 JobsService Redis-connect race', () => {
  let connection: Redis | undefined;
  let worker: Worker | undefined;

  afterEach(async () => {
    await worker?.close();
    connection?.disconnect();
  });

  it('getQueue() during ioredis "connect" status does not race a second connect()', async (ctx) => {
    const reachable = await isRedisReachable();
    ctx.skip(
      shouldSkipWithoutRedis(reachable),
      `no Redis at ${TEST_REDIS_URL} — this test needs a real server`,
    );
    if (!reachable) {
      // Not skipped and not reachable means CI, which provisions Redis — a
      // real fault, and worth naming rather than leaving as the bare 5s
      // timeout the connect retry below would otherwise produce.
      throw new Error(`no Redis at ${TEST_REDIS_URL}, which CI is expected to provide`);
    }

    connection = new Redis(TEST_REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    const service = new JobsService(connection);

    const rejections: unknown[] = [];
    const onRejection = (reason: unknown) => rejections.push(reason);
    process.on('unhandledRejection', onRejection);

    const statuses: string[] = [];
    connection.on('connect', () => {
      // Mirrors the real race: a second, independent consumer calling
      // getQueue() while ioredis is mid-transition from 'connect' to
      // 'ready', deterministically instead of relying on timing luck.
      statuses.push(connection?.status ?? 'unknown');
      service.getQueue('race-repro-queue');
    });

    // Same shape as IntegrationsWorkerService.onModuleInit: a real Worker
    // sharing the connection triggers the first, legitimate connect().
    worker = new Worker('race-repro-queue', async () => undefined, {
      connection,
      concurrency: 1,
    });

    await new Promise((resolve) => connection?.once('ready', resolve));
    // Let any fire-and-forget rejection from a reintroduced bug land.
    await new Promise((resolve) => setTimeout(resolve, 50));

    process.off('unhandledRejection', onRejection);

    // Confirms the test actually exercised the vulnerable window, not that
    // it silently no-opped.
    expect(statuses).toContain('connect');
    expect(rejections).toHaveLength(0);
  });
});
