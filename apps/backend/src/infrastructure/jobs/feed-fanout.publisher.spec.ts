import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createNoOpActivityRepository } from '../../activity/testing/fake-repositories';
import { createFakeFollowRepository } from '../../follows/testing/fake-repositories';
import { AppLogger } from '../logging/app-logger.service';
import { parseBackendEnv } from '../config/env.schema';

import { FeedFanoutService } from './feed-fanout.service';
import { FeedFanoutPublisher } from './feed-fanout.publisher';
import { JOB_FEED_FANOUT } from './job-names';
import { JobsService } from './jobs.service';
import { QUEUE_MAINTENANCE } from './queue-names';

describe('FeedFanoutPublisher', () => {
  const input = {
    kind: 'post' as const,
    objectId: 'post-1',
    actorId: 'user-1',
    occurredAt: new Date('2026-07-29T12:00:00.000Z'),
  };
  let fanout: FeedFanoutService;
  let logger: AppLogger;

  beforeEach(() => {
    fanout = new FeedFanoutService(createNoOpActivityRepository(), createFakeFollowRepository(), {
      create: vi.fn(),
    } as never);
    logger = new AppLogger(parseBackendEnv({}));
  });

  it('executes synchronously when jobs service is unavailable', async () => {
    const executeSpy = vi.spyOn(fanout, 'execute').mockResolvedValue(undefined);
    const publisher = new FeedFanoutPublisher(fanout, logger, null);

    await publisher.publish(input);
    expect(executeSpy).toHaveBeenCalledWith(input);
  });

  it('enqueues a durable job when redis is available', async () => {
    const add = vi.fn().mockResolvedValue(undefined);
    const jobs = { getQueue: vi.fn().mockReturnValue({ add }) } as unknown as JobsService;
    const publisher = new FeedFanoutPublisher(fanout, logger, jobs);

    await publisher.publish({ ...input, communityId: 'community-1' });

    expect(jobs.getQueue).toHaveBeenCalledWith(QUEUE_MAINTENANCE);
    expect(add).toHaveBeenCalledWith(
      JOB_FEED_FANOUT,
      expect.objectContaining({
        data: expect.objectContaining({
          kind: 'post',
          objectId: 'post-1',
          communityId: 'community-1',
        }),
      }),
      expect.objectContaining({ jobId: 'feed.fanout-post-post-1-user-1' }),
    );
  });

  it('falls back to synchronous execution when enqueue fails', async () => {
    const executeSpy = vi.spyOn(fanout, 'execute').mockResolvedValue(undefined);
    const add = vi.fn().mockRejectedValue(new Error('redis down'));
    const jobs = { getQueue: vi.fn().mockReturnValue({ add }) } as unknown as JobsService;
    const publisher = new FeedFanoutPublisher(fanout, logger, jobs);

    await publisher.publish(input);
    expect(executeSpy).toHaveBeenCalledWith(input);
  });

  it('invalidates home and community feed cache for the actor', async () => {
    const feedCache = {
      invalidateHome: vi.fn().mockResolvedValue(undefined),
      invalidateCommunity: vi.fn().mockResolvedValue(undefined),
    };
    const executeSpy = vi.spyOn(fanout, 'execute').mockResolvedValue(undefined);
    const publisher = new FeedFanoutPublisher(fanout, logger, null, feedCache as never);

    await publisher.publish({ ...input, communityId: 'community-9' });
    expect(feedCache.invalidateHome).toHaveBeenCalledWith('user-1');
    expect(feedCache.invalidateCommunity).toHaveBeenCalledWith('community-9');
    expect(executeSpy).toHaveBeenCalled();
  });

  it('continues publish when cache invalidation fails', async () => {
    const feedCache = {
      invalidateHome: vi.fn().mockRejectedValue(new Error('cache down')),
      invalidateCommunity: vi.fn(),
    };
    const executeSpy = vi.spyOn(fanout, 'execute').mockResolvedValue(undefined);
    const publisher = new FeedFanoutPublisher(fanout, logger, null, feedCache as never);

    await publisher.publish(input);
    expect(executeSpy).toHaveBeenCalledWith(input);
  });
});
