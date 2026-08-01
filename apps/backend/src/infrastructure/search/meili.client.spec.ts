import { beforeEach, describe, expect, it, vi } from 'vitest';

import { parseBackendEnv } from '../config/env.schema';
import { AppLogger } from '../logging/app-logger.service';

import { MeiliClientService } from './meili.client';

describe('MeiliClientService', () => {
  it('is unavailable when MEILI_HOST is unset', () => {
    const service = new MeiliClientService(
      parseBackendEnv({ MEILI_HOST: '' }),
      new AppLogger(parseBackendEnv({})),
    );
    expect(service.isAvailable()).toBe(false);
    expect(service.client).toBeNull();
  });

  it('returns false from health when client is unavailable', async () => {
    const service = new MeiliClientService(
      parseBackendEnv({ MEILI_HOST: '' }),
      new AppLogger(parseBackendEnv({})),
    );
    expect(await service.health()).toBe(false);
  });

  it('no-ops document writes when client is unavailable', async () => {
    const service = new MeiliClientService(
      parseBackendEnv({ MEILI_HOST: '' }),
      new AppLogger(parseBackendEnv({})),
    );
    await expect(
      service.upsertDocuments('games', [
        { id: 'game-1', type: 'game', orderedAt: new Date().toISOString() },
      ]),
    ).resolves.toBeUndefined();
    await expect(service.deleteDocument('games', 'game-1')).resolves.toBeUndefined();
    expect(await service.multiSearch('hollow', 5)).toEqual([]);
  });
});

describe('MeiliClientService with mocked client', () => {
  let service: MeiliClientService;
  let index: {
    addDocuments: ReturnType<typeof vi.fn>;
    deleteDocument: ReturnType<typeof vi.fn>;
    updateSettings: ReturnType<typeof vi.fn>;
  };
  let client: {
    health: ReturnType<typeof vi.fn>;
    index: ReturnType<typeof vi.fn>;
    multiSearch: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    index = {
      addDocuments: vi.fn().mockResolvedValue(undefined),
      deleteDocument: vi.fn().mockResolvedValue(undefined),
      updateSettings: vi.fn().mockResolvedValue(undefined),
    };
    client = {
      health: vi.fn().mockResolvedValue({ status: 'available' }),
      index: vi.fn().mockReturnValue(index),
      multiSearch: vi.fn().mockResolvedValue({
        results: [
          {
            hits: [
              {
                id: 'game-1',
                type: 'game',
                orderedAt: '2026-01-01T00:00:00.000Z',
                title: 'Hollow',
              },
            ],
          },
        ],
      }),
    };
    service = new MeiliClientService(
      parseBackendEnv({ MEILI_HOST: 'http://127.0.0.1:7700', MEILI_INDEX_PREFIX: 'gmrlog' }),
      new AppLogger(parseBackendEnv({})),
    );
    Object.assign(service, { client });
  });

  it('reports health, index names, and search hits', async () => {
    expect(service.isAvailable()).toBe(true);
    expect(service.indexName('games')).toBe('gmrlog_games');
    expect(service.indexNameForType('game')).toBe('gmrlog_games');
    expect(await service.health()).toBe(true);

    await service.upsertDocuments('games', [
      { id: 'game-1', type: 'game', orderedAt: '2026-01-01T00:00:00.000Z', title: 'Hollow' },
    ]);
    expect(index.addDocuments).toHaveBeenCalledOnce();

    await service.deleteDocument('games', 'game-1');
    expect(index.deleteDocument).toHaveBeenCalledWith('game-1');

    const hits = await service.multiSearch('hollow', 1);
    expect(hits[0]?.document.id).toBe('game-1');
    expect(hits[0]?.indexKey).toBe('games');
  });

  it('ensures indexes on module init and swallows setup failures', async () => {
    await service.onModuleInit();
    expect(index.updateSettings).toHaveBeenCalled();

    client.index.mockImplementation(() => {
      throw new Error('setup failed');
    });
    await expect(service.onModuleInit()).resolves.toBeUndefined();
  });

  it('returns false when health probe fails', async () => {
    client.health.mockRejectedValue(new Error('down'));
    expect(await service.health()).toBe(false);
  });
});

// D3.25.1 — docs/18_CATALOG/D3_25_1_PATCH_PLAN.md objective 3
describe('MeiliClientService.listDocumentIds', () => {
  it('returns an empty list when the client is unavailable', async () => {
    const service = new MeiliClientService(
      parseBackendEnv({ MEILI_HOST: '' }),
      new AppLogger(parseBackendEnv({})),
    );
    await expect(service.listDocumentIds('games')).resolves.toEqual([]);
  });

  it('collects ids across a single page', async () => {
    const getDocuments = vi.fn().mockResolvedValue({
      results: [{ id: 'a' }, { id: 'b' }],
      limit: 1000,
      offset: 0,
      total: 2,
    });
    const service = new MeiliClientService(
      parseBackendEnv({ MEILI_HOST: 'http://127.0.0.1:7700' }),
      new AppLogger(parseBackendEnv({})),
    );
    Object.assign(service, {
      client: { index: vi.fn().mockReturnValue({ getDocuments }) },
    });

    await expect(service.listDocumentIds('games')).resolves.toEqual(['a', 'b']);
    expect(getDocuments).toHaveBeenCalledWith({ fields: ['id'], limit: 1000, offset: 0 });
  });

  it('paginates across multiple pages until a short page is returned', async () => {
    const page = (ids: string[]) => ({
      results: ids.map((id) => ({ id })),
      limit: 1000,
      offset: 0,
      total: ids.length,
    });
    const fullPage = Array.from({ length: 1000 }, (_, i) => `id-${String(i)}`);
    const getDocuments = vi
      .fn()
      .mockResolvedValueOnce(page(fullPage))
      .mockResolvedValueOnce(page(['id-1000', 'id-1001']));
    const service = new MeiliClientService(
      parseBackendEnv({ MEILI_HOST: 'http://127.0.0.1:7700' }),
      new AppLogger(parseBackendEnv({})),
    );
    Object.assign(service, {
      client: { index: vi.fn().mockReturnValue({ getDocuments }) },
    });

    const ids = await service.listDocumentIds('games');

    expect(ids).toHaveLength(1002);
    expect(getDocuments).toHaveBeenCalledTimes(2);
    expect(getDocuments).toHaveBeenNthCalledWith(2, { fields: ['id'], limit: 1000, offset: 1000 });
  });
});

// D3.25.1 — batch delete for SearchRepairService's reverse pass
describe('MeiliClientService.deleteDocuments', () => {
  it('no-ops when the client is unavailable or the id list is empty', async () => {
    const unavailable = new MeiliClientService(
      parseBackendEnv({ MEILI_HOST: '' }),
      new AppLogger(parseBackendEnv({})),
    );
    await expect(unavailable.deleteDocuments('games', ['a'])).resolves.toBeUndefined();

    const available = new MeiliClientService(
      parseBackendEnv({ MEILI_HOST: 'http://127.0.0.1:7700' }),
      new AppLogger(parseBackendEnv({})),
    );
    const deleteDocuments = vi.fn().mockResolvedValue(undefined);
    Object.assign(available, { client: { index: vi.fn().mockReturnValue({ deleteDocuments }) } });
    await available.deleteDocuments('games', []);
    expect(deleteDocuments).not.toHaveBeenCalled();
  });

  it('issues one batch delete call with every id', async () => {
    const deleteDocuments = vi.fn().mockResolvedValue(undefined);
    const service = new MeiliClientService(
      parseBackendEnv({ MEILI_HOST: 'http://127.0.0.1:7700' }),
      new AppLogger(parseBackendEnv({})),
    );
    Object.assign(service, { client: { index: vi.fn().mockReturnValue({ deleteDocuments }) } });

    await service.deleteDocuments('games', ['g1', 'g2', 'g3']);

    expect(deleteDocuments).toHaveBeenCalledWith(['g1', 'g2', 'g3']);
  });
});
