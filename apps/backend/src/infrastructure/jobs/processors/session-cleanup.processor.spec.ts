import { describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';

import { createJobPayload } from '../job-payload';
import { JOB_MAINTENANCE_SESSION_CLEANUP } from '../job-names';
import { SessionCleanupProcessor } from './session-cleanup.processor';

describe('SessionCleanupProcessor', () => {
  it('runs session cleanup for the maintenance job', async () => {
    const maintenance = { runSessionCleanup: vi.fn().mockResolvedValue(undefined) };
    const processor = new SessionCleanupProcessor(maintenance as never);

    expect(processor.supports(JOB_MAINTENANCE_SESSION_CLEANUP)).toBe(true);
    await processor.process({
      data: createJobPayload({}, { idempotencyKey: 'maintenance.session.cleanup' }),
    } as Job);
    expect(maintenance.runSessionCleanup).toHaveBeenCalledOnce();
  });
});
