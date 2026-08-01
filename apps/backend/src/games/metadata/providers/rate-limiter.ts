/**
 * In-process token bucket (D3.25 — docs/18_CATALOG/CATALOG_OPERATIONS.md §3).
 *
 * Providers await a token before every outbound call so a backfill sweep cannot
 * exceed the provider's documented request ceiling. The bucket is per-process:
 * running N worker replicas multiplies effective throughput by N, so
 * `*_RATE_LIMIT_RPS` must be divided by the replica count before scaling out.
 */
export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefillMs: number;
  private queue: (() => void)[] = [];
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly ratePerSecond: number,
    private readonly burst: number = Math.max(1, Math.ceil(ratePerSecond)),
    private readonly now: () => number = () => Date.now(),
  ) {
    this.tokens = this.burst;
    this.lastRefillMs = this.now();
  }

  /** Resolves once a token is available. */
  async acquire(): Promise<void> {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }
    await new Promise<void>((resolve) => {
      this.queue.push(resolve);
      this.scheduleDrain();
    });
  }

  /** Test seam — pending waiter count. */
  get pending(): number {
    return this.queue.length;
  }

  /** Release timers so a worker shutdown is not held open. */
  dispose(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const waiters = this.queue;
    this.queue = [];
    for (const resolve of waiters) {
      resolve();
    }
  }

  private refill(): void {
    const nowMs = this.now();
    const elapsedMs = nowMs - this.lastRefillMs;
    if (elapsedMs <= 0) {
      return;
    }
    this.lastRefillMs = nowMs;
    this.tokens = Math.min(this.burst, this.tokens + (elapsedMs / 1000) * this.ratePerSecond);
  }

  private scheduleDrain(): void {
    if (this.timer !== null) {
      return;
    }
    const intervalMs = Math.max(10, Math.ceil(1000 / this.ratePerSecond));
    this.timer = setTimeout(() => {
      this.timer = null;
      this.drain();
    }, intervalMs);
    this.timer.unref();
  }

  private drain(): void {
    this.refill();
    while (this.tokens >= 1 && this.queue.length > 0) {
      const resolve = this.queue.shift();
      if (resolve === undefined) {
        break;
      }
      this.tokens -= 1;
      resolve();
    }
    if (this.queue.length > 0) {
      this.scheduleDrain();
    }
  }
}
