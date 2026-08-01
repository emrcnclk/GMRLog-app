import { Injectable } from '@nestjs/common';
import type { Job } from 'bullmq';

import {
  JOB_GAME_MEDIA_INGEST,
  JOB_GAME_METADATA_BACKFILL_SCAN,
  JOB_GAME_METADATA_ENRICH,
  JOB_GAME_METADATA_REFRESH_SCAN,
} from '../../infrastructure/jobs/job-names';
import type { JobPayload } from '../../infrastructure/jobs/job-payload';

import { GameMediaIngestionService } from './game-media-ingestion.service';
import { GameMetadataBackfillService } from './game-metadata-backfill.service';
import { GameMetadataService } from './game-metadata.service';
import type { GameMediaIngestJobData, GameMetadataEnrichJobData } from './metadata.job-data';

/**
 * Catalog queue consumers (D3.25 — docs/18_CATALOG/METADATA_QUEUES.md §2).
 * Runs only in the worker process.
 */
@Injectable()
export class GameMetadataProcessor {
  constructor(
    private readonly metadata: GameMetadataService,
    private readonly backfill: GameMetadataBackfillService,
    private readonly media: GameMediaIngestionService,
  ) {}

  supports(jobName: string): boolean {
    return (
      jobName === JOB_GAME_METADATA_ENRICH ||
      jobName === JOB_GAME_METADATA_BACKFILL_SCAN ||
      jobName === JOB_GAME_METADATA_REFRESH_SCAN ||
      jobName === JOB_GAME_MEDIA_INGEST
    );
  }

  async process(job: Job<JobPayload>): Promise<void> {
    switch (job.name) {
      case JOB_GAME_METADATA_ENRICH: {
        const data = job.data.data as GameMetadataEnrichJobData;
        await this.metadata.enrich(data.gameId, data.reason, {
          igdbId: data.igdbId,
          steamAppId: data.steamAppId,
        });
        return;
      }
      case JOB_GAME_METADATA_BACKFILL_SCAN:
        await this.backfill.runBackfillScan();
        return;
      case JOB_GAME_METADATA_REFRESH_SCAN:
        await this.backfill.runRefreshScan();
        return;
      case JOB_GAME_MEDIA_INGEST:
        await this.media.ingest(job.data.data as GameMediaIngestJobData);
        return;
      default:
        throw new Error(`Unknown catalog job: ${job.name}`);
    }
  }
}
