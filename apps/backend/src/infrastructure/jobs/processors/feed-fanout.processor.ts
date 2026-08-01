import type { ObjectType } from '@gmrlog/database';
import { Injectable } from '@nestjs/common';
import type { Job } from 'bullmq';

import type { FeedFanoutKind } from '../feed-fanout.service';
import { FeedFanoutService } from '../feed-fanout.service';
import { JOB_FEED_FANOUT } from '../job-names';
import type { JobPayload } from '../job-payload';

interface FeedFanoutJobData {
  kind: FeedFanoutKind;
  objectId: string;
  actorId: string;
  occurredAt: string;
  communityId?: string;
  objectType?: ObjectType;
}

@Injectable()
export class FeedFanoutProcessor {
  constructor(private readonly fanout: FeedFanoutService) {}

  supports(jobName: string): boolean {
    return jobName === JOB_FEED_FANOUT;
  }

  async process(job: Job<JobPayload<FeedFanoutJobData>>): Promise<void> {
    const data = job.data.data;
    await this.fanout.execute({
      kind: data.kind,
      objectId: data.objectId,
      actorId: data.actorId,
      occurredAt: new Date(data.occurredAt),
      ...(data.communityId !== undefined ? { communityId: data.communityId } : {}),
      ...(data.objectType !== undefined ? { objectType: data.objectType } : {}),
    });
  }
}
