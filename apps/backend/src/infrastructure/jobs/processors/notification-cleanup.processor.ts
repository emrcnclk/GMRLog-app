import type { NotificationRepository } from '@gmrlog/database';
import { Inject, Injectable } from '@nestjs/common';
import type { Job } from 'bullmq';

import { AppLogger } from '../../logging/app-logger.service';
import { JOB_MAINTENANCE_NOTIFICATION_CLEANUP } from '../job-names';
import type { JobPayload } from '../job-payload';
import { WORKER_NOTIFICATION_REPOSITORY } from '../worker.tokens';

const NOTIFICATION_READ_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

@Injectable()
export class NotificationCleanupProcessor {
  constructor(
    @Inject(WORKER_NOTIFICATION_REPOSITORY)
    private readonly notifications: NotificationRepository,
    private readonly logger: AppLogger,
  ) {}

  supports(jobName: string): boolean {
    return jobName === JOB_MAINTENANCE_NOTIFICATION_CLEANUP;
  }

  async process(job: Job<JobPayload>): Promise<void> {
    void job;
    const cutoff = new Date(Date.now() - NOTIFICATION_READ_RETENTION_MS);
    const deleted = await this.notifications.deleteReadOlderThan(cutoff);
    this.logger.event(
      'info',
      { deleted, cutoff: cutoff.toISOString() },
      'maintenance.notification.cleanup.completed',
    );
  }
}
