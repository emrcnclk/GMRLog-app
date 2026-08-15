import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SimilarityService } from './similarity.service';

const sampleGame = {
  id: 'a',
  title: 'A',
  slug: 'a',
  coverKey: null,
  releaseDate: null,
  featured: false,
  popularity: 10,
  franchiseId: 'f1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const sampleUser = {
  id: 'u1',
  handle: 'alice',
  displayName: 'Alice',
  avatarKey: null,
  bannerKey: null,
  avatarBlurhash: null,
  avatarVariants: null,
  bannerBlurhash: null,
  bannerVariants: null,
  bio: null,
  privacyId: null,
  creatorFeatured: false,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
  accountKind: 'individual',
  cardNumber: 1,
};

describe('SimilarityService', () => {
  const prisma = {
    game: { findUnique: vi.fn(), findMany: vi.fn() },
    user: { findUnique: vi.fn(), findMany: vi.fn() },
    gameSimilarity: { findMany: vi.fn(), upsert: vi.fn() },
    userSimilarity: { findMany: vi.fn(), upsert: vi.fn() },
    libraryEntry: { findMany: vi.fn(), groupBy: vi.fn() },
    review: { findMany: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn() },
    gameGenre: { findMany: vi.fn() },
    gamePlatform: { findMany: vi.fn() },
    gameTag: { findMany: vi.fn() },
    gameCompany: { findMany: vi.fn() },
    block: { findMany: vi.fn() },
  };

  let service: SimilarityService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.gameGenre.findMany.mockResolvedValue([]);
    prisma.gamePlatform.findMany.mockResolvedValue([]);
    // D3.25 — catalog tag/company signals default to empty (un-enriched game).
    prisma.gameTag.findMany.mockResolvedValue([]);
    prisma.gameCompany.findMany.mockResolvedValue([]);
    prisma.libraryEntry.findMany.mockResolvedValue([]);
    prisma.libraryEntry.groupBy.mockResolvedValue([]);
    prisma.review.findMany.mockResolvedValue([]);
    prisma.review.aggregate.mockResolvedValue({ _avg: { rating: 8 } });
    prisma.review.groupBy.mockResolvedValue([]);
    prisma.block.findMany.mockResolvedValue([]);
    prisma.gameSimilarity.upsert.mockResolvedValue({});
    prisma.userSimilarity.upsert.mockResolvedValue({});
    service = new SimilarityService(prisma as never);
  });

  it('throws when similar-games target is missing', async () => {
    prisma.game.findUnique.mockResolvedValue(null);
    await expect(service.getSimilarGames('missing', 5)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns stored game similarities when cache is present', async () => {
    prisma.game.findUnique.mockResolvedValue(sampleGame);
    prisma.gameSimilarity.findMany.mockResolvedValue([
      { id: '1', gameAId: 'a', gameBId: 'b', score: 0.8 },
      { id: '2', gameAId: 'c', gameBId: 'a', score: 0.5 },
    ]);
    prisma.game.findMany.mockResolvedValue([
      { ...sampleGame, id: 'b', title: 'B', slug: 'b' },
      { ...sampleGame, id: 'c', title: 'C', slug: 'c' },
    ]);

    const rows = await service.getSimilarGames('a', 5);

    expect(rows.map((row) => ({ id: row.game.id, score: row.score }))).toEqual([
      { id: 'b', score: 0.8 },
      { id: 'c', score: 0.5 },
    ]);
    expect(prisma.gameSimilarity.upsert).not.toHaveBeenCalled();
  });

  it('computes and caches game pairs when cache is empty', async () => {
    prisma.game.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({
      ...sampleGame,
      id: where.id,
      franchiseId: 'f1',
      popularity: 10,
    }));
    prisma.gameSimilarity.findMany.mockResolvedValue([]);
    prisma.gameGenre.findMany.mockImplementation(
      async ({ where }: { where: { gameId: string } }) => [
        { genreId: 'genre-1', gameId: where.gameId },
      ],
    );
    prisma.gamePlatform.findMany.mockImplementation(
      async ({ where }: { where: { gameId: string } }) => [
        { platformId: 'platform-1', gameId: where.gameId },
      ],
    );
    prisma.game.findMany
      .mockResolvedValueOnce([{ id: 'b' }])
      .mockResolvedValueOnce([{ ...sampleGame, id: 'b', title: 'B', slug: 'b' }]);

    const rows = await service.getSimilarGames('a', 5);

    expect(rows[0]?.game.id).toBe('b');
    expect(rows[0]?.score).toBeGreaterThan(0);
    expect(prisma.gameSimilarity.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { gameAId_gameBId: { gameAId: 'a', gameBId: 'b' } },
        create: expect.objectContaining({ gameAId: 'a', gameBId: 'b' }),
      }),
    );
  });

  it('computes via popularity candidates when source has no genres', async () => {
    prisma.game.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) =>
      where.id === 'missing-cand'
        ? null
        : { ...sampleGame, id: where.id, franchiseId: 'f1', popularity: 10 },
    );
    prisma.gameSimilarity.findMany.mockResolvedValue([]);
    prisma.gameGenre.findMany.mockResolvedValue([]);
    prisma.gamePlatform.findMany.mockResolvedValue([{ platformId: 'p1' }]);
    prisma.game.findMany
      .mockResolvedValueOnce([{ id: 'b' }, { id: 'missing-cand' }])
      .mockResolvedValueOnce([{ ...sampleGame, id: 'b', title: 'B', slug: 'b' }]);

    const rows = await service.getSimilarGames('a', 5);

    expect(rows[0]?.game.id).toBe('b');
    expect(prisma.game.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { not: 'a' } },
      }),
    );
  });

  it('skips cached game pairs whose records are missing', async () => {
    prisma.game.findUnique.mockResolvedValue(sampleGame);
    prisma.gameSimilarity.findMany.mockResolvedValue([
      { id: '1', gameAId: 'a', gameBId: 'ghost', score: 0.9 },
    ]);
    prisma.game.findMany.mockResolvedValue([]);

    await expect(service.getSimilarGames('a', 5)).resolves.toEqual([]);
  });

  it('returns empty when compute finds no overlapping signals', async () => {
    prisma.game.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({
      ...sampleGame,
      id: where.id,
      franchiseId: where.id === 'a' ? null : 'other-franchise',
      popularity: where.id === 'a' ? 5 : 500,
    }));
    prisma.gameSimilarity.findMany.mockResolvedValue([]);
    prisma.review.aggregate.mockResolvedValue({ _avg: { rating: null } });
    prisma.game.findMany.mockResolvedValueOnce([{ id: 'b' }]);

    const rows = await service.getSimilarGames('a', 5);

    expect(rows).toEqual([]);
    expect(prisma.gameSimilarity.upsert).not.toHaveBeenCalled();
  });

  it('throws when similar-users target is missing or soft-deleted', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.getSimilarUsers('missing', 5)).rejects.toBeInstanceOf(NotFoundException);

    prisma.user.findUnique.mockResolvedValue({ ...sampleUser, deletedAt: new Date() });
    await expect(service.getSimilarUsers('u1', 5)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns stored user similarities and filters blocked users', async () => {
    prisma.user.findUnique.mockResolvedValue(sampleUser);
    prisma.block.findMany.mockResolvedValue([
      { blockerId: 'u1', blockedId: 'blocked' },
      { blockerId: 'blocker', blockedId: 'u1' },
    ]);
    prisma.userSimilarity.findMany.mockResolvedValue([
      { id: '1', userAId: 'u1', userBId: 'u2', score: 0.6 },
      { id: '2', userAId: 'blocked', userBId: 'u1', score: 0.9 },
      { id: '3', userAId: 'u1', userBId: 'blocker', score: 0.8 },
      { id: '4', userAId: 'u1', userBId: 'ghost', score: 0.7 },
    ]);
    prisma.user.findMany.mockResolvedValue([
      { ...sampleUser, id: 'u2', handle: 'bob', displayName: 'Bob' },
    ]);

    const rows = await service.getSimilarUsers('u1', 5);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.user.id).toBe('u2');
    expect(rows[0]?.score).toBe(0.6);
    // 5.3: existing consumer shape ({ user, score }) still compiles and works
    // unchanged — `match` is additive, not required.
    const [existingShape]: { user: unknown; score: number }[] = rows;
    expect(existingShape).toBeDefined();
  });

  it('populates `match` from a fully-persisted cached row', async () => {
    prisma.user.findUnique.mockResolvedValue(sampleUser);
    prisma.userSimilarity.findMany.mockResolvedValue([
      {
        id: '1',
        userAId: 'u1',
        userBId: 'u2',
        score: 0.634,
        library: 0.5,
        genre: 0.25,
        reviewRating: 0.75,
        wishlist: 0.1,
        completion: 0.9,
      },
    ]);
    prisma.user.findMany.mockResolvedValue([
      { ...sampleUser, id: 'u2', handle: 'bob', displayName: 'Bob' },
    ]);

    const rows = await service.getSimilarUsers('u1', 5);

    expect(rows[0]?.match).toEqual({
      percent: 63,
      band: 'partial',
      dimensions: [
        { key: 'library', score: 50 },
        { key: 'genre', score: 25 },
        { key: 'reviewRating', score: 75 },
        { key: 'wishlist', score: 10 },
        { key: 'completion', score: 90 },
      ],
    });
  });

  it('omits `match` for an organisation account, even with a real cached breakdown (8.3b)', async () => {
    prisma.user.findUnique.mockResolvedValue(sampleUser);
    prisma.userSimilarity.findMany.mockResolvedValue([
      {
        id: '1',
        userAId: 'u1',
        userBId: 'u2',
        score: 0.634,
        library: 0.5,
        genre: 0.25,
        reviewRating: 0.75,
        wishlist: 0.1,
        completion: 0.9,
      },
    ]);
    prisma.user.findMany.mockResolvedValue([
      { ...sampleUser, id: 'u2', handle: 'bob', displayName: 'Bob', accountKind: 'organisation' },
    ]);

    const rows = await service.getSimilarUsers('u1', 5);

    expect(rows[0]?.user.id).toBe('u2');
    expect(rows[0]?.score).toBe(0.634);
    expect(rows[0]?.match).toBeUndefined();
  });

  it('omits `match` for a pre-5.2 cached row with score but all components 0', async () => {
    prisma.user.findUnique.mockResolvedValue(sampleUser);
    prisma.userSimilarity.findMany.mockResolvedValue([
      {
        id: '1',
        userAId: 'u1',
        userBId: 'u2',
        score: 0.6,
        library: 0,
        genre: 0,
        reviewRating: 0,
        wishlist: 0,
        completion: 0,
      },
    ]);
    prisma.user.findMany.mockResolvedValue([
      { ...sampleUser, id: 'u2', handle: 'bob', displayName: 'Bob' },
    ]);

    const rows = await service.getSimilarUsers('u1', 5);

    expect(rows[0]?.score).toBe(0.6);
    expect(rows[0]?.match).toBeUndefined();
  });

  it('computes and caches user pairs when cache is empty', async () => {
    prisma.user.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({
      ...sampleUser,
      id: where.id,
      handle: where.id,
      displayName: where.id,
    }));
    prisma.userSimilarity.findMany.mockResolvedValue([]);
    prisma.libraryEntry.findMany.mockImplementation(
      async ({ where }: { where: { userId?: string; gameId?: { in: string[] } } }) => {
        if (where.gameId !== undefined) {
          return [{ userId: 'u2' }];
        }
        if (where.userId === 'u1') {
          return [
            { gameId: 'g1', status: 'completed' },
            { gameId: 'g2', status: 'wishlist' },
          ];
        }
        return [
          { gameId: 'g1', status: 'completed' },
          { gameId: 'g2', status: 'wishlist' },
        ];
      },
    );
    prisma.review.findMany.mockResolvedValue([{ gameId: 'g1', rating: 8 }]);
    prisma.gameGenre.findMany.mockResolvedValue([{ genreId: 'genre-1' }]);
    prisma.user.findMany.mockResolvedValue([
      { ...sampleUser, id: 'u2', handle: 'bob', displayName: 'Bob' },
    ]);

    const rows = await service.getSimilarUsers('u1', 5);

    expect(rows.some((row) => row.user.id === 'u2')).toBe(true);
    expect(prisma.userSimilarity.upsert).toHaveBeenCalled();
  });

  it('falls back to recent users when library overlap is empty', async () => {
    prisma.user.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({
      ...sampleUser,
      id: where.id,
    }));
    prisma.userSimilarity.findMany.mockResolvedValue([]);
    prisma.libraryEntry.findMany.mockResolvedValue([]);
    prisma.user.findMany
      .mockResolvedValueOnce([{ id: 'u2' }])
      .mockResolvedValueOnce([{ ...sampleUser, id: 'u2', handle: 'bob', displayName: 'Bob' }]);
    prisma.review.findMany.mockResolvedValue([]);
    prisma.gameGenre.findMany.mockResolvedValue([]);

    const rows = await service.getSimilarUsers('u1', 5);

    expect(Array.isArray(rows)).toBe(true);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { not: 'u1' }, deletedAt: null },
      }),
    );
  });
});
