import { describe, expect, it } from 'vitest';

import { TokenBucketRateLimiter } from './rate-limiter';

describe('TokenBucketRateLimiter', () => {
  it('grants the burst immediately without waiting', async () => {
    let now = 0;
    const limiter = new TokenBucketRateLimiter(4, 4, () => now);

    for (let i = 0; i < 4; i += 1) {
      await limiter.acquire();
    }

    expect(limiter.pending).toBe(0);
    limiter.dispose();
  });

  it('queues once the burst is exhausted', async () => {
    let now = 0;
    const limiter = new TokenBucketRateLimiter(1, 1, () => now);

    await limiter.acquire();
    let released = false;
    const waiting = limiter.acquire().then(() => {
      released = true;
    });

    // Nothing has elapsed, so the second caller must still be waiting.
    expect(released).toBe(false);
    expect(limiter.pending).toBe(1);

    now += 1000;
    await waiting;
    expect(released).toBe(true);
    limiter.dispose();
  });

  it('refills proportionally to elapsed time', async () => {
    let now = 0;
    const limiter = new TokenBucketRateLimiter(2, 2, () => now);

    await limiter.acquire();
    await limiter.acquire();

    now += 1000; // two tokens back at 2 rps
    await limiter.acquire();
    await limiter.acquire();

    expect(limiter.pending).toBe(0);
    limiter.dispose();
  });

  it('never accumulates beyond the burst ceiling', async () => {
    let now = 0;
    const limiter = new TokenBucketRateLimiter(2, 2, () => now);

    now += 60_000; // a long idle period
    await limiter.acquire();
    await limiter.acquire();

    const third = limiter.acquire();
    expect(limiter.pending).toBe(1);

    now += 1000;
    await third;
    limiter.dispose();
  });

  it('releases waiters on dispose so shutdown is not held open', async () => {
    let now = 0;
    const limiter = new TokenBucketRateLimiter(1, 1, () => now);

    await limiter.acquire();
    const waiting = limiter.acquire();
    expect(limiter.pending).toBe(1);

    limiter.dispose();
    await expect(waiting).resolves.toBeUndefined();
    expect(limiter.pending).toBe(0);
  });
});
