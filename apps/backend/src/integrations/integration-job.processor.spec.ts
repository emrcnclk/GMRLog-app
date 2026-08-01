import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';

import { createJobPayload } from '../infrastructure/jobs/job-payload';
import {
  JOB_INTEGRATION_CLEANUP_RUN,
  JOB_INTEGRATION_IMPORT_RUN,
  JOB_INTEGRATION_RECONCILE_RUN,
  JOB_INTEGRATION_RETRY_RUN,
  JOB_INTEGRATION_SYNC_RUN,
} from '../infrastructure/jobs/job-names';

import { IntegrationJobProcessor } from './integration-job.processor';

describe('IntegrationJobProcessor', () => {
  const librarySync = {
    runSync: vi.fn(),
    runImport: vi.fn(),
  };
  const processor = new IntegrationJobProcessor(librarySync as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('supports integration job names', () => {
    expect(processor.supports(JOB_INTEGRATION_SYNC_RUN)).toBe(true);
    expect(processor.supports(JOB_INTEGRATION_IMPORT_RUN)).toBe(true);
    expect(processor.supports(JOB_INTEGRATION_RECONCILE_RUN)).toBe(true);
    expect(processor.supports(JOB_INTEGRATION_RETRY_RUN)).toBe(true);
    expect(processor.supports(JOB_INTEGRATION_CLEANUP_RUN)).toBe(true);
    expect(processor.supports('other')).toBe(false);
  });

  it('runs sync jobs', async () => {
    const job = {
      name: JOB_INTEGRATION_SYNC_RUN,
      data: createJobPayload(
        {
          kind: 'sync',
          userId: 'u1',
          integrationId: 'i1',
          syncJobId: 'job-1',
          syncType: 'manual',
        },
        { idempotencyKey: 'integration.sync:job-1' },
      ),
    } as Job;
    await processor.process(job);
    expect(librarySync.runSync).toHaveBeenCalledWith('job-1');
  });

  it('runs reconcile and retry via runSync', async () => {
    for (const name of [JOB_INTEGRATION_RECONCILE_RUN, JOB_INTEGRATION_RETRY_RUN]) {
      await processor.process({
        name,
        data: createJobPayload(
          {
            kind: 'retry',
            userId: 'u1',
            integrationId: null,
            syncJobId: 'job-r',
            syncType: 'manual',
          },
          { idempotencyKey: `${name}:job-r` },
        ),
      } as Job);
    }
    expect(librarySync.runSync).toHaveBeenCalledTimes(2);
  });

  it('runs import jobs with csv rows', async () => {
    const job = {
      name: JOB_INTEGRATION_IMPORT_RUN,
      data: createJobPayload(
        {
          kind: 'import',
          userId: 'u1',
          integrationId: 'i1',
          syncJobId: 'job-2',
          syncType: 'manual',
          csvRows: [{ title: 'Hades', status: 'completed', playtimeMin: 60 }],
        },
        { idempotencyKey: 'integration.import:job-2' },
      ),
    } as Job;
    await processor.process(job);
    expect(librarySync.runImport).toHaveBeenCalledWith(
      'job-2',
      expect.objectContaining({ csvRows: expect.any(Array) }),
    );
  });

  it('acks cleanup without library sync', async () => {
    await processor.process({
      name: JOB_INTEGRATION_CLEANUP_RUN,
      data: createJobPayload(
        {
          kind: 'cleanup',
          userId: 'u1',
          integrationId: null,
          syncJobId: 'job-c',
          syncType: 'manual',
        },
        { idempotencyKey: 'integration.cleanup:job-c' },
      ),
    } as Job);
    expect(librarySync.runSync).not.toHaveBeenCalled();
    expect(librarySync.runImport).not.toHaveBeenCalled();
  });

  it('throws on unknown job name that somehow reaches process', async () => {
    await expect(
      processor.process({
        name: 'unknown.job',
        data: createJobPayload(
          {
            kind: 'sync',
            userId: 'u1',
            integrationId: 'i1',
            syncJobId: 'job-x',
            syncType: 'manual',
          },
          { idempotencyKey: 'x' },
        ),
      } as Job),
    ).rejects.toThrow(/Unknown integration job/);
  });
});
