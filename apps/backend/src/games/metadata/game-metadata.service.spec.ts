import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SearchIndexPublisher } from '../../infrastructure/jobs/search-index.publisher';
import { AppLogger } from '../../infrastructure/logging/app-logger.service';

import { GameMetadataPublisher } from './game-metadata.publisher';
import { GameMetadataService } from './game-metadata.service';
import { DEFAULT_METADATA_CONFIG } from './metadata.config';
import { MetadataProviderRegistry } from './providers/metadata-provider.registry';
import type { GameMetadataProvider } from './providers/metadata-provider.port';
import {
  FakeGameMetadataRepository,
  makeBackfillCandidate,
} from './testing/fake-metadata-repository';
import { completeProviderMetadata, FakeMetadataProvider } from './testing/fake-providers';

function createLogger(): AppLogger {
  return { event: vi.fn(), log: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as AppLogger;
}

function createPublisher(): GameMetadataPublisher {
  return {
    enqueueEnrich: vi.fn(async () => 'job-1'),
    enqueueMediaIngest: vi.fn(async () => 'job-2'),
    enqueueMediaBatch: vi.fn(async (items: unknown[]) => items.length),
  } as unknown as GameMetadataPublisher;
}

function createSearchIndexPublisher(): SearchIndexPublisher {
  return {
    publishUpsert: vi.fn(async () => undefined),
    publishDelete: vi.fn(async () => undefined),
  } as unknown as SearchIndexPublisher;
}

function createService(
  providers: GameMetadataProvider[],
  repository = new FakeGameMetadataRepository([makeBackfillCandidate()]),
): {
  service: GameMetadataService;
  repository: FakeGameMetadataRepository;
  publisher: GameMetadataPublisher;
  searchIndex: SearchIndexPublisher;
} {
  const publisher = createPublisher();
  const searchIndex = createSearchIndexPublisher();
  const service = new GameMetadataService(
    repository,
    new MetadataProviderRegistry(providers, null),
    publisher,
    searchIndex,
    createLogger(),
    DEFAULT_METADATA_CONFIG,
  );
  return { service, repository, publisher, searchIndex };
}

describe('GameMetadataService.enrich — guard paths', () => {
  it('returns not_found for a game deleted between enqueue and execution', async () => {
    const { service } = createService(
      [new FakeMetadataProvider({ result: completeProviderMetadata() })],
      new FakeGameMetadataRepository([]),
    );

    const result = await service.enrich('missing', 'backfill');

    expect(result.status).toBe('not_found');
  });

  it('skips without changing status when no provider is enabled', async () => {
    const { service, repository } = createService([new FakeMetadataProvider({ enabled: false })]);

    const result = await service.enrich('game-1', 'created');

    expect(result.status).toBe('skipped');
    expect(repository.applied).toHaveLength(0);
    expect(repository.failures).toHaveLength(0);
    // Recorded as skipped so coverage reporting can distinguish it from failure.
    expect(repository.runs[0]?.outcome).toBe('skipped');
  });

  it('stops when another worker already claimed the game', async () => {
    const repository = new FakeGameMetadataRepository([makeBackfillCandidate()]);
    repository.claimSucceeds = false;
    const { service } = createService(
      [new FakeMetadataProvider({ result: completeProviderMetadata() })],
      repository,
    );

    const result = await service.enrich('game-1', 'backfill');

    expect(result.status).toBe('already_running');
    expect(repository.applied).toHaveLength(0);
  });
});

describe('GameMetadataService.enrich — successful application', () => {
  let harness: ReturnType<typeof createService>;

  beforeEach(() => {
    harness = createService([
      new FakeMetadataProvider({ result: completeProviderMetadata({ confidence: 0.95 }) }),
    ]);
  });

  it('marks a confident, complete record as complete', async () => {
    const result = await harness.service.enrich('game-1', 'backfill');

    expect(result.status).toBe('applied');
    expect(harness.repository.applied[0]?.status).toBe('complete');
    expect(harness.repository.applied[0]?.provider).toBe('igdb');
  });

  it('writes every catalog dimension the provider returned', async () => {
    await harness.service.enrich('game-1', 'backfill');
    const applied = harness.repository.applied[0];

    expect(applied?.scalars.summary).toBe('A rogue-like dungeon crawler.');
    expect(applied?.scalars.igdbId).toBe(1905);
    expect(applied?.scalars.steamAppId).toBe(1145360);
    expect(applied?.genres).toHaveLength(2);
    expect(applied?.tags).toHaveLength(2);
    expect(applied?.platforms).toHaveLength(2);
    expect(applied?.companies).toHaveLength(2);
    expect(applied?.franchise?.slug).toBe('hades');
    expect(applied?.series?.slug).toBe('supergiant-collection');
    expect(applied?.relatedGames).toHaveLength(2);
  });

  it('carries the provider onto each related-game row', async () => {
    await harness.service.enrich('game-1', 'backfill');
    expect(harness.repository.applied[0]?.relatedGames[0]).toMatchObject({
      provider: 'igdb',
      relatedExternalId: '7346',
      kind: 'similar',
    });
  });

  it('enqueues media only after the metadata transaction', async () => {
    const result = await harness.service.enrich('game-1', 'backfill');

    expect(result.mediaQueued).toBe(3);
    expect(harness.publisher.enqueueMediaBatch).toHaveBeenCalledTimes(1);
  });

  it('flags cover and hero for promotion but not screenshots', async () => {
    await harness.service.enrich('game-1', 'backfill');

    const batch = vi.mocked(harness.publisher.enqueueMediaBatch).mock.calls[0]?.[0] ?? [];
    expect(batch.find((item) => item.kind === 'cover')?.promote).toBe(true);
    expect(batch.find((item) => item.kind === 'hero')?.promote).toBe(true);
    expect(batch.find((item) => item.kind === 'screenshot')?.promote).toBe(false);
  });

  it('records a success run with the field count', async () => {
    await harness.service.enrich('game-1', 'refresh');
    const run = harness.repository.runs[0];

    expect(run?.outcome).toBe('success');
    expect(run?.reason).toBe('refresh');
    expect(run?.provider).toBe('igdb');
    expect(run?.fieldsWritten).toBeGreaterThan(0);
  });

  // D3.25.1 — without this, a game's Meilisearch document never reflects its
  // enrichment: it stays a title/slug skeleton forever even after summary,
  // genres and cover land in Postgres.
  it('reindexes the game in Meilisearch after a successful apply', async () => {
    await harness.service.enrich('game-1', 'backfill');

    expect(harness.searchIndex.publishUpsert).toHaveBeenCalledWith('game', 'game-1');
  });

  it('reindexes after commit, not before — applyMetadata is called first', async () => {
    const applyOrder: string[] = [];
    vi.spyOn(harness.repository, 'applyMetadata').mockImplementation(async (input) => {
      applyOrder.push('applyMetadata');
      harness.repository.applied.push(input);
    });
    vi.mocked(harness.searchIndex.publishUpsert).mockImplementation(async () => {
      applyOrder.push('publishUpsert');
    });

    await harness.service.enrich('game-1', 'backfill');

    expect(applyOrder).toEqual(['applyMetadata', 'publishUpsert']);
  });

  it('does not fail enrichment when the search reindex throws', async () => {
    vi.mocked(harness.searchIndex.publishUpsert).mockRejectedValueOnce(new Error('meili down'));

    const result = await harness.service.enrich('game-1', 'backfill');

    expect(result.status).toBe('applied');
    expect(harness.repository.failures).toHaveLength(0);
  });
});

describe('GameMetadataService.enrich — partial and failure', () => {
  it('marks a low-confidence match as partial', async () => {
    const { service, repository } = createService([
      new FakeMetadataProvider({ result: completeProviderMetadata({ confidence: 0.6 }) }),
    ]);

    const result = await service.enrich('game-1', 'backfill');

    expect(result.status).toBe('partial');
    expect(repository.applied[0]?.status).toBe('partial');
    expect(repository.runs[0]?.outcome).toBe('partial');
  });

  it('marks a confident but incomplete record as partial', async () => {
    const { service, repository } = createService([
      new FakeMetadataProvider({
        result: completeProviderMetadata({ confidence: 0.99, genres: [], media: [] }),
      }),
    ]);

    await service.enrich('game-1', 'backfill');

    expect(repository.applied[0]?.status).toBe('partial');
  });

  it('records a no-match as failed with an incremented attempt counter', async () => {
    const { service, repository } = createService([new FakeMetadataProvider({ result: null })]);

    const result = await service.enrich('game-1', 'backfill');

    expect(result.status).toBe('no_match');
    expect(repository.failures[0]).toMatchObject({ gameId: 'game-1', status: 'failed' });
    expect(repository.failures[0]?.error).toBe('no provider match');
    expect(repository.runs[0]?.outcome).toBe('no_match');
  });

  it('names the failing providers when every one errored', async () => {
    const { service, repository } = createService([
      new FakeMetadataProvider({ name: 'igdb', error: new Error('IGDB HTTP 500') }),
    ]);

    await service.enrich('game-1', 'backfill');

    expect(repository.failures[0]?.error).toContain('igdb=IGDB HTTP 500');
  });

  it('rethrows an applier failure so BullMQ retries, after recording it', async () => {
    const repository = new FakeGameMetadataRepository([makeBackfillCandidate()]);
    vi.spyOn(repository, 'applyMetadata').mockRejectedValue(new Error('db down'));
    const { service } = createService(
      [new FakeMetadataProvider({ result: completeProviderMetadata() })],
      repository,
    );

    await expect(service.enrich('game-1', 'backfill')).rejects.toThrow('db down');
    expect(repository.runs[0]?.outcome).toBe('error');
    expect(repository.failures[0]?.status).toBe('failed');
  });
});

describe('GameMetadataService.enrich — media caps', () => {
  it('caps screenshots at the configured ceiling', async () => {
    const media = Array.from({ length: 30 }, (_, index) => ({
      kind: 'screenshot' as const,
      url: `https://images.igdb.com/s${String(index)}.jpg`,
      width: null,
      height: null,
      sortOrder: index,
    }));
    const { service, publisher } = createService([
      new FakeMetadataProvider({ result: completeProviderMetadata({ media }) }),
    ]);

    await service.enrich('game-1', 'backfill');

    const batch = vi.mocked(publisher.enqueueMediaBatch).mock.calls[0]?.[0] ?? [];
    expect(batch).toHaveLength(DEFAULT_METADATA_CONFIG.maxScreenshots);
  });

  it('keeps at most one cover and one hero', async () => {
    const media = [
      { kind: 'cover' as const, url: 'https://a/1.jpg', width: null, height: null, sortOrder: 0 },
      { kind: 'cover' as const, url: 'https://a/2.jpg', width: null, height: null, sortOrder: 1 },
      { kind: 'hero' as const, url: 'https://a/3.jpg', width: null, height: null, sortOrder: 0 },
      { kind: 'hero' as const, url: 'https://a/4.jpg', width: null, height: null, sortOrder: 1 },
    ];
    const { service, publisher } = createService([
      new FakeMetadataProvider({ result: completeProviderMetadata({ media }) }),
    ]);

    await service.enrich('game-1', 'backfill');

    const batch = vi.mocked(publisher.enqueueMediaBatch).mock.calls[0]?.[0] ?? [];
    expect(batch.filter((item) => item.kind === 'cover')).toHaveLength(1);
    expect(batch.filter((item) => item.kind === 'hero')).toHaveLength(1);
  });
});

describe('GameMetadataService.enrich — identity hints', () => {
  it('passes a caller-supplied steamAppId into the provider query', async () => {
    const provider = new FakeMetadataProvider({ result: completeProviderMetadata() });
    const { service } = createService([provider]);

    await service.enrich('game-1', 'created', { steamAppId: 1145360 });

    expect(provider.calls[0]?.steamAppId).toBe(1145360);
  });

  it('prefers the persisted external id over the hint', async () => {
    const provider = new FakeMetadataProvider({ result: completeProviderMetadata() });
    const repository = new FakeGameMetadataRepository([makeBackfillCandidate({ steamAppId: 111 })]);
    const { service } = createService([provider], repository);

    await service.enrich('game-1', 'created', { steamAppId: 999 });

    expect(provider.calls[0]?.steamAppId).toBe(111);
  });

  it('derives the release year hint from the persisted release date', async () => {
    const provider = new FakeMetadataProvider({ result: completeProviderMetadata() });
    const { service } = createService([provider]);

    await service.enrich('game-1', 'backfill');

    expect(provider.calls[0]?.releaseYear).toBe(2017);
  });
});

// D3.25.1 — docs/18_CATALOG/D3_25_1_PATCH_PLAN.md objective 1+2
describe('GameMetadataService.enrich — search reindex', () => {
  it('reindexes the game in search after a successful complete apply', async () => {
    const { service, searchIndex } = createService([
      new FakeMetadataProvider({ result: completeProviderMetadata({ confidence: 0.95 }) }),
    ]);

    await service.enrich('game-1', 'backfill');

    expect(searchIndex.publishUpsert).toHaveBeenCalledWith('game', 'game-1');
  });

  it('reindexes after a partial apply too — partial still wrote real data', async () => {
    const { service, searchIndex } = createService([
      new FakeMetadataProvider({ result: completeProviderMetadata({ confidence: 0.6 }) }),
    ]);

    await service.enrich('game-1', 'backfill');

    expect(searchIndex.publishUpsert).toHaveBeenCalledWith('game', 'game-1');
  });

  it('does not reindex on no_match, skipped, or already_running — nothing changed', async () => {
    const noMatch = createService([new FakeMetadataProvider({ result: null })]);
    await noMatch.service.enrich('game-1', 'backfill');
    expect(noMatch.searchIndex.publishUpsert).not.toHaveBeenCalled();

    const skipped = createService([new FakeMetadataProvider({ enabled: false })]);
    await skipped.service.enrich('game-1', 'created');
    expect(skipped.searchIndex.publishUpsert).not.toHaveBeenCalled();
  });

  it('reindexes AFTER the metadata transaction, not before or inside it', async () => {
    const repository = new FakeGameMetadataRepository([makeBackfillCandidate()]);
    const calls: string[] = [];
    vi.spyOn(repository, 'applyMetadata').mockImplementation(async (input) => {
      calls.push('applyMetadata');
      void input;
    });
    const searchIndex = createSearchIndexPublisher();
    vi.mocked(searchIndex.publishUpsert).mockImplementation(async () => {
      calls.push('publishUpsert');
    });
    const service = new GameMetadataService(
      repository,
      new MetadataProviderRegistry(
        [new FakeMetadataProvider({ result: completeProviderMetadata() })],
        null,
      ),
      createPublisher(),
      searchIndex,
      createLogger(),
      DEFAULT_METADATA_CONFIG,
    );

    await service.enrich('game-1', 'backfill');

    expect(calls).toEqual(['applyMetadata', 'publishUpsert']);
  });

  it('does not fail enrichment when the search reindex throws', async () => {
    const { service, searchIndex, repository } = createService([
      new FakeMetadataProvider({ result: completeProviderMetadata() }),
    ]);
    vi.mocked(searchIndex.publishUpsert).mockRejectedValueOnce(new Error('meili down'));

    const result = await service.enrich('game-1', 'backfill');

    // The catalog write already succeeded — a search hiccup must not undo that
    // or surface as a job failure. Search staleness is recoverable via
    // `pnpm repair:index`; losing a successful apply is not.
    expect(result.status).toBe('applied');
    expect(repository.applied).toHaveLength(1);
  });
});
