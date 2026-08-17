import type { GameMetadataRepository } from '@gmrlog/database';
import { describe, expect, it, vi } from 'vitest';

import { AppLogger } from '../../infrastructure/logging/app-logger.service';

import { GameCatalogSyncService, IGDB_CATALOG_CURSOR_NAME } from './game-catalog-sync.service';
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
      media: [],
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

  const repository = {
    applyMetadata: vi.fn().mockResolvedValue(undefined),
  } as unknown as GameMetadataRepository;

  const gameCreate = vi.fn().mockResolvedValue({ id: 'game-new-1' });
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
  const publisher = { enqueueEnrich } as unknown as GameMetadataPublisher;

  const service = new GameCatalogSyncService(
    igdb,
    repository,
    prisma,
    publisher,
    createLogger(),
    DEFAULT_METADATA_CONFIG,
  );

  return {
    service,
    listCatalogPage,
    repository,
    gameCreate,
    gameFindUnique,
    syncCursorUpsert,
    enqueueEnrich,
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
});
