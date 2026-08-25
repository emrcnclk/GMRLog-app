import { describe, expect, it, vi } from 'vitest';

import {
  JOB_GAME_METADATA_BACKFILL_SCAN,
  JOB_GAME_METADATA_REFRESH_SCAN,
  JOB_MAINTENANCE_ACCOUNT_DELETION_SWEEP,
  JOB_MAINTENANCE_NOTIFICATION_CLEANUP,
  JOB_MAINTENANCE_SESSION_CLEANUP,
  JOB_MAINTENANCE_UPLOAD_CLEANUP,
} from './job-names';
import { toBullJobId } from './bull-job-id';
import { JobsService } from './jobs.service';
import { QUEUE_GAME_METADATA, QUEUE_MAINTENANCE } from './queue-names';
import { SchedulerService } from './scheduler.service';

function createScheduler(): {
  scheduler: SchedulerService;
  add: ReturnType<typeof vi.fn>;
  jobs: JobsService;
} {
  const add = vi.fn().mockResolvedValue(undefined);
  const jobs = { getQueue: vi.fn().mockReturnValue({ add }) } as unknown as JobsService;
  return { scheduler: new SchedulerService(jobs), add, jobs };
}

/**
 * Registered jobs keyed by name.
 *
 * These assertions used to slice `add.mock.calls` positionally, which made
 * adding a job in the middle of the list fail three unrelated tests for no
 * reason other than its index. What they mean is "this job is registered with
 * this pattern", so that is what they check now.
 */
function registered(
  add: ReturnType<typeof vi.fn>,
): Map<string, { pattern: string; jobId: string }> {
  return new Map(
    add.mock.calls.map((call) => [
      call[0] as string,
      {
        pattern: (call[2] as { repeat: { pattern: string } }).repeat.pattern,
        jobId: (call[2] as { jobId: string }).jobId,
      },
    ]),
  );
}

describe('SchedulerService', () => {
  it('registers repeating maintenance jobs on boot', async () => {
    const { scheduler, add, jobs } = createScheduler();

    await scheduler.onModuleInit();

    expect(jobs.getQueue).toHaveBeenCalledWith(QUEUE_MAINTENANCE);
    const jobs_ = registered(add);
    expect([...jobs_.keys()]).toEqual(
      expect.arrayContaining([
        JOB_MAINTENANCE_UPLOAD_CLEANUP,
        JOB_MAINTENANCE_NOTIFICATION_CLEANUP,
        JOB_MAINTENANCE_SESSION_CLEANUP,
      ]),
    );
  });

  // 12.6 follow-up — without this the 30-day promise is only kept for players
  // who come back to sign in; `enforceGracePeriod` never runs for anyone else.
  it('registers the expired-account deletion sweep, daily', async () => {
    const { scheduler, add } = createScheduler();

    await scheduler.onModuleInit();

    expect(registered(add).get(JOB_MAINTENANCE_ACCOUNT_DELETION_SWEEP)).toEqual({
      pattern: '30 3 * * *',
      // `toBullJobId` swaps colons for hyphens — BullMQ rejects `:` in a job id.
      jobId: toBullJobId('repeat:maintenance.account-deletion.sweep'),
    });
  });

  // D3.25 — docs/18_CATALOG/METADATA_QUEUES.md §4–5
  it('registers the catalog backfill and refresh scans', async () => {
    const { scheduler, add, jobs } = createScheduler();

    await scheduler.onModuleInit();

    expect(jobs.getQueue).toHaveBeenCalledWith(QUEUE_GAME_METADATA);
    expect([...registered(add).keys()]).toEqual(
      expect.arrayContaining([JOB_GAME_METADATA_BACKFILL_SCAN, JOB_GAME_METADATA_REFRESH_SCAN]),
    );
  });

  it('uses deterministic repeat job ids so re-registration on boot is idempotent', async () => {
    const { scheduler, add } = createScheduler();

    await scheduler.onModuleInit();

    const jobIds = add.mock.calls.map((call) => (call[2] as { jobId: string }).jobId);
    expect(new Set(jobIds).size).toBe(jobIds.length);

    const byName = registered(add);
    expect(byName.get(JOB_GAME_METADATA_BACKFILL_SCAN)?.pattern).toBe('10 * * * *');
    expect(byName.get(JOB_GAME_METADATA_REFRESH_SCAN)?.pattern).toBe('20 2 * * *');
  });
});
