import { Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { Worker, type Job } from 'bullmq';
import type { Redis } from 'ioredis';

import type { JobPayload } from '../infrastructure/jobs/job-payload';
import { JOBS_CONNECTION } from '../infrastructure/jobs/jobs.constants';
import {
  QUEUE_INTEGRATION_CLEANUP,
  QUEUE_INTEGRATION_IMPORT,
  QUEUE_INTEGRATION_RECONCILE,
  QUEUE_INTEGRATION_RETRY,
  QUEUE_INTEGRATION_SYNC,
} from '../infrastructure/jobs/queue-names';
import { AppLogger } from '../infrastructure/logging/app-logger.service';

import { IntegrationJobProcessor } from './integration-job.processor';
import type { IntegrationJobPayloadData } from './mappers/integrations.mapper';

/**
 * Starts BullMQ workers for integration queues (D3.23).
 * Complements inline sync when Redis enqueue succeeds.
 */
@Injectable()
export class IntegrationsWorkerService implements OnModuleInit, OnModuleDestroy {
  private workers: Worker[] = [];

  constructor(
    @Inject(JOBS_CONNECTION) private readonly connection: Redis,
    private readonly logger: AppLogger,
    private readonly processor: IntegrationJobProcessor,
  ) {}

  onModuleInit(): void {
    const queues = [
      QUEUE_INTEGRATION_SYNC,
      QUEUE_INTEGRATION_IMPORT,
      QUEUE_INTEGRATION_RECONCILE,
      QUEUE_INTEGRATION_CLEANUP,
      QUEUE_INTEGRATION_RETRY,
    ];

    this.workers = queues.map(
      (queueName) =>
        new Worker<JobPayload<IntegrationJobPayloadData>>(
          queueName,
          async (job) => this.dispatch(job),
          { connection: this.connection, concurrency: 4 },
        ),
    );

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
          'integration.job.failed',
        );
      });
    }

    this.logger.log('Integration BullMQ workers started', 'IntegrationsWorkerService');
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(this.workers.map((worker) => worker.close()));
    this.workers = [];
  }

  private async dispatch(job: Job<JobPayload<IntegrationJobPayloadData>>): Promise<void> {
    if (!this.processor.supports(job.name)) {
      throw new Error(`Unknown integration job: ${job.name}`);
    }
    await this.processor.process(job);
  }
}
