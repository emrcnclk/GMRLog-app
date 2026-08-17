import { Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { Worker, type Job } from 'bullmq';
import type { Redis } from 'ioredis';

import type { JobPayload } from '../../infrastructure/jobs/job-payload';
import { JOBS_CONNECTION } from '../../infrastructure/jobs/jobs.constants';
import {
  QUEUE_GAME_CATALOG_SYNC,
  QUEUE_GAME_MEDIA,
  QUEUE_GAME_METADATA,
} from '../../infrastructure/jobs/queue-names';
import { AppLogger } from '../../infrastructure/logging/app-logger.service';

import { GameCatalogSyncProcessor } from './game-catalog-sync.processor';
import { GameMetadataProcessor } from './game-metadata.processor';
import { METADATA_CONFIG, type MetadataConfig } from './metadata.config';

/**
 * Starts the catalog BullMQ workers (D3.25 — docs/18_CATALOG/METADATA_QUEUES.md §8).
 * Registered only in `WorkerModule`; the API process publishes and never consumes.
 *
 * Metadata concurrency is deliberately low — the ceiling is the provider rate
 * limit, not CPU. Media concurrency is higher: it is I/O against our own storage.
 */
@Injectable()
export class GameCatalogWorkerService implements OnModuleInit, OnModuleDestroy {
  private workers: Worker[] = [];

  constructor(
    @Inject(JOBS_CONNECTION) private readonly connection: Redis,
    private readonly logger: AppLogger,
    private readonly processor: GameMetadataProcessor,
    private readonly catalogSyncProcessor: GameCatalogSyncProcessor,
    @Inject(METADATA_CONFIG) private readonly config: MetadataConfig,
  ) {}

  onModuleInit(): void {
    this.workers = [
      new Worker<JobPayload>(QUEUE_GAME_METADATA, async (job) => this.dispatch(job), {
        connection: this.connection,
        concurrency: this.config.metadataConcurrency,
      }),
      new Worker<JobPayload>(QUEUE_GAME_MEDIA, async (job) => this.dispatch(job), {
        connection: this.connection,
        concurrency: this.config.mediaConcurrency,
      }),
      // D11.1 — concurrency 1, always: IGDB rate-limits the whole app
      // regardless of how many workers call it, and this queue must never
      // race the per-game enrich queue for that same budget.
      new Worker<JobPayload>(
        QUEUE_GAME_CATALOG_SYNC,
        async (job) => this.catalogSyncProcessor.process(job),
        { connection: this.connection, concurrency: 1 },
      ),
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
          'game.catalog.job.failed',
        );
      });
    }

    this.logger.log('Game catalog BullMQ workers started', 'GameCatalogWorkerService');
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(this.workers.map((worker) => worker.close()));
    this.workers = [];
  }

  private async dispatch(job: Job<JobPayload>): Promise<void> {
    if (!this.processor.supports(job.name)) {
      throw new Error(`Unknown catalog job: ${job.name}`);
    }
    await this.processor.process(job);
  }
}
