import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DnaMatchService } from './dna-match.service';

const sampleUser = {
  id: 'user-1',
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
  accountKind: 'individual' as const,
  cardNumber: 1,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
};

const sampleGame = {
  id: 'g1',
  title: 'Hollow Knight',
  slug: 'hollow-knight',
  coverKey: null,
  releaseDate: null,
  featured: false,
  popularity: 10,
  franchiseId: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('DnaMatchService', () => {
  const prisma = {
    user: { findUnique: vi.fn() },
    block: { findFirst: vi.fn() },
    libraryEntry: { findMany: vi.fn(), groupBy: vi.fn() },
    review: { findMany: vi.fn(), groupBy: vi.fn() },
    gameGenre: { findMany: vi.fn() },
    gamePlatform: { findMany: vi.fn() },
    game: { findMany: vi.fn() },
  };
  const archetypes = { listForUser: vi.fn() };

  let service: DnaMatchService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.block.findFirst.mockResolvedValue(null);
    prisma.review.findMany.mockResolvedValue([]);
    prisma.gameGenre.findMany.mockResolvedValue([]);
    prisma.gamePlatform.findMany.mockResolvedValue([]);
    prisma.libraryEntry.groupBy.mockResolvedValue([]);
    prisma.review.groupBy.mockResolvedValue([]);
    archetypes.listForUser.mockResolvedValue([]);
    service = new DnaMatchService(prisma as never, archetypes as never);
  });

  it('throws when the viewer or the target is missing or soft-deleted', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.getDnaMatch('viewer', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    prisma.user.findUnique.mockResolvedValue({ ...sampleUser, deletedAt: new Date() });
    await expect(service.getDnaMatch('viewer', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws 404 when blocked in either direction, before touching signals', async () => {
    prisma.user.findUnique.mockResolvedValue(sampleUser);
    prisma.block.findFirst.mockResolvedValue({ id: 'block-1' });

    await expect(service.getDnaMatch('viewer', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.libraryEntry.findMany).not.toHaveBeenCalled();
  });

  it('returns applicable: false and traits: [] for an organisation target, without querying archetypes', async () => {
    prisma.user.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) =>
      where.id === 'org-1'
        ? { ...sampleUser, id: 'org-1', accountKind: 'organisation' }
        : sampleUser,
    );

    const result = await service.getDnaMatch('viewer', 'org-1');

    expect(result.applicable).toBe(false);
    expect(result.percent).toBe(0);
    expect(result.band).toBe('different');
    expect(result.traits).toEqual([]);
    expect(result.sharedGames).toEqual([]);
    expect(prisma.libraryEntry.findMany).not.toHaveBeenCalled();
    expect(archetypes.listForUser).not.toHaveBeenCalled();
  });

  it('reports the thin-data verdict and traits: [] when fewer than 3 shared games and no shared reviews', async () => {
    prisma.user.findUnique.mockResolvedValue(sampleUser);
    prisma.libraryEntry.findMany.mockImplementation(
      async ({ where }: { where: { userId: string; gameId?: { in: string[] } } }) => {
        if (where.gameId !== undefined) {
          return [];
        }
        return [{ gameId: 'g1', status: 'owned' }];
      },
    );
    prisma.game.findMany.mockResolvedValue([sampleGame]);
    // Even if both sides share badges, thin shared-game data must not surface them.
    archetypes.listForUser.mockResolvedValue([
      { key: 'collector', score: 90, awardedAt: '2026-01-01T00:00:00.000Z' },
    ]);

    const result = await service.getDnaMatch('viewer', 'user-1');

    expect(result.applicable).toBe(true);
    expect(result.percent).toBe(0);
    expect(result.band).toBe('different');
    expect(result.verdict).toContain('Not enough shared library or reviews yet');
    expect(result.traits).toEqual([]);
    expect(result.sharedGames.map((game) => game.id)).toEqual(['g1']);
    expect(archetypes.listForUser).not.toHaveBeenCalled();
  });

  it('derives traits from archetypes shared by both sides, ranked by combined score and capped at 3', async () => {
    prisma.user.findUnique.mockResolvedValue(sampleUser);
    prisma.libraryEntry.findMany.mockImplementation(
      async ({ where }: { where: { userId: string; gameId?: { in: string[] } } }) => {
        if (where.gameId !== undefined) {
          // viewer recency lookup for the shared-games ordering
          return [
            { gameId: 'g1', updatedAt: new Date('2026-01-01T00:00:00.000Z') },
            { gameId: 'g2', updatedAt: new Date('2026-02-01T00:00:00.000Z') },
            { gameId: 'g3', updatedAt: new Date('2026-03-01T00:00:00.000Z') },
          ];
        }
        return [
          { gameId: 'g1', status: 'owned' },
          { gameId: 'g2', status: 'owned' },
          { gameId: 'g3', status: 'owned' },
        ];
      },
    );
    prisma.review.findMany.mockResolvedValue([{ gameId: 'g1', rating: 8 }]);
    prisma.gameGenre.findMany.mockResolvedValue([{ genreId: 'genre-1' }]);
    prisma.game.findMany.mockResolvedValue([
      { ...sampleGame, id: 'g1' },
      { ...sampleGame, id: 'g2' },
      { ...sampleGame, id: 'g3' },
    ]);
    archetypes.listForUser.mockImplementation(async (userId: string) =>
      userId === 'viewer'
        ? [
            { key: 'collector', score: 90, awardedAt: '2026-01-01T00:00:00.000Z' },
            { key: 'explorer', score: 80, awardedAt: '2026-01-01T00:00:00.000Z' },
            { key: 'reviewer', score: 70, awardedAt: '2026-01-01T00:00:00.000Z' },
            { key: 'tryhard', score: 60, awardedAt: '2026-01-01T00:00:00.000Z' },
            // one-sided — not shared, must not appear
            { key: 'social_gamer', score: 100, awardedAt: '2026-01-01T00:00:00.000Z' },
          ]
        : [
            { key: 'collector', score: 90, awardedAt: '2026-01-01T00:00:00.000Z' },
            { key: 'explorer', score: 80, awardedAt: '2026-01-01T00:00:00.000Z' },
            { key: 'reviewer', score: 70, awardedAt: '2026-01-01T00:00:00.000Z' },
            { key: 'tryhard', score: 60, awardedAt: '2026-01-01T00:00:00.000Z' },
          ],
    );

    const result = await service.getDnaMatch('viewer', 'user-1');

    expect(result.applicable).toBe(true);
    expect(result.percent).toBeGreaterThan(0);
    expect(result.dimensions).toHaveLength(5);
    expect(result.verdict.length).toBeGreaterThan(0);
    // 4 shared badges exist (collector/explorer/reviewer/tryhard) — capped at 3, ranked by combined score.
    expect(result.traits).toEqual(['Collector', 'Explorer', 'Reviewer']);
    // most-recently-touched by the viewer first
    expect(result.sharedGames.map((game) => game.id)).toEqual(['g3', 'g2', 'g1']);
  });

  it('returns traits: [] on the real path when nothing is shared', async () => {
    prisma.user.findUnique.mockResolvedValue(sampleUser);
    prisma.libraryEntry.findMany.mockImplementation(
      async ({ where }: { where: { userId: string; gameId?: { in: string[] } } }) => {
        if (where.gameId !== undefined) {
          return [{ gameId: 'g1', updatedAt: new Date('2026-01-01T00:00:00.000Z') }];
        }
        return [
          { gameId: 'g1', status: 'owned' },
          { gameId: 'g2', status: 'owned' },
          { gameId: 'g3', status: 'owned' },
        ];
      },
    );
    prisma.game.findMany.mockResolvedValue([{ ...sampleGame, id: 'g1' }]);
    archetypes.listForUser.mockImplementation(async (userId: string) =>
      userId === 'viewer'
        ? [{ key: 'collector', score: 90, awardedAt: '2026-01-01T00:00:00.000Z' }]
        : [{ key: 'explorer', score: 90, awardedAt: '2026-01-01T00:00:00.000Z' }],
    );

    const result = await service.getDnaMatch('viewer', 'user-1');

    expect(result.applicable).toBe(true);
    expect(result.traits).toEqual([]);
  });
});
