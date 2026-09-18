import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../infrastructure/database/prisma.service';
import { AppLogger } from '../../infrastructure/logging/app-logger.service';
import type { ObjectStoragePort } from '../../infrastructure/storage/object-storage.port';

import { GameMediaBackfillService } from './game-media-backfill.service';
import { DEFAULT_METADATA_CONFIG } from './metadata.config';
import { GameMetadataPublisher } from './game-metadata.publisher';
import type { GameMediaIngestJobData } from './metadata.job-data';
import { IgdbMetadataProvider } from './providers/igdb.provider';
import type { ProviderMediaRef } from './providers/metadata-provider.port';
import { FakeGameMetadataRepository } from './testing/fake-metadata-repository';

function createLogger(): AppLogger {
  return { event: vi.fn(), log: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as AppLogger;
}

const ref = (kind: ProviderMediaRef['kind'], image: string, sortOrder = 0): ProviderMediaRef => ({
  kind,
  url: `https://images.igdb.com/igdb/image/upload/t_1080p/${image}.jpg`,
  width: 1920,
  height: 1080,
  sortOrder,
});

function createHarness(options: {
  gamePages?: { id: string; igdbId: number | null }[][];
  media?: Map<number, ProviderMediaRef[]>;
  mediaRows?: Record<string, unknown>[][];
  presentKeys?: Set<string>;
}) {
  const gameFindMany = vi.fn();
  for (const page of options.gamePages ?? []) gameFindMany.mockResolvedValueOnce(page);
  gameFindMany.mockResolvedValue([]);

  const mediaFindMany = vi.fn();
  for (const page of options.mediaRows ?? []) mediaFindMany.mockResolvedValueOnce(page);
  mediaFindMany.mockResolvedValue([]);

  const prisma = {
    game: { findMany: gameFindMany },
    gameMedia: { findMany: mediaFindMany },
  } as unknown as PrismaService;

  const listMediaByIgdbIds = vi.fn(async () => options.media ?? new Map());
  const igdb = { listMediaByIgdbIds } as unknown as IgdbMetadataProvider;

  const enqueued: GameMediaIngestJobData[] = [];
  const enqueueMediaBatch = vi.fn(async (items: readonly GameMediaIngestJobData[]) => {
    enqueued.push(...items);
    return items.length;
  });
  const publisher = { enqueueMediaBatch } as unknown as GameMetadataPublisher;

  const present = options.presentKeys ?? new Set<string>();
  const headObject = vi.fn(async (key: string) =>
    present.has(key) ? { contentLength: 1, contentType: 'image/webp' } : null,
  );
  const storage = { headObject } as unknown as ObjectStoragePort;

  const repository = new FakeGameMetadataRepository();
  const service = new GameMediaBackfillService(
    igdb,
    prisma,
    publisher,
    createLogger(),
    storage,
    repository,
    DEFAULT_METADATA_CONFIG,
  );
  return {
    service,
    gameFindMany,
    mediaFindMany,
    listMediaByIgdbIds,
    enqueued,
    headObject,
    repository,
  };
}

describe('GameMediaBackfillService.linkProviderMedia', () => {
  // The catalog's media model since 2026-09: images are referenced by their
  // provider URL. Nothing here may put a single job on the download queue.
  it('records every image IGDB offers as a reference and downloads nothing', async () => {
    const { service, repository, enqueued } = createHarness({
      gamePages: [
        [
          { id: 'g1', igdbId: 1 },
          { id: 'g2', igdbId: 2 },
        ],
      ],
      media: new Map([
        [1, [ref('cover', 'co-1'), ref('hero', 'art-1'), ref('screenshot', 'shot-1')]],
        [2, [ref('cover', 'co-2')]],
      ]),
    });

    const stats = await service.linkProviderMedia();

    expect(enqueued).toHaveLength(0);
    expect(stats.linked).toBe(4);
    expect(repository.linkedRefs.map((row) => `${row.gameId}:${row.kind}`)).toEqual([
      'g1:cover',
      'g1:hero',
      'g1:screenshot',
      'g2:cover',
    ]);
    // The URL is the reference — the same string that will be served.
    expect(repository.linkedRefs[0]?.url).toContain('co-1.jpg');
    expect(repository.linkedRefs[0]?.provider).toBe('igdb');
  });

  // One policy for how many images a game keeps, whichever way they are kept.
  it('applies the same caps the enrich path uses', async () => {
    const shots = Array.from({ length: 20 }, (_, index) =>
      ref('screenshot', `s${String(index)}`, index),
    );
    const { service, repository } = createHarness({
      gamePages: [[{ id: 'g1', igdbId: 1 }]],
      media: new Map([[1, shots]]),
    });

    await service.linkProviderMedia();

    expect(repository.linkedRefs).toHaveLength(DEFAULT_METADATA_CONFIG.maxScreenshots);
  });

  it('walks every catalog game by id cursor, not only the ones missing media', async () => {
    const { service, gameFindMany } = createHarness({
      gamePages: [[{ id: 'g1', igdbId: 1 }], [{ id: 'g2', igdbId: 2 }]],
    });

    const stats = await service.linkProviderMedia();

    expect(stats.batches).toHaveLength(2);
    expect(gameFindMany.mock.calls[0]?.[0]?.where).toEqual({ igdbId: { not: null } });
    expect(gameFindMany.mock.calls[1]?.[0]?.where?.id).toEqual({ gt: 'g1' });
    expect(gameFindMany.mock.calls[1]?.[0]?.orderBy).toEqual({ id: 'asc' });
  });

  it('stops at maxBatches', async () => {
    const { service, listMediaByIgdbIds } = createHarness({
      gamePages: [[{ id: 'g1', igdbId: 1 }], [{ id: 'g2', igdbId: 2 }]],
    });

    await service.linkProviderMedia({ maxBatches: 1 });

    expect(listMediaByIgdbIds).toHaveBeenCalledOnce();
  });
});

describe('GameMediaBackfillService.repairMissingObjects', () => {
  const row = (id: string, storageKey: string, provider: string | null = 'igdb') => ({
    id,
    gameId: `game-${id}`,
    kind: 'cover',
    storageKey,
    provider,
    sourceUrl: `https://images.igdb.com/${id}.jpg`,
    sortOrder: 0,
    width: 264,
    height: 374,
  });

  it('re-enqueues only rows whose object is gone, as forced jobs with the row as it was', async () => {
    const { service, enqueued } = createHarness({
      mediaRows: [
        [row('m1', 'games/a/cover/x-standard.webp'), row('m2', 'games/b/cover/y-standard.webp')],
      ],
      presentKeys: new Set(['games/b/cover/y-standard.webp']),
    });

    const stats = await service.repairMissingObjects();

    expect(stats.checked).toBe(2);
    expect(stats.missing).toBe(1);
    expect(enqueued).toEqual([
      {
        gameId: 'game-m1',
        kind: 'cover',
        sourceUrl: 'https://images.igdb.com/m1.jpg',
        provider: 'igdb',
        sortOrder: 0,
        width: 264,
        height: 374,
        promote: true,
        force: true,
      },
    ]);
  });

  it('counts a missing row with no provider and leaves it alone', async () => {
    const { service, enqueued } = createHarness({
      mediaRows: [[row('m1', 'games/a/cover/x-standard.webp', null)]],
    });

    const stats = await service.repairMissingObjects();

    expect(stats.missing).toBe(1);
    expect(stats.skippedNoProvider).toBe(1);
    expect(enqueued).toHaveLength(0);
  });

  // A reference has no stored object; HEADing it against our bucket would
  // report it missing and download it — the one thing a reference avoids.
  it('never checks a referenced row, so never downloads one', async () => {
    const { service, mediaFindMany } = createHarness({});

    await service.repairMissingObjects();

    expect(mediaFindMany.mock.calls[0]?.[0]?.where?.NOT).toEqual({
      storageKey: { startsWith: 'https://' },
    });
  });

  it('only reads rows — no delete is ever reachable from the repair', async () => {
    const { service, mediaFindMany } = createHarness({
      mediaRows: [[row('m1', 'games/a/cover/x-standard.webp')]],
    });

    await service.repairMissingObjects();

    expect(mediaFindMany).toHaveBeenCalled();
    expect(mediaFindMany.mock.calls[0]?.[0]?.where).toEqual({
      sourceUrl: { not: null },
      NOT: { storageKey: { startsWith: 'https://' } },
    });
  });
});
