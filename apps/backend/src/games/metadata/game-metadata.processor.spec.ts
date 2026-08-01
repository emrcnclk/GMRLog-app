import { describe, expect, it, vi } from 'vitest';
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
import { GameMetadataProcessor } from './game-metadata.processor';
import { GameMetadataService } from './game-metadata.service';

function createProcessor(): {
  processor: GameMetadataProcessor;
  metadata: GameMetadataService;
  backfill: GameMetadataBackfillService;
  media: GameMediaIngestionService;
} {
  const metadata = {
    enrich: vi.fn(async () => ({
      status: 'applied' as const,
      provider: 'igdb' as const,
      fieldsWritten: 5,
      mediaQueued: 2,
    })),
  } as unknown as GameMetadataService;
  const backfill = {
    runBackfillScan: vi.fn(async () => ({ selected: 3, enqueued: 3 })),
    runRefreshScan: vi.fn(async () => ({ selected: 1, enqueued: 1 })),
  } as unknown as GameMetadataBackfillService;
  const media = {
    ingest: vi.fn(async () => ({ outcome: 'stored' as const, storageKey: 'k' })),
  } as unknown as GameMediaIngestionService;

  return {
    processor: new GameMetadataProcessor(metadata, backfill, media),
    metadata,
    backfill,
    media,
  };
}

function job<T>(name: string, data: T): Job<JobPayload> {
  return {
    name,
    data: {
      schemaVersion: 1,
      correlationId: 'corr-1',
      idempotencyKey: 'key-1',
      enqueuedAt: new Date().toISOString(),
      data,
    },
  } as unknown as Job<JobPayload>;
}

describe('GameMetadataProcessor.supports', () => {
  it('claims exactly the four catalog jobs', () => {
    const { processor } = createProcessor();

    expect(processor.supports(JOB_GAME_METADATA_ENRICH)).toBe(true);
    expect(processor.supports(JOB_GAME_METADATA_BACKFILL_SCAN)).toBe(true);
    expect(processor.supports(JOB_GAME_METADATA_REFRESH_SCAN)).toBe(true);
    expect(processor.supports(JOB_GAME_MEDIA_INGEST)).toBe(true);
  });

  it('rejects jobs belonging to other queues', () => {
    const { processor } = createProcessor();

    expect(processor.supports('feed.fanout')).toBe(false);
    expect(processor.supports('search.index.upsert')).toBe(false);
  });
});

describe('GameMetadataProcessor.process', () => {
  it('routes an enrich job with its reason and identity hints', async () => {
    const { processor, metadata } = createProcessor();

    await processor.process(
      job(JOB_GAME_METADATA_ENRICH, {
        gameId: 'game-1',
        reason: 'backfill',
        steamAppId: 1145360,
        igdbId: null,
      }),
    );

    expect(metadata.enrich).toHaveBeenCalledWith('game-1', 'backfill', {
      steamAppId: 1145360,
      igdbId: null,
    });
  });

  it('routes the backfill scan', async () => {
    const { processor, backfill } = createProcessor();

    await processor.process(job(JOB_GAME_METADATA_BACKFILL_SCAN, {}));

    expect(backfill.runBackfillScan).toHaveBeenCalledTimes(1);
    expect(backfill.runRefreshScan).not.toHaveBeenCalled();
  });

  it('routes the refresh scan', async () => {
    const { processor, backfill } = createProcessor();

    await processor.process(job(JOB_GAME_METADATA_REFRESH_SCAN, {}));

    expect(backfill.runRefreshScan).toHaveBeenCalledTimes(1);
    expect(backfill.runBackfillScan).not.toHaveBeenCalled();
  });

  it('routes a media ingest job', async () => {
    const { processor, media } = createProcessor();
    const data = {
      gameId: 'game-1',
      kind: 'cover',
      sourceUrl: 'https://a/c.jpg',
      provider: 'igdb',
      sortOrder: 0,
      width: null,
      height: null,
      promote: true,
    };

    await processor.process(job(JOB_GAME_MEDIA_INGEST, data));

    expect(media.ingest).toHaveBeenCalledWith(data);
  });

  it('throws on an unknown job name so it lands in the DLQ', async () => {
    const { processor } = createProcessor();

    await expect(processor.process(job('game.unknown', {}))).rejects.toThrow(
      'Unknown catalog job: game.unknown',
    );
  });

  it('propagates a service failure so BullMQ retries', async () => {
    const { processor, metadata } = createProcessor();
    vi.mocked(metadata.enrich).mockRejectedValueOnce(new Error('provider down'));

    await expect(
      processor.process(job(JOB_GAME_METADATA_ENRICH, { gameId: 'game-1', reason: 'created' })),
    ).rejects.toThrow('provider down');
  });
});
