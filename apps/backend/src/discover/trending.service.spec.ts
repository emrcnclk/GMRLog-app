import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TrendingService } from './trending.service';

const sampleGame = {
  id: 'g1',
  title: 'Game',
  slug: 'game',
  coverKey: null,
  releaseDate: null,
  featured: false,
  popularity: 5,
  franchiseId: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('TrendingService', () => {
  const prisma = {
    libraryEntry: { groupBy: vi.fn() },
    review: { groupBy: vi.fn(), findMany: vi.fn() },
    collectionFollower: { groupBy: vi.fn() },
    follow: { groupBy: vi.fn() },
    communityMember: { groupBy: vi.fn() },
    game: { findMany: vi.fn() },
    gameGenre: { findMany: vi.fn() },
    gamePlatform: { findMany: vi.fn() },
  };

  let service: TrendingService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.gameGenre.findMany.mockResolvedValue([]);
    prisma.gamePlatform.findMany.mockResolvedValue([]);
    prisma.libraryEntry.groupBy.mockResolvedValue([]);
    prisma.review.groupBy.mockResolvedValue([]);
    prisma.review.findMany.mockResolvedValue([]);
    prisma.collectionFollower.groupBy.mockResolvedValue([]);
    prisma.follow.groupBy.mockResolvedValue([]);
    prisma.communityMember.groupBy.mockResolvedValue([]);
    service = new TrendingService(prisma as never);
  });

  it('ranks trending games for 7d window from activity counts', async () => {
    prisma.libraryEntry.groupBy
      .mockResolvedValueOnce([
        { gameId: 'g1', _count: { gameId: 2 } },
        { gameId: 'g2', _count: { gameId: 2 } },
      ])
      .mockResolvedValueOnce([{ gameId: 'g1', _count: { gameId: 1 } }])
      .mockResolvedValueOnce([
        { gameId: 'g1', _count: { gameId: 3 } },
        { gameId: 'g2', _count: { gameId: 2 } },
      ]);
    prisma.review.groupBy
      .mockResolvedValueOnce([{ gameId: 'g1', _count: { gameId: 1 } }])
      .mockResolvedValueOnce([
        { gameId: 'g1', _avg: { rating: 8 }, _count: { rating: 1 } },
        { gameId: 'g2', _avg: { rating: 7 }, _count: { rating: 1 } },
      ]);
    prisma.game.findMany.mockResolvedValue([
      sampleGame,
      { ...sampleGame, id: 'g2', title: 'G2', slug: 'g2' },
    ]);

    const page = await service.listTrending({ window: '7d', entity: 'games', limit: 10 });

    expect(page.items[0]).toMatchObject({ id: 'g1' });
    expect(prisma.libraryEntry.groupBy).toHaveBeenCalledTimes(3);
  });

  it('defaults window to 7d and entity to games', async () => {
    prisma.game.findMany.mockResolvedValue([sampleGame]);
    const page = await service.listTrending({ limit: 3 });
    expect(page.items[0]?.id).toBe('g1');
  });

  it('falls back to popular games when window has no activity', async () => {
    prisma.game.findMany.mockResolvedValue([sampleGame]);
    prisma.libraryEntry.groupBy.mockResolvedValue([]);
    prisma.review.groupBy.mockResolvedValue([]);

    const page = await service.listTrending({ window: '7d', entity: 'games', limit: 5 });

    expect(page.items[0]?.id).toBe('g1');
  });

  it('lists trending reviews for 7d', async () => {
    prisma.review.findMany.mockResolvedValue([{ id: 'r1' }, { id: 'r2' }]);

    const page = await service.listTrending({ window: '7d', entity: 'reviews', limit: 5 });

    expect(page.items).toEqual([
      { id: 'r1', score: 5 },
      { id: 'r2', score: 4 },
    ]);
  });

  it('lists trending collections for 7d', async () => {
    prisma.collectionFollower.groupBy.mockResolvedValue([
      { collectionId: 'c2', _count: { collectionId: 1 } },
      { collectionId: 'c1', _count: { collectionId: 3 } },
    ]);

    const page = await service.listTrending({ window: '7d', entity: 'collections', limit: 5 });

    expect(page.items).toEqual([
      { id: 'c1', score: 3 },
      { id: 'c2', score: 1 },
    ]);
  });

  it('lists trending users for 7d', async () => {
    prisma.follow.groupBy.mockResolvedValue([
      { followeeId: 'u1', _count: { followeeId: 2 } },
      { followeeId: 'u2', _count: { followeeId: 5 } },
    ]);

    const page = await service.listTrending({ window: '7d', entity: 'users', limit: 5 });

    expect(page.items).toEqual([
      { id: 'u2', score: 5 },
      { id: 'u1', score: 2 },
    ]);
  });

  it('lists trending communities for 7d', async () => {
    prisma.communityMember.groupBy.mockResolvedValue([
      { communityId: 'com1', _count: { communityId: 4 } },
    ]);

    const page = await service.listTrending({ window: '7d', entity: 'communities', limit: 5 });

    expect(page.items).toEqual([{ id: 'com1', score: 4 }]);
  });
});
