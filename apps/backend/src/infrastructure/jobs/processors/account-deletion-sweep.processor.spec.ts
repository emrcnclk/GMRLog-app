import type { Job } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';

import {
  JOB_MAINTENANCE_ACCOUNT_DELETION_SWEEP,
  JOB_MAINTENANCE_SESSION_CLEANUP,
} from '../job-names';
import { createJobPayload } from '../job-payload';

import { AccountDeletionSweepProcessor } from './account-deletion-sweep.processor';

describe('AccountDeletionSweepProcessor', () => {
  it('runs the expired-deletion sweep for its own job', async () => {
    const deletions = {
      runExpiredDeletionSweep: vi.fn().mockResolvedValue({ erased: 0, failed: 0 }),
    };
    const processor = new AccountDeletionSweepProcessor(deletions as never);

    expect(processor.supports(JOB_MAINTENANCE_ACCOUNT_DELETION_SWEEP)).toBe(true);
    await processor.process({
      data: createJobPayload({}, { idempotencyKey: 'maintenance.account-deletion.sweep' }),
    } as Job);
    expect(deletions.runExpiredDeletionSweep).toHaveBeenCalledOnce();
  });

  it('claims no other maintenance job', () => {
    const processor = new AccountDeletionSweepProcessor({} as never);

    expect(processor.supports(JOB_MAINTENANCE_SESSION_CLEANUP)).toBe(false);
  });
});
