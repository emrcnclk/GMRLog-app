import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';

import { MemoryObjectStorage } from '../../storage/memory-object-storage';
import { AppLogger } from '../../logging/app-logger.service';
import { createJobPayload } from '../job-payload';
import { JOB_MAINTENANCE_UPLOAD_CLEANUP, JOB_MEDIA_PURGE } from '../job-names';
import { UploadCleanupProcessor } from '../processors/upload-cleanup.processor';
import { createFakeUploadRepository, makeUpload } from '../testing/fake-upload.repository';

function createSilentLogger(): AppLogger {
  return {
    event: vi.fn(),
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    verbose: vi.fn(),
  } as unknown as AppLogger;
}

describe('UploadCleanupProcessor', () => {
  let uploads: ReturnType<typeof createFakeUploadRepository>;
  let storage: MemoryObjectStorage;
  let processor: UploadCleanupProcessor;

  beforeEach(() => {
    uploads = createFakeUploadRepository([
      makeUpload({
        id: 'stale-1',
        storageKey: 'uploads/user-1/avatar/stale-1',
        createdAt: new Date('2020-01-01T00:00:00.000Z'),
      }),
    ]);
    storage = new MemoryObjectStorage();
    storage.simulateClientPut('uploads/user-1/avatar/stale-1', Buffer.from('raw'), 'image/png');
    processor = new UploadCleanupProcessor(uploads, storage, createSilentLogger());
  });

  it('expires stale grants and deletes storage objects', async () => {
    const job = {
      name: JOB_MAINTENANCE_UPLOAD_CLEANUP,
      data: createJobPayload({}, { idempotencyKey: 'test' }),
    } as Job;

    await processor.process(job);

    expect(uploads.listGrantedOlderThan).toHaveBeenCalledOnce();
    expect(uploads.expireGrantedOlderThan).toHaveBeenCalledOnce();
    expect(await storage.headObject('uploads/user-1/avatar/stale-1')).toBeNull();
    expect(uploads.rows.get('stale-1')?.status).toBe('expired');
  });

  it('purges orphan keys from media.purge payload', async () => {
    storage.simulateClientPut('orphan/a', Buffer.from('a'), 'image/png');
    storage.simulateClientPut('orphan/b', Buffer.from('b'), 'image/png');

    const job = {
      name: JOB_MEDIA_PURGE,
      data: createJobPayload({ keys: ['orphan/a', 'orphan/b'] }, { idempotencyKey: 'purge' }),
    } as Job;

    await processor.process(job);

    expect(await storage.headObject('orphan/a')).toBeNull();
    expect(await storage.headObject('orphan/b')).toBeNull();
  });
});
