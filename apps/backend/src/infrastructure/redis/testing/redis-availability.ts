import { Redis } from 'ioredis';

/**
 * The URL a real-Redis test connects to, matching what CI's service exposes.
 */
export const TEST_REDIS_URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';

/**
 * Whether a real Redis answers, for the handful of specs that deliberately
 * use one rather than a fake.
 *
 * A spec that needs a live server and does not say so fails as a bare
 * `Test timed out in 5000ms`, which names neither Redis nor the container —
 * indistinguishable from a broken assertion, and the local container is
 * documented (CLAUDE.md, "Known environment traps") as stopping on its own.
 * Probing lets such a spec skip with a reason locally while still running
 * everywhere Redis is provisioned.
 */
export async function isRedisReachable(timeoutMs = 1500): Promise<boolean> {
  const client = new Redis(TEST_REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 0,
    retryStrategy: () => null,
    connectTimeout: timeoutMs,
  });
  // A refused connection surfaces as an 'error' event as well as a rejection;
  // without a listener ioredis reports it as unhandled and fails the run.
  client.on('error', () => undefined);
  try {
    await client.connect();
    await client.ping();
    return true;
  } catch {
    return false;
  } finally {
    client.disconnect();
  }
}

/**
 * CI always provisions Redis (`.github/workflows/ci.yml`), so a probe failing
 * there is a real fault and must not be skipped away.
 */
export function shouldSkipWithoutRedis(reachable: boolean): boolean {
  return !reachable && process.env.CI !== 'true';
}
