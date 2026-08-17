import { Injectable } from '@nestjs/common';
import type { Job } from 'bullmq';

import { JOB_GAME_CATALOG_SYNC_RUN } from '../../infrastructure/jobs/job-names';
import type { JobPayload } from '../../infrastructure/jobs/job-payload';

import { GameCatalogSyncService } from './game-catalog-sync.service';
import type { GameCatalogSyncJobData } from './metadata.job-data';

/**
 * D11.1 — consumer for `QUEUE_GAME_CATALOG_SYNC`. Kept as its own processor
 * class (rather than folded into `GameMetadataProcessor`) so the two queues'
 * dispatch stays as separable as the queues themselves — see
 * `queue-names.ts`'s isolation note. Runs only in the worker process.
 */
@Injectable()
export class GameCatalogSyncProcessor {
  constructor(private readonly sync: GameCatalogSyncService) {}

  supports(jobName: string): boolean {
    return jobName === JOB_GAME_CATALOG_SYNC_RUN;
  }

  async process(job: Job<JobPayload>): Promise<void> {
    if (job.name !== JOB_GAME_CATALOG_SYNC_RUN) {
      throw new Error(`Unknown catalog-sync job: ${job.name}`);
    }
    const data = job.data.data as GameCatalogSyncJobData;
    await this.sync.syncPages(data.maxPages, data.pageSize);
  }
}
