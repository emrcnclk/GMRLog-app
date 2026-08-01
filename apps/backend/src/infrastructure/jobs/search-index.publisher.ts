import { randomUUID } from 'node:crypto';

import type { SearchHitType } from '@gmrlog/database';
import { Injectable, Optional } from '@nestjs/common';

import { AppLogger } from '../logging/app-logger.service';
import { SearchIndexService } from '../search/search-index.service';

import { toBullJobId } from './bull-job-id';
import { JOB_SEARCH_INDEX_DELETE, JOB_SEARCH_INDEX_UPSERT } from './job-names';
import { createJobPayload } from './job-payload';
import { JobsService } from './jobs.service';
import { QUEUE_SEARCH_INDEX } from './queue-names';

export interface SearchIndexJobData {
  action: 'upsert' | 'delete';
  type: SearchHitType;
  id: string;
}

/**
 * Enqueues search index maintenance on QUEUE_SEARCH_INDEX.
 * Falls back to synchronous indexing when Redis is unavailable.
 */
@Injectable()
export class SearchIndexPublisher {
  constructor(
    private readonly searchIndex: SearchIndexService,
    private readonly logger: AppLogger,
    @Optional() private readonly jobs: JobsService | null,
  ) {}

  async publishUpsert(type: SearchHitType, id: string): Promise<void> {
    await this.publish('upsert', type, id);
  }

  async publishDelete(type: SearchHitType, id: string): Promise<void> {
    await this.publish('delete', type, id);
  }

  private async publish(
    action: 'upsert' | 'delete',
    type: SearchHitType,
    id: string,
  ): Promise<void> {
    if (this.jobs == null) {
      await this.execute(action, type, id);
      return;
    }

    const jobName = action === 'upsert' ? JOB_SEARCH_INDEX_UPSERT : JOB_SEARCH_INDEX_DELETE;
    const idempotencyKey = `search.index:${action}:${type}:${id}`;
    const payload = createJobPayload<SearchIndexJobData>(
      { action, type, id },
      { correlationId: randomUUID(), idempotencyKey },
    );

    try {
      await this.jobs.getQueue(QUEUE_SEARCH_INDEX).add(jobName, payload, {
        jobId: toBullJobId(idempotencyKey),
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: { age: 86_400, count: 1000 },
        removeOnFail: false,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.event(
        'warn',
        { error: message, action, type, id },
        'search.index.enqueue.failed',
      );
      await this.execute(action, type, id);
    }
  }

  private async execute(
    action: 'upsert' | 'delete',
    type: SearchHitType,
    id: string,
  ): Promise<void> {
    if (action === 'upsert') {
      await this.searchIndex.upsert(type, id);
      return;
    }
    await this.searchIndex.delete(type, id);
  }
}
