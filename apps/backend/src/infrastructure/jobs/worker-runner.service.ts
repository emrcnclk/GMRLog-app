import { randomUUID } from 'node:crypto';

import { Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { Worker, type Job } from 'bullmq';
import type { Redis } from 'ioredis';

import { AppLogger } from '../logging/app-logger.service';

import type { EventReminderJobData } from './event-reminder.publisher';
import type { JobPayload } from './job-payload';
import { JOBS_CONNECTION } from './jobs.constants';
import { AccountDeletionSweepProcessor } from './processors/account-deletion-sweep.processor';
import { EventReminderProcessor } from './processors/event-reminder.processor';
import { FeedFanoutProcessor } from './processors/feed-fanout.processor';
import { ImageProcessingProcessor } from './processors/image-processing.processor';
import { NotificationCleanupProcessor } from './processors/notification-cleanup.processor';
import { SearchIndexProcessor } from './processors/search-index.processor';
import { SessionCleanupProcessor } from './processors/session-cleanup.processor';
import { UploadCleanupProcessor } from './processors/upload-cleanup.processor';
import {
  QUEUE_MAINTENANCE,
  QUEUE_MEDIA,
  QUEUE_NOTIFICATIONS,
  QUEUE_SEARCH_INDEX,
} from './queue-names';
import type { SearchIndexJobData } from './search-index.publisher';

interface NamedJobProcessor {
  supports(jobName: string): boolean;
  process(job: Job<JobPayload>): Promise<void>;
}

/**
 * Starts BullMQ workers on boot and closes them gracefully on shutdown.
 */
@Injectable()
export class WorkerRunnerService implements OnModuleInit, OnModuleDestroy {
  private readonly maintenanceProcessors: NamedJobProcessor[];
  private readonly notificationProcessors: NamedJobProcessor[];
  private workers: Worker[] = [];

  constructor(
    @Inject(JOBS_CONNECTION) private readonly connection: Redis,
    private readonly logger: AppLogger,
    uploadCleanup: UploadCleanupProcessor,
    notificationCleanup: NotificationCleanupProcessor,
    accountDeletionSweep: AccountDeletionSweepProcessor,
    sessionCleanup: SessionCleanupProcessor,
    feedFanout: FeedFanoutProcessor,
    eventReminder: EventReminderProcessor,
    private readonly imageProcessing: ImageProcessingProcessor,
    private readonly searchIndex: SearchIndexProcessor,
  ) {
    this.maintenanceProcessors = [
      uploadCleanup,
      notificationCleanup,
      sessionCleanup,
      accountDeletionSweep,
      feedFanout,
    ];
    this.notificationProcessors = [eventReminder];
  }

  onModuleInit(): void {
    this.workers = [
      new Worker<JobPayload>(QUEUE_MAINTENANCE, async (job) => this.dispatchMaintenance(job), {
        connection: this.connection,
        concurrency: 4,
      }),
      new Worker<JobPayload>(QUEUE_MEDIA, async (job) => this.dispatchMedia(job), {
        connection: this.connection,
        concurrency: 8,
      }),
      new Worker<JobPayload>(QUEUE_SEARCH_INDEX, async (job) => this.dispatchSearchIndex(job), {
        connection: this.connection,
        concurrency: 4,
      }),
      new Worker<JobPayload>(QUEUE_NOTIFICATIONS, async (job) => this.dispatchNotifications(job), {
        connection: this.connection,
        concurrency: 4,
      }),
    ];

    for (const worker of this.workers) {
      worker.on('failed', (job, error) => {
        this.logger.event(
          'error',
          {
            queue: worker.name,
            jobName: job?.name,
            jobId: job?.id,
            error: error.message,
          },
          'bullmq.job.failed',
        );
      });
    }

    this.logger.log('BullMQ workers started', 'WorkerRunnerService');
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(this.workers.map((worker) => worker.close()));
    this.workers = [];
  }

  private async dispatchMaintenance(job: Job<JobPayload>): Promise<void> {
    for (const processor of this.maintenanceProcessors) {
      if (processor.supports(job.name)) {
        await processor.process(job);
        return;
      }
    }
    throw new Error(`Unknown maintenance job: ${job.name}`);
  }

  private async dispatchNotifications(job: Job<JobPayload>): Promise<void> {
    for (const processor of this.notificationProcessors) {
      if (processor.supports(job.name)) {
        await processor.process(job as Job<JobPayload<EventReminderJobData>>);
        return;
      }
    }
    throw new Error(`Unknown notifications job: ${job.name}`);
  }

  private async dispatchMedia(job: Job<JobPayload>): Promise<void> {
    if (this.imageProcessing.supports(job.name)) {
      await this.imageProcessing.process(
        job as Job<JobPayload<{ uploadId: string; storageKey: string; purpose: string }>>,
      );
      return;
    }
    throw new Error(`Unknown media job: ${job.name}`);
  }

  private async dispatchSearchIndex(job: Job<JobPayload>): Promise<void> {
    if (this.searchIndex.supports(job.name)) {
      await this.searchIndex.process(job as Job<JobPayload<SearchIndexJobData>>);
      return;
    }
    throw new Error(`Unknown search-index job: ${job.name}`);
  }
}

/** Empty payload for scheduled maintenance ticks. */
export function scheduledMaintenancePayload(jobKey: string): JobPayload {
  return {
    schemaVersion: 1,
    correlationId: randomUUID(),
    idempotencyKey: `scheduled:${jobKey}`,
    enqueuedAt: new Date().toISOString(),
    data: {},
  };
}
