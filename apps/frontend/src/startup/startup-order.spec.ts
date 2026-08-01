import { describe, expect, it } from 'vitest';

import { runParallelBootstrap, STARTUP_PROVIDER_ORDER } from './startup-order';

describe('startup optimization contracts', () => {
  it('documents provider order for PersistQuery before Auth', () => {
    const queryIndex = STARTUP_PROVIDER_ORDER.findIndex((item) =>
      item.includes('AppQueryProvider'),
    );
    const authIndex = STARTUP_PROVIDER_ORDER.findIndex((item) => item === 'AuthProvider');
    expect(queryIndex).toBeGreaterThan(-1);
    expect(authIndex).toBeGreaterThan(queryIndex);
  });

  it('runs independent bootstrap tasks in parallel', async () => {
    const order: string[] = [];
    await runParallelBootstrap([
      async () => {
        order.push('a-start');
        await Promise.resolve();
        order.push('a-end');
      },
      async () => {
        order.push('b-start');
        await Promise.resolve();
        order.push('b-end');
      },
    ]);
    expect(order).toContain('a-start');
    expect(order).toContain('b-start');
    expect(order).toContain('a-end');
    expect(order).toContain('b-end');
  });
});
