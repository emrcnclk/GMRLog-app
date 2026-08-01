import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RecommendationService } from './recommendation.service';

const sampleGame = {
  id: 'g1',
  title: 'Game',
  slug: 'game',
  coverKey: null,
  releaseDate: new Date('2026-06-01T00:00:00.000Z'),
  featured: false,
  popularity: 40,
  franchiseId: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const genre = {
  id: 'genre-1',
  name: 'Action',
  slug: 'action',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('RecommendationService', () => {
  const prisma = {
    discoveryScore: { findMany: vi.fn() },
    game: { findMany: vi.fn() },
    libraryEntry: { findMany: vi.fn(), groupBy: vi.fn() },
    recommendationRule: { findMany: vi.fn() },
    gameGenre: { findMany: vi.fn() },
    gamePlatform: { findMany: vi.fn() },
    gameTag: { findMany: vi.fn() },
    gameCompany: { findMany: vi.fn() },
    review: { groupBy: vi.fn() },
    friendRequest: { findMany: vi.fn() },
  };

  let service: RecommendationService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.gameGenre.findMany.mockResolvedValue([]);
    prisma.gamePlatform.findMany.mockResolvedValue([]);
    // D3.25 — catalog tag/company signals default to empty (un-enriched game).
    prisma.gameTag.findMany.mockResolvedValue([]);
    prisma.gameCompany.findMany.mockResolvedValue([]);
    prisma.libraryEntry.findMany.mockResolvedValue([]);
    prisma.libraryEntry.groupBy.mockResolvedValue([]);
    prisma.review.groupBy.mockResolvedValue([]);
    prisma.friendRequest.findMany.mockResolvedValue([]);
    prisma.recommendationRule.findMany.mockResolvedValue([]);
    service = new RecommendationService(prisma as never);
  });

  it('guest uses discovery scores when present', async () => {
    prisma.discoveryScore.findMany.mockResolvedValue([
      {
        gameId: 'g1',
        popularityScore: 80,
        freshnessScore: 70,
        discoveryScore: 75,
      },
      {
        gameId: 'ghost',
        popularityScore: 10,
        freshnessScore: 10,
        discoveryScore: 10,
      },
    ]);
    prisma.game.findMany.mockResolvedValue([sampleGame]);

    const rows = await service.recommendForUser(null, 5);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.game.id).toBe('g1');
    expect(rows[0]?.reasonKey).toBe('popular_fresh');
    expect(rows[0]?.score).toBeGreaterThan(0);
  });

  it('guest falls back to popularity catalog when scores are empty', async () => {
    prisma.discoveryScore.findMany.mockResolvedValue([]);
    prisma.game.findMany.mockResolvedValue([sampleGame]);

    const rows = await service.recommendForUser(null, 5);

    expect(rows[0]?.game.id).toBe('g1');
    expect(rows[0]?.reasonKey).toBe('popular_fresh');
  });

  it('authenticated empty library falls back to guest path', async () => {
    prisma.libraryEntry.findMany.mockResolvedValue([]);
    prisma.discoveryScore.findMany.mockResolvedValue([
      {
        gameId: 'g1',
        popularityScore: 50,
        freshnessScore: 40,
        discoveryScore: 45,
      },
    ]);
    prisma.game.findMany.mockResolvedValue([sampleGame]);

    const rows = await service.recommendForUser('user-1', 5);

    expect(rows[0]?.game.id).toBe('g1');
    expect(rows[0]?.reasonKey).toBe('popular_fresh');
    expect(prisma.recommendationRule.findMany).not.toHaveBeenCalled();
  });

  it('authenticated applies rule boost and genre candidates', async () => {
    prisma.libraryEntry.findMany.mockResolvedValue([
      { gameId: 'seed', status: 'completed' },
      { gameId: 'wish', status: 'wishlist' },
    ]);
    prisma.recommendationRule.findMany.mockResolvedValue([
      {
        id: 'rule-1',
        seedGameId: 'seed',
        targetGameId: 'target',
        weight: 0.5,
        isActive: true,
        reasonKey: 'because_you_played',
      },
      {
        id: 'rule-2',
        seedGameId: 'seed',
        targetGameId: 'seed',
        weight: 1,
        isActive: true,
        reasonKey: 'owned_skip',
      },
    ]);
    prisma.gameGenre.findMany.mockImplementation(
      async (args: { where?: { gameId?: { in: string[] } }; include?: unknown }) => {
        if (args.include !== undefined) {
          return [
            { gameId: 'target', genreId: 'genre-1', genre },
            { gameId: 'other', genreId: 'genre-1', genre },
          ];
        }
        return [
          { gameId: 'seed', genreId: 'genre-1' },
          { gameId: 'wish', genreId: 'genre-1' },
        ];
      },
    );
    prisma.game.findMany.mockImplementation(
      async (args: { where?: { id?: { in?: string[]; notIn?: string[] } }; select?: unknown }) => {
        if (args.select !== undefined) {
          return [{ id: 'other' }];
        }
        const ids = args.where?.id?.in ?? [];
        return ids.map((id) => ({
          ...sampleGame,
          id,
          title: id,
          slug: id,
          popularity: id === 'target' ? 20 : 80,
        }));
      },
    );
    prisma.friendRequest.findMany.mockResolvedValue([
      { senderId: 'user-1', receiverId: 'friend-1' },
    ]);
    prisma.libraryEntry.groupBy.mockResolvedValue([{ gameId: 'target', _count: { gameId: 2 } }]);
    prisma.review.groupBy.mockResolvedValue([
      { gameId: 'target', _avg: { rating: 8 }, _count: { rating: 2 } },
      { gameId: 'other', _avg: { rating: 7 }, _count: { rating: 1 } },
    ]);

    const rows = await service.recommendForUser('user-1', 10);

    const target = rows.find((row) => row.game.id === 'target');
    expect(target).toBeDefined();
    expect(target?.reasonKey).toBe('because_you_played');
    expect(rows.every((row) => row.game.id !== 'seed')).toBe(true);
  });

  it('authenticated marks genre_overlap and popularity reason keys', async () => {
    prisma.libraryEntry.findMany.mockResolvedValue([{ gameId: 'seed', status: 'owned' }]);
    prisma.recommendationRule.findMany.mockResolvedValue([]);
    prisma.gameGenre.findMany.mockImplementation(
      async (args: { where?: { gameId?: { in: string[] } }; include?: unknown }) => {
        if (args.include !== undefined) {
          return [{ gameId: 'genre-hit', genreId: 'genre-1', genre }];
        }
        return [{ gameId: 'seed', genreId: 'genre-1' }];
      },
    );
    prisma.game.findMany.mockImplementation(
      async (args: { where?: { id?: { in?: string[]; notIn?: string[] } }; select?: unknown }) => {
        if (args.select !== undefined) {
          return [{ id: 'genre-hit' }, { id: 'pop-hit' }];
        }
        const ids = args.where?.id?.in ?? [];
        return ids.map((id) => ({
          ...sampleGame,
          id,
          title: id,
          slug: id,
          popularity: id === 'pop-hit' ? 200 : 10,
        }));
      },
    );
    prisma.review.groupBy.mockResolvedValue([
      { gameId: 'genre-hit', _avg: { rating: null }, _count: { rating: 0 } },
      { gameId: 'pop-hit', _avg: { rating: 9 }, _count: { rating: 2 } },
    ]);

    const rows = await service.recommendForUser('user-1', 10);

    expect(rows.find((row) => row.game.id === 'genre-hit')?.reasonKey).toBe('genre_overlap');
    expect(rows.find((row) => row.game.id === 'pop-hit')?.reasonKey).toBe('popularity');
  });
});
