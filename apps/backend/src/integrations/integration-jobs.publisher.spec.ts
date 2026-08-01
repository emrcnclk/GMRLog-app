import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IntegrationJobsPublisher } from './integration-jobs.publisher';

describe('IntegrationJobsPublisher', () => {
  it('returns null when JobsService missing', async () => {
    const publisher = new IntegrationJobsPublisher(null as never);
    await expect(
      publisher.enqueueSync({
        kind: 'sync',
        syncJobId: 'j1',
        userId: 'u1',
        integrationId: 'i1',
        syncType: 'manual',
      }),
    ).resolves.toBeNull();
  });

  it('enqueues sync job when queue available', async () => {
    const add = vi.fn().mockResolvedValue({ id: 'bull-1' });
    const jobs = { getQueue: vi.fn().mockReturnValue({ add }) };
    const publisher = new IntegrationJobsPublisher(jobs as never);

    const id = await publisher.enqueueSync({
      kind: 'sync',
      syncJobId: 'j1',
      userId: 'u1',
      integrationId: 'i1',
      syncType: 'manual',
    });

    expect(id).toContain('integration');
    expect(jobs.getQueue).toHaveBeenCalledWith('integration.sync');
    expect(add).toHaveBeenCalled();
  });

  it('enqueues import / reconcile / cleanup / retry', async () => {
    const add = vi.fn().mockResolvedValue({ id: 'bull-x' });
    const jobs = { getQueue: vi.fn().mockReturnValue({ add }) };
    const publisher = new IntegrationJobsPublisher(jobs as never);
    const payload = {
      kind: 'import' as const,
      syncJobId: 'j1',
      userId: 'u1',
      integrationId: 'i1',
      syncType: 'manual' as const,
    };
    await publisher.enqueueImport(payload);
    await publisher.enqueueReconcile({ ...payload, kind: 'reconcile' });
    await publisher.enqueueCleanup({ ...payload, kind: 'cleanup' });
    await publisher.enqueueRetry({ ...payload, kind: 'retry' });
    expect(jobs.getQueue).toHaveBeenCalledWith('integration.import');
    expect(jobs.getQueue).toHaveBeenCalledWith('integration.reconcile');
    expect(jobs.getQueue).toHaveBeenCalledWith('integration.cleanup');
    expect(jobs.getQueue).toHaveBeenCalledWith('integration.retry');
  });

  it('returns null when enqueue throws', async () => {
    const jobs = {
      getQueue: vi.fn().mockReturnValue({
        add: vi.fn().mockRejectedValue(new Error('redis down')),
      }),
    };
    const publisher = new IntegrationJobsPublisher(jobs as never);
    await expect(
      publisher.enqueueSync({
        kind: 'sync',
        syncJobId: 'j1',
        userId: 'u1',
        integrationId: 'i1',
        syncType: 'manual',
      }),
    ).resolves.toBeNull();
  });
});
