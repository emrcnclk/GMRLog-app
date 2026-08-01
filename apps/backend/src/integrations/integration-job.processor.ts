import { Injectable } from '@nestjs/common';
import type { Job } from 'bullmq';

import {
  JOB_INTEGRATION_CLEANUP_RUN,
  JOB_INTEGRATION_IMPORT_RUN,
  JOB_INTEGRATION_RECONCILE_RUN,
  JOB_INTEGRATION_RETRY_RUN,
  JOB_INTEGRATION_SYNC_RUN,
} from '../infrastructure/jobs/job-names';
import type { JobPayload } from '../infrastructure/jobs/job-payload';

import { LibrarySyncService } from './library-sync.service';
import type { IntegrationJobPayloadData } from './mappers/integrations.mapper';

const SUPPORTED = new Set<string>([
  JOB_INTEGRATION_SYNC_RUN,
  JOB_INTEGRATION_IMPORT_RUN,
  JOB_INTEGRATION_RECONCILE_RUN,
  JOB_INTEGRATION_CLEANUP_RUN,
  JOB_INTEGRATION_RETRY_RUN,
]);

/**
 * BullMQ worker handler for D3.23 integration queues.
 */
@Injectable()
export class IntegrationJobProcessor {
  constructor(private readonly librarySync: LibrarySyncService) {}

  supports(jobName: string): boolean {
    return SUPPORTED.has(jobName);
  }

  async process(job: Job<JobPayload<IntegrationJobPayloadData>>): Promise<void> {
    const data = job.data.data;
    switch (job.name) {
      case JOB_INTEGRATION_SYNC_RUN:
      case JOB_INTEGRATION_RECONCILE_RUN:
      case JOB_INTEGRATION_RETRY_RUN:
        await this.librarySync.runSync(data.syncJobId);
        return;
      case JOB_INTEGRATION_IMPORT_RUN:
        await this.librarySync.runImport(data.syncJobId, {
          ...(data.csvRows !== undefined ? { csvRows: data.csvRows } : {}),
          ...(data.conflictResolution !== undefined
            ? { conflictResolution: data.conflictResolution as never }
            : {}),
        });
        return;
      case JOB_INTEGRATION_CLEANUP_RUN:
        // Hygiene jobs deferred — ack without side effects until cleanup rules ship.
        return;
      default:
        throw new Error(`Unknown integration job: ${job.name}`);
    }
  }
}
