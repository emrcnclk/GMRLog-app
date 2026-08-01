import { randomUUID } from 'node:crypto';

import { Injectable, Optional } from '@nestjs/common';

import { AppLogger } from '../logging/app-logger.service';
import { FeedCacheService } from '../redis/feed-cache.service';

import { toBullJobId } from './bull-job-id';
import type { FeedFanoutInput } from './feed-fanout.service';
import { FeedFanoutService } from './feed-fanout.service';
import { JOB_FEED_FANOUT } from './job-names';
import { createJobPayload } from './job-payload';
import { JobsService } from './jobs.service';
import { QUEUE_MAINTENANCE } from './queue-names';

/**
 * Enqueues durable feed fan-out. Falls back to synchronous write when Redis is unavailable.
 * Supports D3.21 kinds: post · review · collection · tier_list · friend · achievement ·
 * like · comment · wishlist · profile_pin · milestone · event (D3.24, same QUEUE_MAINTENANCE job).
 * D3.24 — targeted home-feed cache invalidation for the actor (never FLUSHALL).
 */
@Injectable()
export class FeedFanoutPublisher {
  constructor(
    private readonly fanout: FeedFanoutService,
    private readonly logger: AppLogger,
    @Optional() private readonly jobs: JobsService | null,
    @Optional() private readonly feedCache: FeedCacheService | null = null,
  ) {}

  async publish(input: FeedFanoutInput): Promise<void> {
    await this.invalidateCaches(input);

    if (this.jobs == null) {
      await this.fanout.execute(input);
      return;
    }

    const idempotencyKey = `feed.fanout:${input.kind}:${input.objectId}:${input.actorId}`;
    const payload = createJobPayload(
      {
        kind: input.kind,
        objectId: input.objectId,
        actorId: input.actorId,
        occurredAt: input.occurredAt.toISOString(),
        ...(input.communityId !== undefined ? { communityId: input.communityId } : {}),
        ...(input.objectType !== undefined ? { objectType: input.objectType } : {}),
      },
      {
        correlationId: randomUUID(),
        idempotencyKey,
      },
    );

    try {
      await this.jobs.getQueue(QUEUE_MAINTENANCE).add(JOB_FEED_FANOUT, payload, {
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
        { error: message, kind: input.kind, objectId: input.objectId },
        'feed.fanout.enqueue.failed',
      );
      await this.fanout.execute(input);
    }
  }

  private async invalidateCaches(input: FeedFanoutInput): Promise<void> {
    if (this.feedCache === null) {
      return;
    }
    try {
      await this.feedCache.invalidateHome(input.actorId);
      if (input.communityId !== undefined) {
        await this.feedCache.invalidateCommunity(input.communityId);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.event(
        'warn',
        { error: message, actorId: input.actorId },
        'feed.cache.invalidate.failed',
      );
    }
  }
}
