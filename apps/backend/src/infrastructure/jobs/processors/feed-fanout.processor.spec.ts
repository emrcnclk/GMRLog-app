import { describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';

import { createNoOpActivityRepository } from '../../../activity/testing/fake-repositories';
import { createFakeCommunityActivityRepository } from '../../../communities/testing/fake-repositories';
import { createFakeFollowRepository, makeFollow } from '../../../follows/testing/fake-repositories';
import { FeedFanoutService } from '../feed-fanout.service';
import { createJobPayload } from '../job-payload';
import { JOB_FEED_FANOUT } from '../job-names';
import { FeedFanoutProcessor } from './feed-fanout.processor';

describe('FeedFanoutProcessor', () => {
  it('creates activity, author feed, follower feeds, and community activity', async () => {
    const activity = createNoOpActivityRepository();
    const follows = createFakeFollowRepository([
      makeFollow({ id: 'f-1', followerId: 'follower-1', followeeId: 'author-1' }),
    ]);
    const communityActivities = createFakeCommunityActivityRepository();
    const createActivitySpy = vi.spyOn(activity, 'create');
    const createFeedSpy = vi.spyOn(activity, 'createFeedEntry');
    const createCommunitySpy = vi.spyOn(communityActivities, 'create');

    const fanout = new FeedFanoutService(activity, follows, communityActivities);
    const processor = new FeedFanoutProcessor(fanout);

    const occurredAt = '2026-07-29T12:00:00.000Z';
    const job = {
      name: JOB_FEED_FANOUT,
      data: createJobPayload(
        {
          kind: 'post',
          objectId: 'post-1',
          actorId: 'author-1',
          occurredAt,
          communityId: 'community-1',
        },
        { idempotencyKey: 'feed:post:post-1' },
      ),
    } as Job;

    await processor.process(job);

    expect(createActivitySpy).toHaveBeenCalledOnce();
    expect(createFeedSpy).toHaveBeenCalledTimes(2);
    expect(createCommunitySpy).toHaveBeenCalledOnce();
  });
});
