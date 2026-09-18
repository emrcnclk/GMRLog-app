import type { GameMetadataRepository } from '@gmrlog/database';
import { describe, expect, it, vi } from 'vitest';

import { AppLogger } from '../../infrastructure/logging/app-logger.service';
import { SearchIndexService } from '../../infrastructure/search/search-index.service';

import {
  GameCatalogSyncService,
  releaseFloorUnix,
  IGDB_CATALOG_CURSOR_NAME,
} from './game-catalog-sync.service';
import { GameMetadataPublisher } from './game-metadata.publisher';
import { DEFAULT_METADATA_CONFIG } from './metadata.config';
import type { IgdbCatalogRow } from './providers/igdb.provider';
import { IgdbMetadataProvider } from './providers/igdb.provider';

function metadataRow(overrides: Partial<IgdbCatalogRow['metadata']> = {}): IgdbCatalogRow {
  return {
    updatedAtUnix: 1_700_000_100,
    metadata: {
      provider: 'igdb',
      confidence: 1,
      attribution: 'Game data provided by IGDB (igdb.com)',
      externalIds: { igdbId: 1905, steamAppId: null, rawgId: null },
      title: 'Hades',
      summary: 'A rogue-like.',
      description: 'Defy the god of the dead.',
      releaseDate: new Date('2020-09-17'),
      externalRating: 91.5,
      externalRatingCount: 1200,
      genres: [],
      tags: [],
      platforms: [],
      companies: [],
      franchise: null,
      series: null,
      similarGames: [],
      media: [
        {
          kind: 'cover',
          url: 'https://images.igdb.com/cover.jpg',
          width: 264,
          height: 352,
          sortOrder: 0,
        },
        {
          kind: 'screenshot',
          url: 'https://images.igdb.com/shot.jpg',
          width: 1920,
          height: 1080,
          sortOrder: 0,
        },
      ],
      trailerUrl: null,
      ...overrides,
    },
  };
}

function createLogger(): AppLogger {
  return { event: vi.fn(), log: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as AppLogger;
}

function createHarness(rows: IgdbCatalogRow[][]) {
  const listCatalogPage = vi.fn();
  for (const page of rows) {
    listCatalogPage.mockResolvedValueOnce(page);
  }
  // Every call beyond the scripted pages returns an empty page — stops the loop.
  listCatalogPage.mockResolvedValue([]);
  const igdb = { listCatalogPage } as unknown as IgdbMetadataProvider;

  const callOrder: string[] = [];
  const linkMediaRefs = vi.fn(async (refs: readonly { kind: string }[]) => {
    callOrder.push('link');
    return { inserted: refs.length, coversSet: 0, heroesSet: 0 };
  });
  const repository = {
    applyMetadata: vi.fn().mockResolvedValue(undefined),
    recordRun: vi.fn().mockResolvedValue(undefined),
    linkMediaRefs,
  } as unknown as GameMetadataRepository;

  let nextGameId = 1;
  const gameCreate = vi.fn(async () => ({ id: `game-new-${String(nextGameId++)}` }));
  const gameFindUnique = vi.fn().mockResolvedValue(null);
  const cursorState: { row: { name: string; value: string } | null } = { row: null };
  const syncCursorFindUnique = vi.fn(async () => cursorState.row);
  const syncCursorUpsert = vi.fn(
    async ({ create }: { create: { name: string; value: string } }) => {
      cursorState.row = create;
      return create;
    },
  );

  const prisma = {
    game: { create: gameCreate, findUnique: gameFindUnique },
    syncCursor: { findUnique: syncCursorFindUnique, upsert: syncCursorUpsert },
  } as unknown as import('../../infrastructure/database/prisma.service').PrismaService;

  const enqueueEnrich = vi.fn().mockResolvedValue('job-1');
  const enqueueMediaBatch = vi.fn(async (items: readonly unknown[]) => items.length);
  const publisher = { enqueueEnrich, enqueueMediaBatch } as unknown as GameMetadataPublisher;

  const upsertMany = vi.fn(async (_type: string, ids: readonly string[]) => {
    callOrder.push('reindex');
    return ids.length;
  });
  const searchIndex = { upsertMany } as unknown as SearchIndexService;

  const service = new GameCatalogSyncService(
    igdb,
    repository,
    prisma,
    publisher,
    createLogger(),
    DEFAULT_METADATA_CONFIG,
    searchIndex,
  );

  return {
    service,
    listCatalogPage,
    repository,
    gameCreate,
    gameFindUnique,
    syncCursorUpsert,
    enqueueEnrich,
    enqueueMediaBatch,
    upsertMany,
    linkMediaRefs,
    callOrder,
  };
}

describe('GameCatalogSyncService.syncPages', () => {
  it('creates a skeleton and applies metadata for a new igdbId, via the shared applyMetadata path', async () => {
    const { service, gameCreate, repository } = createHarness([[metadataRow()]]);

    const stats = await service.syncPages(1);

    expect(gameCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ title: 'Hades', igdbId: 1905 }) }),
    );
    expect(repository.applyMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ gameId: 'game-new-1', provider: 'igdb' }),
    );
    expect(stats.created).toBe(1);
    expect(stats.enqueuedForEnrich).toBe(0);
  });

  // D11.3 — the wiring, not the arithmetic. `releaseFloorUnix` is tested
  // below on its own; what this pins is that the walk actually carries the
  // configured floor to IGDB, which is the half that can silently stop
  // happening without any test noticing.
  it('asks IGDB only for releases at or after the configured floor', async () => {
    const { service, listCatalogPage } = createHarness([[metadataRow()]]);

    await service.syncPages(1);

    expect(listCatalogPage).toHaveBeenCalledWith(
      expect.objectContaining({ releasedFromUnix: releaseFloorUnix(1990) }),
    );
  });
  it('never writes an existing igdbId directly — routes it through the existing enqueueEnrich job', async () => {
    const { service, gameFindUnique, enqueueEnrich, repository } = createHarness([[metadataRow()]]);
    gameFindUnique.mockResolvedValue({ id: 'game-existing-1' });

    const stats = await service.syncPages(1);

    expect(enqueueEnrich).toHaveBeenCalledWith({
      gameId: 'game-existing-1',
      reason: 'refresh',
      igdbId: 1905,
    });
    expect(repository.applyMetadata).not.toHaveBeenCalled();
    expect(stats.enqueuedForEnrich).toBe(1);
    expect(stats.created).toBe(0);
  });

  it('persists the max updated_at seen as the new cursor, keyed under IGDB_CATALOG_CURSOR_NAME', async () => {
    const { service, syncCursorUpsert } = createHarness([[metadataRow({})]]);

    await service.syncPages(1);

    expect(syncCursorUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: IGDB_CATALOG_CURSOR_NAME },
        create: { name: IGDB_CATALOG_CURSOR_NAME, value: '1700000100' },
      }),
    );
  });

  it('stops paging once a page is shorter than pageSize, without requesting a page beyond maxPages', async () => {
    const { service, listCatalogPage } = createHarness([[metadataRow()], [metadataRow()]]);

    await service.syncPages(5, 10);

    // First page has 1 row < pageSize(10) — loop stops after page 0.
    expect(listCatalogPage).toHaveBeenCalledTimes(1);
  });

  it('does not advance the cursor when nothing newer than the existing cursor was seen', async () => {
    const { service, syncCursorUpsert } = createHarness([[]]);

    const stats = await service.syncPages(1);

    expect(syncCursorUpsert).not.toHaveBeenCalled();
    expect(stats.cursorAfter).toBe(stats.cursorBefore);
  });

  // D11.2 — bulk-path parity: a created row must get the same three
  // follow-ups the enrich path gives a per-game create (search reindex,
  // media enqueue, run-logging), not silently skip them.
  describe('D11.2 bulk-path parity', () => {
    it('batches created ids into one searchIndex.upsertMany call per page, not one per row', async () => {
      const { service, upsertMany } = createHarness([
        [
          metadataRow(),
          metadataRow({ externalIds: { igdbId: 1906, steamAppId: null, rawgId: null } }),
        ],
      ]);

      const stats = await service.syncPages(1, 10);

      expect(upsertMany).toHaveBeenCalledTimes(1);
      expect(upsertMany).toHaveBeenCalledWith('game', ['game-new-1', 'game-new-2']);
      expect(stats.reindexed).toBe(2);
    });

    it('does not call searchIndex.upsertMany when a page creates nothing', async () => {
      const { service, upsertMany, gameFindUnique } = createHarness([[metadataRow()]]);
      gameFindUnique.mockResolvedValue({ id: 'game-existing-1' });

      await service.syncPages(1);

      expect(upsertMany).not.toHaveBeenCalled();
    });

    // Since 2026-09 images are provider URL references. A created game's
    // cover and screenshots are linked, and nothing reaches the download queue.
    it('links every image of a created row as a reference and downloads nothing', async () => {
      const { service, enqueueMediaBatch, linkMediaRefs } = createHarness([[metadataRow()]]);

      const stats = await service.syncPages(1);

      expect(enqueueMediaBatch).not.toHaveBeenCalled();
      expect(linkMediaRefs).toHaveBeenCalledTimes(1);
      const refs = linkMediaRefs.mock.calls[0]?.[0] as {
        kind: string;
        gameId: string;
        url: string;
      }[];
      expect(refs.map((ref) => ref.kind)).toEqual(['cover', 'screenshot']);
      expect(refs[0]?.gameId).toBe('game-new-1');
      expect(refs[0]?.url).toBe('https://images.igdb.com/cover.jpg');
      expect(stats.mediaQueued).toBe(2);
    });

    // The search document reads the cover pointer at reindex time; linking
    // after the reindex would index every new game without its cover.
    it('links media before it reindexes the page', async () => {
      const { service, callOrder } = createHarness([[metadataRow()]]);

      await service.syncPages(1);

      expect(callOrder).toEqual(['link', 'reindex']);
    });

    it('links nothing for an existing igdbId routed through enqueueEnrich', async () => {
      const { service, enqueueMediaBatch, linkMediaRefs, gameFindUnique } = createHarness([
        [metadataRow()],
      ]);
      gameFindUnique.mockResolvedValue({ id: 'game-existing-1' });

      await service.syncPages(1);

      expect(enqueueMediaBatch).not.toHaveBeenCalled();
      const refs = linkMediaRefs.mock.calls[0]?.[0] as unknown[] | undefined;
      expect(refs ?? []).toHaveLength(0);
    });

    it('records one GameMetadataRun row per created game, reason bulk-sync, outcome from resolveMetadataStatus', async () => {
      const { service, repository } = createHarness([[metadataRow()]]);

      const stats = await service.syncPages(1);

      expect(repository.recordRun).toHaveBeenCalledTimes(1);
      expect(repository.recordRun).toHaveBeenCalledWith(
        expect.objectContaining({
          gameId: 'game-new-1',
          provider: 'igdb',
          reason: 'bulk-sync',
          // metadataRow()'s default fixture has no genres, so hasCoreFields
          // is false and resolveMetadataStatus lands on 'partial' — matches
          // the same gate the enrich path applies (metadata-merge.ts).
          outcome: 'partial',
          // the fixture's cover and screenshot, both linked as references
          mediaQueued: 2,
        }),
      );
      expect(stats.runsRecorded).toBe(1);
    });

    it('does not record a run for an existing igdbId routed through enqueueEnrich', async () => {
      const { service, repository, gameFindUnique } = createHarness([[metadataRow()]]);
      gameFindUnique.mockResolvedValue({ id: 'game-existing-1' });

      const stats = await service.syncPages(1);

      expect(repository.recordRun).not.toHaveBeenCalled();
      expect(stats.runsRecorded).toBe(0);
    });
  });
});

describe('releaseFloorUnix (D11.3)', () => {
  it('is midnight UTC on 1 January of the year', () => {
    expect(releaseFloorUnix(1990)).toBe(Math.floor(Date.UTC(1990, 0, 1) / 1000));
    expect(releaseFloorUnix(1990)).toBe(631_152_000);
  });

  // Not a local-time constructor: a machine in UTC+3 would otherwise walk
  // three hours less of 1989 than a machine in UTC, which nobody would notice
  // and nobody could reproduce.
  it('does not move with the machine timezone', () => {
    expect(releaseFloorUnix(2000)).toBe(946_684_800);
  });

  it('treats zero and below as no floor at all', () => {
    expect(releaseFloorUnix(0)).toBe(0);
    expect(releaseFloorUnix(-1)).toBe(0);
  });
});
