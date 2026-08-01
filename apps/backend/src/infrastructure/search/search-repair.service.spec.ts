import { describe, expect, it, vi } from 'vitest';

import { AppLogger } from '../logging/app-logger.service';

import { MeiliClientService } from './meili.client';
import { SearchIndexService } from './search-index.service';
import { SearchRepairService } from './search-repair.service';

/**
 * D3.25.1 — docs/18_CATALOG/D3_25_1_PATCH_PLAN.md objective 3.
 * Closes SPRINT_0_PROJECT_AUDIT.md risk R6/H10 (no reindex/backfill job).
 *
 * Batched by design (`upsertMany`/`deleteDocuments`, not one call per row) —
 * the first version of this service completed one Meili call per row and did
 * not finish against this project's own seed data (500k+ reviews). These
 * tests assert the batched contract directly.
 */

function createLogger(): AppLogger {
  return { event: vi.fn(), log: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as AppLogger;
}

function createMeili(overrides: Partial<MeiliClientService> = {}): MeiliClientService {
  return {
    isAvailable: () => true,
    listDocumentIds: vi.fn(async () => []),
    deleteDocuments: vi.fn(async () => undefined),
    ...overrides,
  } as unknown as MeiliClientService;
}

function createSearchIndex(overrides: Partial<SearchIndexService> = {}): SearchIndexService {
  return {
    upsertMany: vi.fn(async (_type: unknown, ids: readonly string[]) => ids.length),
    ...overrides,
  } as unknown as SearchIndexService;
}

function createPrisma(rows: Partial<Record<string, { id: string }[]>> = {}): unknown {
  const findMany = (rowsForModel: { id: string }[] = []) =>
    vi.fn(async ({ skip = 0, take = 1000 }: { skip?: number; take?: number } = {}) =>
      rowsForModel.slice(skip, skip + take),
    );
  return {
    game: { findMany: findMany(rows.game) },
    user: { findMany: findMany(rows.user) },
    post: { findMany: findMany(rows.post) },
    review: { findMany: findMany(rows.review) },
    collection: { findMany: findMany(rows.collection) },
    tierList: { findMany: findMany(rows.tierList) },
    community: { findMany: findMany(rows.community) },
    event: { findMany: findMany(rows.event) },
  };
}

describe('SearchRepairService.repairType — forward pass', () => {
  it('upserts every active game row in a single batch call', async () => {
    const prisma = createPrisma({ game: [{ id: 'g1' }, { id: 'g2' }, { id: 'g3' }] });
    const searchIndex = createSearchIndex();
    const service = new SearchRepairService(
      prisma as never,
      createMeili(),
      searchIndex,
      createLogger(),
    );

    const result = await service.repairType('game');

    expect(result.postgresActiveCount).toBe(3);
    expect(result.upserted).toBe(3);
    expect(searchIndex.upsertMany).toHaveBeenCalledTimes(1);
    expect(searchIndex.upsertMany).toHaveBeenCalledWith('game', ['g1', 'g2', 'g3']);
  });

  it('splits a large active set into multiple upsert batches, not one call per row', async () => {
    const rows = Array.from({ length: 2500 }, (_, i) => ({ id: `g${String(i)}` }));
    const prisma = createPrisma({ game: rows });
    const searchIndex = createSearchIndex();
    const service = new SearchRepairService(
      prisma as never,
      createMeili(),
      searchIndex,
      createLogger(),
    );

    const result = await service.repairType('game');

    expect(result.postgresActiveCount).toBe(2500);
    expect(result.upserted).toBe(2500);
    // 2500 rows / batch size 1000 = 3 calls, not 2500.
    expect(searchIndex.upsertMany).toHaveBeenCalledTimes(3);
  });

  it('counts a whole failed batch as errors without aborting remaining batches', async () => {
    const rows = Array.from({ length: 1500 }, (_, i) => ({ id: `g${String(i)}` }));
    const prisma = createPrisma({ game: rows });
    const searchIndex = createSearchIndex({
      upsertMany: vi
        .fn()
        .mockRejectedValueOnce(new Error('meili down'))
        .mockImplementationOnce(async (_type: unknown, ids: readonly string[]) => ids.length),
    });
    const service = new SearchRepairService(
      prisma as never,
      createMeili(),
      searchIndex,
      createLogger(),
    );

    const result = await service.repairType('game');

    expect(result.upserted).toBe(500);
    expect(result.upsertErrors).toBe(1000);
    expect(searchIndex.upsertMany).toHaveBeenCalledTimes(2);
  });

  it('is a no-op when Meilisearch is unavailable', async () => {
    const prisma = createPrisma({ game: [{ id: 'g1' }] });
    const searchIndex = createSearchIndex();
    const service = new SearchRepairService(
      prisma as never,
      createMeili({ isAvailable: () => false }),
      searchIndex,
      createLogger(),
    );

    const result = await service.repairType('game');

    expect(result).toEqual({
      type: 'game',
      postgresActiveCount: 0,
      upserted: 0,
      upsertErrors: 0,
      orphansRemoved: 0,
      orphanErrors: 0,
    });
    expect(searchIndex.upsertMany).not.toHaveBeenCalled();
  });

  it('excludes soft-deleted rows for types that support deletion', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = { user: { findMany } };

    const service = new SearchRepairService(
      prisma as never,
      createMeili(),
      createSearchIndex(),
      createLogger(),
    );

    await service.repairType('user');

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { deletedAt: null } }));
  });

  it('never filters by deletedAt for games — they are never soft-deleted', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = { game: { findMany } };

    const service = new SearchRepairService(
      prisma as never,
      createMeili(),
      createSearchIndex(),
      createLogger(),
    );

    await service.repairType('game');

    expect(findMany).toHaveBeenCalledWith(
      expect.not.objectContaining({ where: expect.anything() }),
    );
  });
});

describe('SearchRepairService.repairType — reverse pass (orphan cleanup)', () => {
  it('removes indexed documents with no matching active Postgres row, in one batch call', async () => {
    const prisma = createPrisma({ game: [{ id: 'g1' }] });
    const meili = createMeili({
      listDocumentIds: vi.fn(async () => ['g1', 'g2', 'g3']),
    });
    const service = new SearchRepairService(
      prisma as never,
      meili,
      createSearchIndex(),
      createLogger(),
    );

    const result = await service.repairType('game');

    expect(result.orphansRemoved).toBe(2);
    expect(meili.deleteDocuments).toHaveBeenCalledTimes(1);
    expect(meili.deleteDocuments).toHaveBeenCalledWith('games', ['g2', 'g3']);
  });

  it('removes nothing when every indexed id is still active', async () => {
    const prisma = createPrisma({ game: [{ id: 'g1' }, { id: 'g2' }] });
    const meili = createMeili({ listDocumentIds: vi.fn(async () => ['g1', 'g2']) });
    const service = new SearchRepairService(
      prisma as never,
      meili,
      createSearchIndex(),
      createLogger(),
    );

    const result = await service.repairType('game');

    expect(result.orphansRemoved).toBe(0);
    expect(meili.deleteDocuments).not.toHaveBeenCalled();
  });

  it('splits large orphan sets into multiple delete batches', async () => {
    const prisma = createPrisma({ game: [] });
    const orphans = Array.from({ length: 1500 }, (_, i) => `orphan-${String(i)}`);
    const meili = createMeili({ listDocumentIds: vi.fn(async () => orphans) });
    const service = new SearchRepairService(
      prisma as never,
      meili,
      createSearchIndex(),
      createLogger(),
    );

    const result = await service.repairType('game');

    expect(result.orphansRemoved).toBe(1500);
    expect(meili.deleteDocuments).toHaveBeenCalledTimes(2);
  });

  it('counts a failed delete batch as orphan errors, separate from upsert errors', async () => {
    const prisma = createPrisma({ game: [{ id: 'g1' }] });
    const meili = createMeili({
      listDocumentIds: vi.fn(async () => ['g1', 'orphan']),
      deleteDocuments: vi.fn().mockRejectedValue(new Error('meili down')),
    });
    const service = new SearchRepairService(
      prisma as never,
      meili,
      createSearchIndex(),
      createLogger(),
    );

    const result = await service.repairType('game');

    expect(result.orphanErrors).toBe(1);
    expect(result.upsertErrors).toBe(0);
  });
});

describe('SearchRepairService.repairAll', () => {
  it('repairs all eight search hit types', async () => {
    const prisma = createPrisma();
    const service = new SearchRepairService(
      prisma as never,
      createMeili(),
      createSearchIndex(),
      createLogger(),
    );

    const results = await service.repairAll();

    expect(results.map((r) => r.type)).toEqual([
      'game',
      'user',
      'post',
      'review',
      'collection',
      'tier-list',
      'community',
      'event',
    ]);
  });

  it('fixes exactly the Hollow Knight / Celeste drift shape: active rows never indexed', async () => {
    // Reproduces the D3.25 review finding: two active games existed in
    // Postgres but had no Meilisearch document at all.
    const prisma = createPrisma({
      game: [{ id: 'hollow-knight' }, { id: 'celeste' }, { id: 'hades' }],
    });
    const meili = createMeili({ listDocumentIds: vi.fn(async () => ['hades']) });
    const searchIndex = createSearchIndex();
    const service = new SearchRepairService(prisma as never, meili, searchIndex, createLogger());

    const result = await service.repairType('game');

    expect(searchIndex.upsertMany).toHaveBeenCalledWith('game', [
      'hollow-knight',
      'celeste',
      'hades',
    ]);
    expect(result.orphansRemoved).toBe(0);
  });
});
