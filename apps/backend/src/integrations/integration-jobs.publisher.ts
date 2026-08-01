import { randomUUID } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';

import { toBullJobId } from '../infrastructure/jobs/bull-job-id';
import {
  JOB_INTEGRATION_CLEANUP_RUN,
  JOB_INTEGRATION_IMPORT_RUN,
  JOB_INTEGRATION_RECONCILE_RUN,
  JOB_INTEGRATION_RETRY_RUN,
  JOB_INTEGRATION_SYNC_RUN,
} from '../infrastructure/jobs/job-names';
import { createJobPayload } from '../infrastructure/jobs/job-payload';
import { JobsService } from '../infrastructure/jobs/jobs.service';
import {
  QUEUE_INTEGRATION_CLEANUP,
  QUEUE_INTEGRATION_IMPORT,
  QUEUE_INTEGRATION_RECONCILE,
  QUEUE_INTEGRATION_RETRY,
  QUEUE_INTEGRATION_SYNC,
} from '../infrastructure/jobs/queue-names';

import type { IntegrationJobPayloadData } from './mappers/integrations.mapper';

const DEFAULT_ATTEMPTS = 5;
const BACKOFF_MS = 2000;

/**
 * Enqueues integration BullMQ jobs with exponential backoff (SYNC_ENGINE.md).
 */
@Injectable()
export class IntegrationJobsPublisher {
  private readonly logger = new Logger(IntegrationJobsPublisher.name);

  constructor(private readonly jobs: JobsService) {}

  async enqueueSync(data: IntegrationJobPayloadData): Promise<string | null> {
    return this.enqueue(
      QUEUE_INTEGRATION_SYNC,
      JOB_INTEGRATION_SYNC_RUN,
      { ...data, kind: 'sync' },
      `integration.sync:${data.syncJobId}`,
    );
  }

  async enqueueImport(data: IntegrationJobPayloadData): Promise<string | null> {
    return this.enqueue(
      QUEUE_INTEGRATION_IMPORT,
      JOB_INTEGRATION_IMPORT_RUN,
      { ...data, kind: 'import' },
      `integration.import:${data.syncJobId}`,
    );
  }

  async enqueueReconcile(data: IntegrationJobPayloadData): Promise<string | null> {
    return this.enqueue(
      QUEUE_INTEGRATION_RECONCILE,
      JOB_INTEGRATION_RECONCILE_RUN,
      { ...data, kind: 'reconcile' },
      `integration.reconcile:${data.syncJobId}`,
    );
  }

  async enqueueCleanup(data: IntegrationJobPayloadData): Promise<string | null> {
    return this.enqueue(
      QUEUE_INTEGRATION_CLEANUP,
      JOB_INTEGRATION_CLEANUP_RUN,
      { ...data, kind: 'cleanup' },
      `integration.cleanup:${data.syncJobId}`,
    );
  }

  async enqueueRetry(data: IntegrationJobPayloadData): Promise<string | null> {
    return this.enqueue(
      QUEUE_INTEGRATION_RETRY,
      JOB_INTEGRATION_RETRY_RUN,
      { ...data, kind: 'retry' },
      `integration.retry:${data.syncJobId}`,
    );
  }

  private async enqueue(
    queueName: string,
    jobName: string,
    data: IntegrationJobPayloadData,
    idempotencyKey: string,
  ): Promise<string | null> {
    const bullJobId = toBullJobId(idempotencyKey);
    const payload = createJobPayload(data, {
      correlationId: randomUUID(),
      idempotencyKey,
    });

    try {
      await this.jobs.getQueue(queueName).add(jobName, payload, {
        jobId: bullJobId,
        attempts: DEFAULT_ATTEMPTS,
        backoff: { type: 'exponential', delay: BACKOFF_MS },
        removeOnComplete: { age: 86_400, count: 1000 },
        removeOnFail: false,
      });
      return bullJobId;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`integration.enqueue.failed: ${message}`);
      return null;
    }
  }
}
