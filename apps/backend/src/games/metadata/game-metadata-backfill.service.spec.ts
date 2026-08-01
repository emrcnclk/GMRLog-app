import { describe, expect, it, vi } from 'vitest';

import { AppLogger } from '../../infrastructure/logging/app-logger.service';

import { GameMetadataBackfillService } from './game-metadata-backfill.service';
import { GameMetadataPublisher } from './game-metadata.publisher';
import { DEFAULT_METADATA_CONFIG } from './metadata.config';
import {
  FakeGameMetadataRepository,
  makeBackfillCandidate,
} from './testing/fake-metadata-repository';

function createLogger(): AppLogger {
  return { event: vi.fn(), log: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as AppLogger;
}

function createHarness(
  candidates = [makeBackfillCandidate()],
  enqueueResult: string | null = 'job-1',
): {
  service: GameMetadataBackfillService;
  repository: FakeGameMetadataRepository;
  publisher: GameMetadataPublisher;
} {
  const repository = new FakeGameMetadataRepository(candidates);
  const publisher = {
    enqueueEnrich: vi.fn(async () => enqueueResult),
  } as unknown as GameMetadataPublisher;
  const service = new GameMetadataBackfillService(
    repository,
    publisher,
    createLogger(),
    DEFAULT_METADATA_CONFIG,
  );
  return { service, repository, publisher };
}

describe('GameMetadataBackfillService.runBackfillScan', () => {
  it('enqueues every selected candidate with reason "backfill"', async () => {
    const candidates = [
      makeBackfillCandidate({ id: 'game-1' }),
      makeBackfillCandidate({ id: 'game-2' }),
    ];
    const { service, publisher } = createHarness(candidates);

    const result = await service.runBackfillScan();

    expect(result).toEqual({ selected: 2, enqueued: 2 });
    expect(publisher.enqueueEnrich).toHaveBeenCalledWith(
      expect.objectContaining({ gameId: 'game-1', reason: 'backfill' }),
    );
  });

  it('forwards known external ids so the chain can take the exact-lookup path', async () => {
    const { service, publisher } = createHarness([
      makeBackfillCandidate({ igdbId: 1905, steamAppId: 1145360 }),
    ]);

    await service.runBackfillScan();

    expect(publisher.enqueueEnrich).toHaveBeenCalledWith(
      expect.objectContaining({ igdbId: 1905, steamAppId: 1145360 }),
    );
  });

  it('honours the configured batch ceiling', async () => {
    const candidates = Array.from({ length: 500 }, (_, index) =>
      makeBackfillCandidate({ id: `game-${String(index)}` }),
    );
    const { service } = createHarness(candidates);

    const result = await service.runBackfillScan();

    expect(result.selected).toBe(DEFAULT_METADATA_CONFIG.backfillBatchSize);
  });

  it('counts only successful enqueues', async () => {
    const { service } = createHarness([makeBackfillCandidate()], null);

    const result = await service.runBackfillScan();

    expect(result).toEqual({ selected: 1, enqueued: 0 });
  });

  it('is a no-op on an empty catalog', async () => {
    const { service, publisher } = createHarness([]);

    const result = await service.runBackfillScan();

    expect(result).toEqual({ selected: 0, enqueued: 0 });
    expect(publisher.enqueueEnrich).not.toHaveBeenCalled();
  });

  it('never calls a provider — it only selects and enqueues', async () => {
    const { service, repository } = createHarness();

    await service.runBackfillScan();

    expect(repository.applied).toHaveLength(0);
    expect(repository.runs).toHaveLength(0);
  });
});

describe('GameMetadataBackfillService.runRefreshScan', () => {
  it('marks records past the staleness window and enqueues them', async () => {
    const { service, publisher } = createHarness([makeBackfillCandidate({ id: 'game-1' })]);

    const result = await service.runRefreshScan(new Date('2026-07-31T00:00:00.000Z'));

    expect(result).toEqual({ selected: 1, enqueued: 1 });
    expect(publisher.enqueueEnrich).toHaveBeenCalledWith({
      gameId: 'game-1',
      reason: 'refresh',
    });
  });

  it('computes the cutoff from the configured interval', async () => {
    const repository = new FakeGameMetadataRepository([makeBackfillCandidate()]);
    const markStale = vi.spyOn(repository, 'markStale');
    const publisher = {
      enqueueEnrich: vi.fn(async () => 'job-1'),
    } as unknown as GameMetadataPublisher;
    const service = new GameMetadataBackfillService(
      repository,
      publisher,
      createLogger(),
      DEFAULT_METADATA_CONFIG,
    );

    const now = new Date('2026-07-31T00:00:00.000Z');
    await service.runRefreshScan(now);

    const cutoff = markStale.mock.calls[0]?.[0] as Date;
    const expected = new Date(
      now.getTime() - DEFAULT_METADATA_CONFIG.refreshIntervalDays * 86_400_000,
    );
    expect(cutoff.toISOString()).toBe(expected.toISOString());
  });

  it('uses the refresh batch ceiling, not the backfill one', async () => {
    const repository = new FakeGameMetadataRepository([makeBackfillCandidate()]);
    const markStale = vi.spyOn(repository, 'markStale');
    const service = new GameMetadataBackfillService(
      repository,
      { enqueueEnrich: vi.fn(async () => 'job-1') } as unknown as GameMetadataPublisher,
      createLogger(),
      DEFAULT_METADATA_CONFIG,
    );

    await service.runRefreshScan();

    expect(markStale.mock.calls[0]?.[1]).toBe(DEFAULT_METADATA_CONFIG.refreshBatchSize);
  });

  it('is a no-op when nothing is stale', async () => {
    const { service, publisher } = createHarness([]);

    const result = await service.runRefreshScan();

    expect(result).toEqual({ selected: 0, enqueued: 0 });
    expect(publisher.enqueueEnrich).not.toHaveBeenCalled();
  });
});
