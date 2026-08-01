import { Injectable, type OnModuleInit } from '@nestjs/common';

import { toBullJobId } from './bull-job-id';
import {
  JOB_GAME_METADATA_BACKFILL_SCAN,
  JOB_GAME_METADATA_REFRESH_SCAN,
  JOB_MAINTENANCE_NOTIFICATION_CLEANUP,
  JOB_MAINTENANCE_SESSION_CLEANUP,
  JOB_MAINTENANCE_UPLOAD_CLEANUP,
} from './job-names';
import { createJobPayload } from './job-payload';
import { JobsService } from './jobs.service';
import { QUEUE_GAME_METADATA, QUEUE_MAINTENANCE } from './queue-names';
import { scheduledMaintenancePayload } from './worker-runner.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  constructor(private readonly jobs: JobsService) {}

  async onModuleInit(): Promise<void> {
    const queue = this.jobs.getQueue(QUEUE_MAINTENANCE);

    await queue.add(
      JOB_MAINTENANCE_UPLOAD_CLEANUP,
      scheduledMaintenancePayload(JOB_MAINTENANCE_UPLOAD_CLEANUP),
      {
        jobId: toBullJobId('repeat:maintenance.upload.cleanup'),
        repeat: { pattern: '0 * * * *' },
        removeOnComplete: { age: 86_400, count: 100 },
        removeOnFail: false,
      },
    );

    await queue.add(
      JOB_MAINTENANCE_NOTIFICATION_CLEANUP,
      createJobPayload({}, { idempotencyKey: 'scheduled:maintenance.notification.cleanup' }),
      {
        jobId: toBullJobId('repeat:maintenance.notification.cleanup'),
        repeat: { pattern: '0 4 * * *' },
        removeOnComplete: { age: 86_400, count: 100 },
        removeOnFail: false,
      },
    );

    await queue.add(
      JOB_MAINTENANCE_SESSION_CLEANUP,
      createJobPayload(
        { olderThanDays: 0 },
        { idempotencyKey: 'scheduled:maintenance.session.cleanup' },
      ),
      {
        jobId: toBullJobId('repeat:maintenance.session.cleanup'),
        repeat: { pattern: '0 3 * * *' },
        removeOnComplete: { age: 86_400, count: 100 },
        removeOnFail: false,
      },
    );

    await this.registerCatalogScans();
  }

  /**
   * D3.25 catalog scans (docs/18_CATALOG/METADATA_QUEUES.md §4–5).
   * Deterministic job ids make re-registration on every boot idempotent.
   */
  private async registerCatalogScans(): Promise<void> {
    const catalogQueue = this.jobs.getQueue(QUEUE_GAME_METADATA);

    await catalogQueue.add(
      JOB_GAME_METADATA_BACKFILL_SCAN,
      createJobPayload({}, { idempotencyKey: 'scheduled:game.metadata.backfill.scan' }),
      {
        jobId: toBullJobId('repeat:game.metadata.backfill.scan'),
        repeat: { pattern: '10 * * * *' },
        removeOnComplete: { age: 86_400, count: 100 },
        removeOnFail: false,
      },
    );

    await catalogQueue.add(
      JOB_GAME_METADATA_REFRESH_SCAN,
      createJobPayload({}, { idempotencyKey: 'scheduled:game.metadata.refresh.scan' }),
      {
        jobId: toBullJobId('repeat:game.metadata.refresh.scan'),
        repeat: { pattern: '20 2 * * *' },
        removeOnComplete: { age: 86_400, count: 100 },
        removeOnFail: false,
      },
    );
  }
}
