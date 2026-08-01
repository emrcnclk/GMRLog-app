import { describe, expect, it, vi } from 'vitest';

import { JobsService } from '../../infrastructure/jobs/jobs.service';
import { QUEUE_GAME_MEDIA, QUEUE_GAME_METADATA } from '../../infrastructure/jobs/queue-names';
import { AppLogger } from '../../infrastructure/logging/app-logger.service';

import { GameMetadataPublisher } from './game-metadata.publisher';
import type { GameMediaIngestJobData } from './metadata.job-data';

function createLogger(): AppLogger {
  return { event: vi.fn(), log: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as AppLogger;
}

function createJobs(add = vi.fn().mockResolvedValue(undefined)): {
  jobs: JobsService;
  add: ReturnType<typeof vi.fn>;
  getQueue: ReturnType<typeof vi.fn>;
} {
  const getQueue = vi.fn().mockReturnValue({ add });
  return { jobs: { getQueue } as unknown as JobsService, add, getQueue };
}

const MEDIA_JOB: GameMediaIngestJobData = {
  gameId: 'game-1',
  kind: 'cover',
  sourceUrl: 'https://images.igdb.com/cover.jpg',
  provider: 'igdb',
  sortOrder: 0,
  width: null,
  height: null,
  promote: true,
};

describe('GameMetadataPublisher.enqueueEnrich', () => {
  it('publishes to the metadata queue with retry and DLQ retention', async () => {
    const { jobs, add, getQueue } = createJobs();
    const publisher = new GameMetadataPublisher(createLogger(), jobs);

    const jobId = await publisher.enqueueEnrich({ gameId: 'game-1', reason: 'created' });

    expect(jobId).not.toBeNull();
    expect(getQueue).toHaveBeenCalledWith(QUEUE_GAME_METADATA);
    const options = add.mock.calls[0]?.[2] as Record<string, unknown>;
    expect(options.attempts).toBe(5);
    expect(options.backoff).toEqual({ type: 'exponential', delay: 5000 });
    expect(options.removeOnFail).toBe(false);
  });

  it('derives a deterministic job id from game and reason', async () => {
    const { jobs, add } = createJobs();
    const publisher = new GameMetadataPublisher(createLogger(), jobs);

    const first = await publisher.enqueueEnrich({ gameId: 'game-1', reason: 'backfill' });
    const second = await publisher.enqueueEnrich({ gameId: 'game-1', reason: 'backfill' });

    expect(first).toBe(second);
    expect((add.mock.calls[0]?.[2] as { jobId: string }).jobId).toBe(first);
  });

  it('gives different reasons different job ids so a refresh is not deduped against a backfill', async () => {
    const { jobs } = createJobs();
    const publisher = new GameMetadataPublisher(createLogger(), jobs);

    const backfill = await publisher.enqueueEnrich({ gameId: 'game-1', reason: 'backfill' });
    const refresh = await publisher.enqueueEnrich({ gameId: 'game-1', reason: 'refresh' });

    expect(backfill).not.toBe(refresh);
  });

  it('carries identity hints in the payload', async () => {
    const { jobs, add } = createJobs();
    const publisher = new GameMetadataPublisher(createLogger(), jobs);

    await publisher.enqueueEnrich({ gameId: 'game-1', reason: 'created', steamAppId: 1145360 });

    const payload = add.mock.calls[0]?.[1] as { data: { steamAppId: number } };
    expect(payload.data.steamAppId).toBe(1145360);
  });
});

describe('GameMetadataPublisher — Redis unavailable', () => {
  /**
   * The central invariant of D3.25: a dropped enqueue is recoverable by the
   * backfill scan; a synchronous provider call on a request path is not.
   * See docs/18_CATALOG/METADATA_QUEUES.md §3.
   */
  it('returns null instead of falling back to synchronous work when the queue throws', async () => {
    const add = vi.fn().mockRejectedValue(new Error('redis down'));
    const { jobs } = createJobs(add);
    const logger = createLogger();
    const publisher = new GameMetadataPublisher(logger, jobs);

    const jobId = await publisher.enqueueEnrich({ gameId: 'game-1', reason: 'created' });

    expect(jobId).toBeNull();
    expect(logger.event).toHaveBeenCalledWith(
      'warn',
      expect.objectContaining({ error: 'redis down' }),
      'game.metadata.enqueue.failed',
    );
  });

  it('returns null when no JobsService is wired at all', async () => {
    const publisher = new GameMetadataPublisher(createLogger(), null);

    await expect(
      publisher.enqueueEnrich({ gameId: 'game-1', reason: 'created' }),
    ).resolves.toBeNull();
  });
});

describe('GameMetadataPublisher media jobs', () => {
  it('publishes media ingest to the media queue', async () => {
    const { jobs, getQueue } = createJobs();
    const publisher = new GameMetadataPublisher(createLogger(), jobs);

    await publisher.enqueueMediaIngest(MEDIA_JOB);

    expect(getQueue).toHaveBeenCalledWith(QUEUE_GAME_MEDIA);
  });

  it('keys media idempotency on game, kind and source URL', async () => {
    const { jobs } = createJobs();
    const publisher = new GameMetadataPublisher(createLogger(), jobs);

    const same = await publisher.enqueueMediaIngest(MEDIA_JOB);
    const sameAgain = await publisher.enqueueMediaIngest(MEDIA_JOB);
    const different = await publisher.enqueueMediaIngest({
      ...MEDIA_JOB,
      sourceUrl: 'https://images.igdb.com/other.jpg',
    });

    expect(same).toBe(sameAgain);
    expect(different).not.toBe(same);
  });

  it('counts only the media jobs that were actually enqueued', async () => {
    const add = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('redis down'))
      .mockResolvedValueOnce(undefined);
    const { jobs } = createJobs(add);
    const publisher = new GameMetadataPublisher(createLogger(), jobs);

    const queued = await publisher.enqueueMediaBatch([
      MEDIA_JOB,
      { ...MEDIA_JOB, sourceUrl: 'https://a/2.jpg' },
      { ...MEDIA_JOB, sourceUrl: 'https://a/3.jpg' },
    ]);

    expect(queued).toBe(2);
  });

  it('returns zero for an empty batch', async () => {
    const { jobs, add } = createJobs();
    const publisher = new GameMetadataPublisher(createLogger(), jobs);

    await expect(publisher.enqueueMediaBatch([])).resolves.toBe(0);
    expect(add).not.toHaveBeenCalled();
  });
});
