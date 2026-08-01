import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DiscoveryScoreService } from './discovery-score.service';

const sampleGame = {
  id: 'g1',
  title: 'Game',
  slug: 'game',
  coverKey: null,
  releaseDate: new Date('2026-06-01T00:00:00.000Z'),
  featured: false,
  popularity: 10,
  franchiseId: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('DiscoveryScoreService', () => {
  const prisma = {
    game: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    review: {
      aggregate: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    libraryEntry: {
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    discoveryScore: {
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    gameGenre: {
      findMany: vi.fn(),
    },
    gamePlatform: {
      findMany: vi.fn(),
    },
  };

  let service: DiscoveryScoreService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.gameGenre.findMany.mockResolvedValue([]);
    prisma.gamePlatform.findMany.mockResolvedValue([]);
    prisma.libraryEntry.groupBy.mockResolvedValue([]);
    prisma.review.groupBy.mockResolvedValue([]);
    prisma.review.aggregate.mockResolvedValue({
      _avg: { rating: 8 },
      _count: { rating: 4 },
    });
    prisma.review.count.mockResolvedValue(1);
    prisma.libraryEntry.count.mockResolvedValue(3);
    service = new DiscoveryScoreService(prisma as never);
  });

  it('recomputeForGame throws when game is missing', async () => {
    prisma.game.findUnique.mockResolvedValue(null);
    await expect(service.recomputeForGame('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.discoveryScore.upsert).not.toHaveBeenCalled();
  });

  it('recomputeForGame upserts blended scores and returns projection', async () => {
    prisma.game.findUnique.mockResolvedValue(sampleGame);
    prisma.discoveryScore.upsert.mockResolvedValue({
      gameId: 'g1',
      trendingScore: 10,
      popularityScore: 20,
      reviewScore: 30,
      wishlistScore: 5,
      completionScore: 5,
      freshnessScore: 80,
      discoveryScore: 40,
      computedAt: new Date('2026-07-29T00:00:00.000Z'),
    });

    const result = await service.recomputeForGame('g1');

    expect(result).toEqual({
      gameId: 'g1',
      trendingScore: 10,
      popularityScore: 20,
      reviewScore: 30,
      wishlistScore: 5,
      completionScore: 5,
      freshnessScore: 80,
      discoveryScore: 40,
      computedAt: '2026-07-29T00:00:00.000Z',
    });
    expect(prisma.discoveryScore.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { gameId: 'g1' },
        create: expect.objectContaining({ gameId: 'g1', discoveryScore: expect.any(Number) }),
        update: expect.objectContaining({ discoveryScore: expect.any(Number) }),
      }),
    );
    expect(prisma.libraryEntry.count).toHaveBeenCalledTimes(5);
    expect(prisma.review.count).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['discovery', 'discoveryScore'],
    ['trending', 'trendingScore'],
    ['popular', 'popularityScore'],
    ['review', 'reviewScore'],
  ] as const)('listByScore orders by %s field', async (sort, orderField) => {
    prisma.discoveryScore.findMany.mockResolvedValue([{ gameId: 'g1' }]);
    prisma.game.findMany.mockResolvedValue([sampleGame]);

    const page = await service.listByScore(sort, 10);

    expect(prisma.discoveryScore.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ [orderField]: 'desc' }, { gameId: 'asc' }],
        take: 10,
      }),
    );
    expect(page.items[0]?.id).toBe('g1');
  });

  it('listHiddenGems uses discovery score table when rows exist', async () => {
    prisma.discoveryScore.findMany.mockResolvedValue([{ gameId: 'gem' }]);
    prisma.game.findMany.mockResolvedValue([
      { ...sampleGame, id: 'gem', title: 'Gem', slug: 'gem' },
    ]);

    const page = await service.listHiddenGems(5);

    expect(page.items[0]?.id).toBe('gem');
    expect(prisma.game.findMany).toHaveBeenCalledTimes(1);
  });

  it('listHiddenGems falls back to rating/library heuristic when scores empty', async () => {
    prisma.discoveryScore.findMany.mockResolvedValue([]);
    prisma.game.findMany.mockResolvedValue([
      { ...sampleGame, id: 'low', title: 'Low', slug: 'low', popularity: 1 },
      { ...sampleGame, id: 'skip', title: 'Skip', slug: 'skip', popularity: 2 },
      { ...sampleGame, id: 'tie-b', title: 'Tie B', slug: 'tie-b', popularity: 1 },
      { ...sampleGame, id: 'tie-a', title: 'Tie A', slug: 'tie-a', popularity: 1 },
      { ...sampleGame, id: 'lib-heavy', title: 'Heavy', slug: 'heavy', popularity: 1 },
    ]);
    prisma.review.groupBy.mockResolvedValue([
      { gameId: 'low', _avg: { rating: 9 }, _count: { rating: 3 } },
      { gameId: 'skip', _avg: { rating: 5 }, _count: { rating: 1 } },
      { gameId: 'tie-b', _avg: { rating: 8 }, _count: { rating: 2 } },
      { gameId: 'tie-a', _avg: { rating: 8 }, _count: { rating: 2 } },
      { gameId: 'lib-heavy', _avg: { rating: 8 }, _count: { rating: 2 } },
    ]);
    prisma.libraryEntry.groupBy.mockResolvedValue([
      { gameId: 'low', _count: { gameId: 2 } },
      { gameId: 'skip', _count: { gameId: 2 } },
      { gameId: 'tie-b', _count: { gameId: 4 } },
      { gameId: 'tie-a', _count: { gameId: 4 } },
      { gameId: 'lib-heavy', _count: { gameId: 10 } },
    ]);

    const page = await service.listHiddenGems(5);

    expect(page.items.map((row) => row.id)).toEqual(['low', 'tie-a', 'tie-b', 'lib-heavy']);
  });
});
