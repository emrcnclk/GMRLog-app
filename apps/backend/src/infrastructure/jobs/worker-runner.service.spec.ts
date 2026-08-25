import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';

const workerState = vi.hoisted(() => ({
  workerClose: vi.fn().mockResolvedValue(undefined),
  handlers: [] as Array<(job: Job) => Promise<void>>,
}));

vi.mock('bullmq', () => ({
  Worker: vi.fn(function WorkerMock(_name: string, handler: (job: Job) => Promise<void>) {
    workerState.handlers.push(handler);
    return {
      on: vi.fn(),
      close: workerState.workerClose,
    };
  }),
}));

import { createJobPayload } from './job-payload';
import { JOB_FEED_FANOUT, JOB_MEDIA_IMAGE_PROCESS, JOB_SEARCH_INDEX_UPSERT } from './job-names';
import { AccountDeletionSweepProcessor } from './processors/account-deletion-sweep.processor';
import { EventReminderProcessor } from './processors/event-reminder.processor';
import { FeedFanoutProcessor } from './processors/feed-fanout.processor';
import { ImageProcessingProcessor } from './processors/image-processing.processor';
import { NotificationCleanupProcessor } from './processors/notification-cleanup.processor';
import { SearchIndexProcessor } from './processors/search-index.processor';
import { SessionCleanupProcessor } from './processors/session-cleanup.processor';
import { UploadCleanupProcessor } from './processors/upload-cleanup.processor';
import { scheduledMaintenancePayload, WorkerRunnerService } from './worker-runner.service';
import { AppLogger } from '../logging/app-logger.service';
import { parseBackendEnv } from '../config/env.schema';

describe('WorkerRunnerService', () => {
  let service: WorkerRunnerService;
  let uploadCleanup: UploadCleanupProcessor;
  let notificationCleanup: NotificationCleanupProcessor;
  let sessionCleanup: SessionCleanupProcessor;
  let feedFanout: FeedFanoutProcessor;
  let accountDeletionSweep: AccountDeletionSweepProcessor;
  let eventReminder: EventReminderProcessor;
  let imageProcessing: ImageProcessingProcessor;
  let searchIndex: SearchIndexProcessor;

  beforeEach(() => {
    workerState.workerClose.mockClear();
    workerState.handlers.length = 0;
    uploadCleanup = {
      supports: vi.fn().mockReturnValue(true),
      process: vi.fn().mockResolvedValue(undefined),
    } as unknown as UploadCleanupProcessor;
    notificationCleanup = {
      supports: vi.fn().mockReturnValue(false),
      process: vi.fn(),
    } as unknown as NotificationCleanupProcessor;
    sessionCleanup = {
      supports: vi.fn().mockReturnValue(false),
      process: vi.fn(),
    } as unknown as SessionCleanupProcessor;
    feedFanout = {
      supports: vi.fn().mockReturnValue(false),
      process: vi.fn(),
    } as unknown as FeedFanoutProcessor;
    eventReminder = {
      supports: vi.fn().mockReturnValue(false),
      process: vi.fn(),
    } as unknown as EventReminderProcessor;
    imageProcessing = {
      supports: vi.fn().mockReturnValue(true),
      process: vi.fn().mockResolvedValue(undefined),
    } as unknown as ImageProcessingProcessor;
    searchIndex = {
      supports: vi.fn().mockReturnValue(true),
      process: vi.fn().mockResolvedValue(undefined),
    } as unknown as SearchIndexProcessor;

    accountDeletionSweep = {
      supports: vi.fn().mockReturnValue(false),
      process: vi.fn(),
    } as unknown as AccountDeletionSweepProcessor;

    service = new WorkerRunnerService(
      {} as never,
      new AppLogger(parseBackendEnv({})),
      uploadCleanup,
      notificationCleanup,
      accountDeletionSweep,
      sessionCleanup,
      feedFanout,
      eventReminder,
      imageProcessing,
      searchIndex,
    );
  });

  it('starts workers on init and closes them on destroy', async () => {
    service.onModuleInit();
    await service.onModuleDestroy();
    expect(workerState.workerClose).toHaveBeenCalledTimes(4);
  });

  it('dispatches maintenance, media, and search-index jobs', async () => {
    service.onModuleInit();
    const maintenanceHandler = workerState.handlers[0]!;
    const mediaHandler = workerState.handlers[1]!;
    const searchHandler = workerState.handlers[2]!;

    await maintenanceHandler({
      name: JOB_FEED_FANOUT,
      data: createJobPayload(
        { kind: 'post', objectId: 'post-1', actorId: 'u1', occurredAt: '' },
        { idempotencyKey: 'feed:post:post-1' },
      ),
    } as Job);
    expect(uploadCleanup.process).toHaveBeenCalledOnce();

    await mediaHandler({
      name: JOB_MEDIA_IMAGE_PROCESS,
      data: createJobPayload(
        { uploadId: 'u1', storageKey: 'k', purpose: 'avatar' },
        { idempotencyKey: 'media:u1' },
      ),
    } as Job);
    expect(imageProcessing.process).toHaveBeenCalledOnce();

    await searchHandler({
      name: JOB_SEARCH_INDEX_UPSERT,
      data: createJobPayload(
        { action: 'upsert', type: 'game', id: 'game-1' },
        { idempotencyKey: 'search:upsert:game:game-1' },
      ),
    } as Job);
    expect(searchIndex.process).toHaveBeenCalledOnce();
  });
});

describe('scheduledMaintenancePayload', () => {
  it('builds a versioned maintenance payload', () => {
    const payload = scheduledMaintenancePayload('maintenance.upload.cleanup');
    expect(payload.schemaVersion).toBe(1);
    expect(payload.idempotencyKey).toBe('scheduled:maintenance.upload.cleanup');
  });
});
