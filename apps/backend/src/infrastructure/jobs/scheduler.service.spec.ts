import { describe, expect, it, vi } from 'vitest';

import {
  JOB_GAME_METADATA_BACKFILL_SCAN,
  JOB_GAME_METADATA_REFRESH_SCAN,
  JOB_MAINTENANCE_NOTIFICATION_CLEANUP,
  JOB_MAINTENANCE_SESSION_CLEANUP,
  JOB_MAINTENANCE_UPLOAD_CLEANUP,
} from './job-names';
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

describe('SchedulerService', () => {
  it('registers repeating maintenance jobs on boot', async () => {
    const { scheduler, add, jobs } = createScheduler();

    await scheduler.onModuleInit();

    expect(jobs.getQueue).toHaveBeenCalledWith(QUEUE_MAINTENANCE);
    expect(add.mock.calls.slice(0, 3).map((call) => call[0])).toEqual([
      JOB_MAINTENANCE_UPLOAD_CLEANUP,
      JOB_MAINTENANCE_NOTIFICATION_CLEANUP,
      JOB_MAINTENANCE_SESSION_CLEANUP,
    ]);
  });

  // D3.25 — docs/18_CATALOG/METADATA_QUEUES.md §4–5
  it('registers the catalog backfill and refresh scans', async () => {
    const { scheduler, add, jobs } = createScheduler();

    await scheduler.onModuleInit();

    expect(jobs.getQueue).toHaveBeenCalledWith(QUEUE_GAME_METADATA);
    expect(add).toHaveBeenCalledTimes(5);
    expect(add.mock.calls.slice(3).map((call) => call[0])).toEqual([
      JOB_GAME_METADATA_BACKFILL_SCAN,
      JOB_GAME_METADATA_REFRESH_SCAN,
    ]);
  });

  it('uses deterministic repeat job ids so re-registration on boot is idempotent', async () => {
    const { scheduler, add } = createScheduler();

    await scheduler.onModuleInit();

    const jobIds = add.mock.calls.map((call) => (call[2] as { jobId: string }).jobId);
    expect(new Set(jobIds).size).toBe(jobIds.length);

    const catalogOptions = add.mock.calls
      .slice(3)
      .map((call) => call[2] as { repeat: { pattern: string } });
    expect(catalogOptions[0]?.repeat.pattern).toBe('10 * * * *');
    expect(catalogOptions[1]?.repeat.pattern).toBe('20 2 * * *');
  });
});
