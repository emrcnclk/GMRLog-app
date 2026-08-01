import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Optional } from '@nestjs/common';

import { toBullJobId } from '../../infrastructure/jobs/bull-job-id';
import {
  JOB_GAME_MEDIA_INGEST,
  JOB_GAME_METADATA_ENRICH,
} from '../../infrastructure/jobs/job-names';
import { createJobPayload } from '../../infrastructure/jobs/job-payload';
import { JobsService } from '../../infrastructure/jobs/jobs.service';
import { QUEUE_GAME_MEDIA, QUEUE_GAME_METADATA } from '../../infrastructure/jobs/queue-names';
import { AppLogger } from '../../infrastructure/logging/app-logger.service';

import type { GameMediaIngestJobData, GameMetadataEnrichJobData } from './metadata.job-data';

const ATTEMPTS = 5;
const BACKOFF_MS = 5_000;

/**
 * Enqueues catalog metadata work (D3.25 — docs/18_CATALOG/METADATA_QUEUES.md §3).
 *
 * DELIBERATE DIVERGENCE from `SearchIndexPublisher`: there is **no synchronous
 * fallback** when Redis is unavailable. A synchronous fallback would put a
 * third-party HTTP call on the request path, which is the one thing this sprint
 * forbids. A dropped enqueue is recoverable — the hourly backfill scan picks the
 * game up once Redis returns. A blocked request is not recoverable.
 */
@Injectable()
export class GameMetadataPublisher {
  constructor(
    private readonly logger: AppLogger,
    // Explicit @Inject alongside @Optional(): TS erases a `JobsService | null`
    // union to `Object` in emitted design:paramtypes metadata, which leaves
    // Nest unable to resolve the token and makes an *always-provided*
    // dependency silently inject as null. @Inject pins the token so real DI
    // wires the real JobsService; the `| null` type only matters for the
    // test-time "no queue backend" case (see game-metadata.publisher.spec.ts).
    @Optional() @Inject(JobsService) private readonly jobs: JobsService | null = null,
  ) {}

  /** Returns the BullMQ job id, or null when the enqueue could not be made. */
  async enqueueEnrich(data: GameMetadataEnrichJobData): Promise<string | null> {
    const idempotencyKey = `game.metadata:enrich:${data.gameId}:${data.reason}`;
    return this.enqueue(QUEUE_GAME_METADATA, JOB_GAME_METADATA_ENRICH, data, idempotencyKey);
  }

  async enqueueMediaIngest(data: GameMediaIngestJobData): Promise<string | null> {
    const idempotencyKey = `game.media:ingest:${data.gameId}:${data.kind}:${data.sourceUrl}`;
    return this.enqueue(QUEUE_GAME_MEDIA, JOB_GAME_MEDIA_INGEST, data, idempotencyKey);
  }

  async enqueueMediaBatch(items: readonly GameMediaIngestJobData[]): Promise<number> {
    let queued = 0;
    for (const item of items) {
      const jobId = await this.enqueueMediaIngest(item);
      if (jobId !== null) {
        queued += 1;
      }
    }
    return queued;
  }

  private async enqueue(
    queueName: string,
    jobName: string,
    data: object,
    idempotencyKey: string,
  ): Promise<string | null> {
    if (this.jobs === null) {
      this.logger.event('warn', { queueName, jobName }, 'game.metadata.enqueue.unavailable');
      return null;
    }

    const bullJobId = toBullJobId(idempotencyKey);
    const payload = createJobPayload(data, { correlationId: randomUUID(), idempotencyKey });

    try {
      await this.jobs.getQueue(queueName).add(jobName, payload, {
        jobId: bullJobId,
        attempts: ATTEMPTS,
        backoff: { type: 'exponential', delay: BACKOFF_MS },
        removeOnComplete: { age: 86_400, count: 1000 },
        removeOnFail: false,
      });
      return bullJobId;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.event(
        'warn',
        { error: message, queueName, jobName, idempotencyKey },
        'game.metadata.enqueue.failed',
      );
      return null;
    }
  }
}
