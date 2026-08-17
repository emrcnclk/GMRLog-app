import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';

import { parseBackendEnv } from '../../infrastructure/config/env.schema';
import { createJobPayload } from '../../infrastructure/jobs/job-payload';
import {
  JOB_GAME_MEDIA_INGEST,
  JOB_GAME_METADATA_ENRICH,
} from '../../infrastructure/jobs/job-names';
import { AppLogger } from '../../infrastructure/logging/app-logger.service';

import { GameCatalogSyncProcessor } from './game-catalog-sync.processor';
import { GameCatalogWorkerService } from './game-catalog-worker.service';
import { GameMetadataProcessor } from './game-metadata.processor';
import { DEFAULT_METADATA_CONFIG } from './metadata.config';

const workerState = vi.hoisted(() => ({
  workerClose: vi.fn().mockResolvedValue(undefined),
  workerOn: vi.fn(),
  handlers: [] as ((job: Job) => Promise<void>)[],
  constructed: [] as string[],
}));

vi.mock('bullmq', () => ({
  Worker: vi.fn(function WorkerMock(name: string, handler: (job: Job) => Promise<void>) {
    workerState.constructed.push(name);
    workerState.handlers.push(handler);
    return { on: workerState.workerOn, close: workerState.workerClose, name };
  }),
}));

/**
 * D3.25 — docs/18_CATALOG/METADATA_QUEUES.md §8. Mirrors the WorkerRunnerService
 * test pattern: mock BullMQ's Worker, drive dispatch through the captured handler.
 */
describe('GameCatalogWorkerService', () => {
  let service: GameCatalogWorkerService;
  let processor: GameMetadataProcessor;
  let catalogSyncProcessor: GameCatalogSyncProcessor;

  beforeEach(() => {
    workerState.workerClose.mockClear();
    workerState.workerOn.mockClear();
    workerState.handlers.length = 0;
    workerState.constructed.length = 0;

    processor = {
      supports: vi.fn().mockReturnValue(true),
      process: vi.fn().mockResolvedValue(undefined),
    } as unknown as GameMetadataProcessor;

    catalogSyncProcessor = {
      supports: vi.fn().mockReturnValue(true),
      process: vi.fn().mockResolvedValue(undefined),
    } as unknown as GameCatalogSyncProcessor;

    service = new GameCatalogWorkerService(
      {} as never,
      new AppLogger(parseBackendEnv({})),
      processor,
      catalogSyncProcessor,
      DEFAULT_METADATA_CONFIG,
    );
  });

  it('starts one worker per catalog queue', () => {
    service.onModuleInit();
    expect(workerState.constructed).toEqual(['game.metadata', 'game.media', 'game.catalog-sync']);
  });

  it('closes every worker on destroy', async () => {
    service.onModuleInit();
    await service.onModuleDestroy();
    expect(workerState.workerClose).toHaveBeenCalledTimes(3);
  });

  it('dispatches a metadata job through the processor', async () => {
    service.onModuleInit();
    const [metadataHandler] = workerState.handlers;

    await metadataHandler?.({
      name: JOB_GAME_METADATA_ENRICH,
      data: createJobPayload(
        { gameId: 'game-1', reason: 'created' },
        { idempotencyKey: 'game.metadata:enrich:game-1:created' },
      ),
    } as Job);

    expect(processor.process).toHaveBeenCalledOnce();
  });

  it('dispatches a media job through the processor', async () => {
    service.onModuleInit();
    const [, mediaHandler] = workerState.handlers;

    await mediaHandler?.({
      name: JOB_GAME_MEDIA_INGEST,
      data: createJobPayload(
        {
          gameId: 'game-1',
          kind: 'cover',
          sourceUrl: 'https://a/c.jpg',
          provider: 'igdb',
          sortOrder: 0,
          width: null,
          height: null,
          promote: true,
        },
        { idempotencyKey: 'game.media:ingest:game-1:cover:https://a/c.jpg' },
      ),
    } as Job);

    expect(processor.process).toHaveBeenCalledOnce();
  });

  it('throws for an unrecognised job rather than silently dropping it', async () => {
    vi.mocked(processor.supports).mockReturnValue(false);
    service.onModuleInit();
    const [metadataHandler] = workerState.handlers;

    await expect(
      metadataHandler?.({
        name: 'game.unknown',
        data: createJobPayload({}, { idempotencyKey: 'x' }),
      } as Job),
    ).rejects.toThrow('Unknown catalog job: game.unknown');
  });

  it('registers a failure listener on every worker', () => {
    service.onModuleInit();
    expect(workerState.workerOn).toHaveBeenCalledTimes(3);
    expect(workerState.workerOn).toHaveBeenCalledWith('failed', expect.any(Function));
  });
});
