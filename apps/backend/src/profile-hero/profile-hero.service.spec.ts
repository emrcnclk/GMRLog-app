import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { formatCardNumber, ProfileHeroService } from './profile-hero.service';

describe('ProfileHeroService', () => {
  const users = { findById: vi.fn() };
  const metrics = { loadSnapshot: vi.fn() };
  const library = { listByUser: vi.fn() };
  const pins = { listByUser: vi.fn() };
  const archetypes = { listByUser: vi.fn() };
  const reputations = { listByUser: vi.fn() };
  const prisma = {
    externalProfile: { findFirst: vi.fn() },
  };
  const creatorEligibility = { isEligible: vi.fn() };

  let service: ProfileHeroService;

  beforeEach(() => {
    vi.clearAllMocks();
    users.findById.mockResolvedValue({
      id: 'user-1',
      createdAt: new Date('2025-06-01T00:00:00.000Z'),
      deletedAt: null,
      creatorFeatured: false,
      cardNumber: 42,
    });
    metrics.loadSnapshot.mockResolvedValue({
      libraryEntries: [
        { status: 'completed', createdAt: new Date() },
        { status: 'playing', createdAt: new Date() },
      ],
      sessionLogCount: 42,
      genreCounts: new Map([
        ['rpg', 3],
        ['fps', 1],
      ]),
    });
    library.listByUser.mockResolvedValue([{ gameId: 'game-playing' }]);
    pins.listByUser.mockResolvedValue([
      {
        kind: 'game',
        objectId: 'fav-1',
        position: 0,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        kind: 'collection',
        objectId: 'col-1',
        position: 0,
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);
    archetypes.listByUser.mockResolvedValue([{ archetypeKey: 'completionist' }]);
    reputations.listByUser.mockResolvedValue([{ badge: 'helpful_reviewer' }]);
    prisma.externalProfile.findFirst.mockResolvedValue({
      raw: { personalevel: 27 },
    });
    creatorEligibility.isEligible.mockResolvedValue(true);

    service = new ProfileHeroService(
      users as never,
      metrics as never,
      library as never,
      pins as never,
      archetypes as never,
      reputations as never,
      prisma as never,
      creatorEligibility as never,
    );
  });

  it('throws when user is missing', async () => {
    users.findById.mockResolvedValue(null);
    await expect(service.getHero('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('projects ProfileHeroResponse from composed sources', async () => {
    const hero = await service.getHero('user-1');
    expect(hero).toEqual({
      steamLevel: 27,
      completionPercent: 50,
      currentlyPlayingGameId: 'game-playing',
      favoriteGameIds: ['fav-1'],
      pinnedCollectionId: 'col-1',
      archetypeKeys: ['completionist'],
      memberSince: '2025-06-01T00:00:00.000Z',
      topGenre: 'rpg',
      totalHours: 42,
      reputationBadges: ['helpful_reviewer'],
      creatorBadge: true,
      cardNumber: '0042',
    });
  });

  it('pads a card number below the 4-digit floor and leaves a wider one untouched', () => {
    expect(formatCardNumber(1)).toBe('0001');
    expect(formatCardNumber(42)).toBe('0042');
    expect(formatCardNumber(9999)).toBe('9999');
    expect(formatCardNumber(100147)).toBe('100147');
  });

  it('formats a card number the same way for an organisation account — no gating by accountKind', async () => {
    users.findById.mockResolvedValue({
      id: 'org-1',
      createdAt: new Date('2025-06-01T00:00:00.000Z'),
      deletedAt: null,
      creatorFeatured: false,
      accountKind: 'organisation',
      cardNumber: 7,
    });

    const hero = await service.getHero('org-1');
    expect(hero.cardNumber).toBe('0007');
  });

  it('returns zero completion and nulls when library/pins/genres empty', async () => {
    metrics.loadSnapshot.mockResolvedValue({
      libraryEntries: [],
      sessionLogCount: 0,
      genreCounts: new Map(),
    });
    library.listByUser.mockResolvedValue([]);
    pins.listByUser.mockResolvedValue([]);
    prisma.externalProfile.findFirst.mockResolvedValue(null);

    const hero = await service.getHero('user-1');
    expect(hero.completionPercent).toBe(0);
    expect(hero.currentlyPlayingGameId).toBeNull();
    expect(hero.favoriteGameIds).toEqual([]);
    expect(hero.pinnedCollectionId).toBeNull();
    expect(hero.topGenre).toBeNull();
    expect(hero.steamLevel).toBeNull();
  });

  it('parses steam level from string fields and falls back to creatorFeatured', async () => {
    prisma.externalProfile.findFirst.mockResolvedValue({
      raw: { steamLevel: '12' },
    });
    service = new ProfileHeroService(
      users as never,
      metrics as never,
      library as never,
      pins as never,
      archetypes as never,
      reputations as never,
      prisma as never,
      null,
    );
    users.findById.mockResolvedValue({
      id: 'user-1',
      createdAt: new Date('2025-06-01T00:00:00.000Z'),
      deletedAt: null,
      creatorFeatured: true,
      cardNumber: 3,
    });

    const hero = await service.getHero('user-1');
    expect(hero.steamLevel).toBe(12);
    expect(hero.creatorBadge).toBe(true);
  });

  it('ignores non-object steam raw payloads', async () => {
    prisma.externalProfile.findFirst.mockResolvedValue({ raw: 'nope' });
    const hero = await service.getHero('user-1');
    expect(hero.steamLevel).toBeNull();
  });

  it('throws when metrics snapshot is missing', async () => {
    metrics.loadSnapshot.mockResolvedValue(null);
    await expect(service.getHero('user-1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
