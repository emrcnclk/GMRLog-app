import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../infrastructure/database/prisma.service';
import { AppLogger } from '../../infrastructure/logging/app-logger.service';
import type { ObjectStoragePort } from '../../infrastructure/storage/object-storage.port';

import { GameMediaBackfillService } from './game-media-backfill.service';
import { GameMetadataPublisher } from './game-metadata.publisher';
import type { GameMediaIngestJobData } from './metadata.job-data';
import { IgdbMetadataProvider } from './providers/igdb.provider';
import type { ProviderMediaRef } from './providers/metadata-provider.port';

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

  const service = new GameMediaBackfillService(igdb, prisma, publisher, createLogger(), storage);
  return { service, gameFindMany, mediaFindMany, listMediaByIgdbIds, enqueued, headObject };
}

describe('GameMediaBackfillService.enqueueBanners', () => {
  it("enqueues the provider's hero, falls back to a screenshot, and counts games with neither", async () => {
    const { service, enqueued } = createHarness({
      gamePages: [
        [
          { id: 'g1', igdbId: 1 },
          { id: 'g2', igdbId: 2 },
          { id: 'g3', igdbId: 3 },
        ],
      ],
      media: new Map([
        [1, [ref('hero', 'art-1'), ref('artwork', 'art-1b', 1), ref('screenshot', 'shot-1')]],
        [2, [ref('screenshot', 'shot-2b', 1), ref('screenshot', 'shot-2a', 0)]],
        [3, []],
      ]),
    });

    const stats = await service.enqueueBanners();

    expect(stats.heroQueued).toBe(1);
    expect(stats.screenshotQueued).toBe(1);
    expect(stats.noSource).toBe(1);
    expect(enqueued).toHaveLength(2);

    const hero = enqueued.find((job) => job.gameId === 'g1');
    expect(hero).toMatchObject({ kind: 'hero', provider: 'igdb', promote: true });
    expect(hero?.sourceUrl).toContain('art-1.jpg');

    // A screenshot stands in for a banner without becoming one: it is not
    // promoted into `hero_key`, and it is the first by sort order.
    const shot = enqueued.find((job) => job.gameId === 'g2');
    expect(shot).toMatchObject({ kind: 'screenshot', promote: false });
    expect(shot?.sourceUrl).toContain('shot-2a.jpg');
  });

  it('asks only for games that have neither a hero nor a screenshot yet', async () => {
    const { service, gameFindMany } = createHarness({});

    await service.enqueueBanners();

    expect(gameFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          igdbId: { not: null },
          heroKey: null,
          media: { none: { kind: { in: ['hero', 'screenshot'] } } },
        }),
      }),
    );
  });

  // Keyset, never offset — the set shrinks as jobs land, and an offset would
  // silently skip rows.
  it('walks by id cursor from one batch to the next', async () => {
    const { service, gameFindMany } = createHarness({
      gamePages: [[{ id: 'g1', igdbId: 1 }], [{ id: 'g2', igdbId: 2 }]],
    });

    const stats = await service.enqueueBanners();

    expect(stats.batches).toHaveLength(2);
    expect(gameFindMany.mock.calls[0]?.[0]?.where?.id).toBeUndefined();
    expect(gameFindMany.mock.calls[1]?.[0]?.where?.id).toEqual({ gt: 'g1' });
    expect(gameFindMany.mock.calls[1]?.[0]?.orderBy).toEqual({ id: 'asc' });
  });

  it('stops at maxBatches', async () => {
    const { service, listMediaByIgdbIds } = createHarness({
      gamePages: [[{ id: 'g1', igdbId: 1 }], [{ id: 'g2', igdbId: 2 }]],
    });

    await service.enqueueBanners({ maxBatches: 1 });

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

  it('only reads rows — no delete is ever reachable from the repair', async () => {
    const { service, mediaFindMany } = createHarness({
      mediaRows: [[row('m1', 'games/a/cover/x-standard.webp')]],
    });

    await service.repairMissingObjects();

    expect(mediaFindMany).toHaveBeenCalled();
    expect(mediaFindMany.mock.calls[0]?.[0]?.where).toEqual({ sourceUrl: { not: null } });
  });
});
