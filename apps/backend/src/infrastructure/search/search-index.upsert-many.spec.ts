import { describe, expect, it, vi } from 'vitest';

import { MeiliClientService } from './meili.client';
import { SearchIndexService } from './search-index.service';

/**
 * D3.25.1 — batch document building/upserting for `SearchRepairService`.
 * Not routed through the per-type repository classes (unlike `buildDocument`)
 * — these query `this.prisma.<model>.findMany` directly, one call per batch.
 */

const NOW = new Date('2026-01-01T00:00:00.000Z');

function createMeili(overrides: Partial<MeiliClientService> = {}): MeiliClientService {
  return {
    isAvailable: () => true,
    upsertDocuments: vi.fn(async () => undefined),
    ...overrides,
  } as unknown as MeiliClientService;
}

describe('SearchIndexService.upsertMany — games', () => {
  it('builds one document per id in a single findMany call', async () => {
    const prisma = {
      game: {
        findMany: vi.fn(async () => [
          {
            id: 'g1',
            title: 'Hades',
            slug: 'hades',
            createdAt: NOW,
            summary: 'A rogue-like.',
            description: null,
            coverKey: 'k1',
          },
          {
            id: 'g2',
            title: 'Celeste',
            slug: 'celeste',
            createdAt: NOW,
            summary: null,
            description: 'A platformer.',
            coverKey: null,
          },
        ]),
      },
      gameGenre: {
        findMany: vi.fn(async () => [
          { gameId: 'g1', genre: { name: 'Roguelike' } },
          { gameId: 'g1', genre: { name: 'Indie' } },
        ]),
      },
    };
    const meili = createMeili();
    const service = new SearchIndexService(prisma as never, meili);

    const count = await service.upsertMany('game', ['g1', 'g2']);

    expect(count).toBe(2);
    expect(prisma.game.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.gameGenre.findMany).toHaveBeenCalledTimes(1);
    expect(meili.upsertDocuments).toHaveBeenCalledTimes(1);
    const [, documents] = vi.mocked(meili.upsertDocuments).mock.calls[0] ?? [];
    expect(documents).toEqual([
      expect.objectContaining({
        id: 'g1',
        description: 'A rogue-like.',
        genres: ['Roguelike', 'Indie'],
      }),
      expect.objectContaining({ id: 'g2', description: 'A platformer.', genres: [] }),
    ]);
  });

  it('falls back to description when summary is absent', async () => {
    const prisma = {
      game: {
        findMany: vi.fn(async () => [
          {
            id: 'g1',
            title: 'Hades',
            slug: 'hades',
            createdAt: NOW,
            summary: null,
            description: 'Long form.',
            coverKey: null,
          },
        ]),
      },
      gameGenre: { findMany: vi.fn(async () => []) },
    };
    const meili = createMeili();
    const service = new SearchIndexService(prisma as never, meili);

    await service.upsertMany('game', ['g1']);

    const [, documents] = vi.mocked(meili.upsertDocuments).mock.calls[0] ?? [];
    expect(documents?.[0]).toMatchObject({ description: 'Long form.' });
  });

  it('returns 0 and skips the Meili call when no rows matched', async () => {
    const prisma = {
      game: { findMany: vi.fn(async () => []) },
      gameGenre: { findMany: vi.fn(async () => []) },
    };
    const meili = createMeili();
    const service = new SearchIndexService(prisma as never, meili);

    const count = await service.upsertMany('game', ['missing']);

    expect(count).toBe(0);
    expect(meili.upsertDocuments).not.toHaveBeenCalled();
  });

  it('is a no-op when Meilisearch is unavailable', async () => {
    const prisma = { game: { findMany: vi.fn() }, gameGenre: { findMany: vi.fn() } };
    const meili = createMeili({ isAvailable: () => false });
    const service = new SearchIndexService(prisma as never, meili);

    const count = await service.upsertMany('game', ['g1']);

    expect(count).toBe(0);
    expect(prisma.game.findMany).not.toHaveBeenCalled();
  });

  it('returns 0 for an empty id list without querying anything', async () => {
    const prisma = { game: { findMany: vi.fn() }, gameGenre: { findMany: vi.fn() } };
    const service = new SearchIndexService(prisma as never, createMeili());

    const count = await service.upsertMany('game', []);

    expect(count).toBe(0);
    expect(prisma.game.findMany).not.toHaveBeenCalled();
  });
});

describe('SearchIndexService.upsertMany — review joins game titles in one batch query', () => {
  it('resolves gameTitle for every review via a single deduplicated game lookup', async () => {
    const prisma = {
      review: {
        findMany: vi.fn(async () => [
          {
            id: 'r1',
            gameId: 'g1',
            authorId: 'u1',
            body: 'Great',
            visibility: 'public',
            createdAt: NOW,
          },
          {
            id: 'r2',
            gameId: 'g1',
            authorId: 'u2',
            body: 'Also great',
            visibility: 'public',
            createdAt: NOW,
          },
          {
            id: 'r3',
            gameId: 'g2',
            authorId: 'u3',
            body: 'Fine',
            visibility: 'public',
            createdAt: NOW,
          },
        ]),
      },
      game: {
        findMany: vi.fn(async () => [
          { id: 'g1', title: 'Hades' },
          { id: 'g2', title: 'Celeste' },
        ]),
      },
    };
    const meili = createMeili();
    const service = new SearchIndexService(prisma as never, meili);

    await service.upsertMany('review', ['r1', 'r2', 'r3']);

    expect(prisma.game.findMany).toHaveBeenCalledTimes(1);
    const [, documents] = vi.mocked(meili.upsertDocuments).mock.calls[0] ?? [];
    expect(documents).toEqual([
      expect.objectContaining({ id: 'r1', gameTitle: 'Hades' }),
      expect.objectContaining({ id: 'r2', gameTitle: 'Hades' }),
      expect.objectContaining({ id: 'r3', gameTitle: 'Celeste' }),
    ]);
  });
});

describe('SearchIndexService.upsertMany — soft-deleted rows excluded per type', () => {
  it.each([
    ['user', 'user'],
    ['post', 'post'],
    ['collection', 'collection'],
    ['tier-list', 'tierList'],
    ['community', 'community'],
    ['event', 'event'],
  ] as const)('filters %s by deletedAt: null', async (type, modelKey) => {
    const findMany = vi.fn(async () => []);
    const prisma = { [modelKey]: { findMany } };
    const service = new SearchIndexService(prisma as never, createMeili());

    await service.upsertMany(type, ['x']);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) }),
    );
  });
});
