import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlayerMetricSnapshot, PlayerMetricsRepository } from '@gmrlog/database';
import type { LibraryStatus } from '@prisma/client';

import type { ArchetypeEngineService } from '../archetypes/archetype-engine.service';
import {
  createFakeUserRepository,
  makeUser,
  type FakeUserRepository,
} from '../users/testing/fake-repositories';

import { StatisticsService } from './statistics.service';

function emptySnapshot(overrides: Partial<PlayerMetricSnapshot> = {}): PlayerMetricSnapshot {
  return {
    libraryByStatus: new Map<LibraryStatus, number>(),
    libraryTotal: 0,
    libraryEntries: [],
    sessionLogCount: 0,
    sessionOccurredAts: [],
    reviews: [],
    posts: [],
    commentCount: 0,
    followerCount: 0,
    followingCount: 0,
    friendCount: 0,
    communityCount: 0,
    collections: [],
    tierListCount: 0,
    achievementAwardedCount: 0,
    eventParticipationCount: 0,
    genreCounts: new Map(),
    platformCounts: new Map(),
    franchiseCounts: new Map(),
    activeDayCount: 0,
    hasAvatar: false,
    hasBio: false,
    hasBanner: false,
    joinedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

class FakeMetrics implements PlayerMetricsRepository {
  constructor(public snapshot: PlayerMetricSnapshot | null) {}
  async loadSnapshot(): Promise<PlayerMetricSnapshot | null> {
    return this.snapshot;
  }
}

let users: FakeUserRepository;
let metrics: FakeMetrics;
let service: StatisticsService;

beforeEach(() => {
  users = createFakeUserRepository([
    makeUser({
      id: 'user-1',
      handle: 'gamer',
      displayName: 'Gamer',
      bio: 'hello',
      avatarKey: 'a',
      bannerKey: 'b',
    }),
  ]);
  metrics = new FakeMetrics(
    emptySnapshot({
      hasAvatar: true,
      hasBio: true,
      hasBanner: true,
      libraryEntries: [
        {
          id: 'e1',
          gameId: 'g1',
          status: 'completed',
          platformId: null,
          createdAt: new Date('2026-07-01T00:00:00.000Z'),
        },
        {
          id: 'e2',
          gameId: 'g2',
          status: 'dropped',
          platformId: null,
          createdAt: new Date('2026-07-20T00:00:00.000Z'),
        },
        {
          id: 'e3',
          gameId: 'g3',
          status: 'backlog',
          platformId: null,
          createdAt: new Date('2026-07-25T00:00:00.000Z'),
        },
        {
          id: 'e4',
          gameId: 'g4',
          status: 'wishlist',
          platformId: null,
          createdAt: new Date('2026-07-28T00:00:00.000Z'),
        },
      ],
      libraryTotal: 4,
      libraryByStatus: new Map([
        ['completed', 1],
        ['dropped', 1],
        ['backlog', 1],
        ['wishlist', 1],
      ]),
      sessionLogCount: 5,
      sessionOccurredAts: [
        new Date('2026-07-28T12:00:00.000Z'),
        new Date('2026-07-10T12:00:00.000Z'),
      ],
      reviews: [
        {
          id: 'r1',
          rating: 8,
          bodyLength: 100,
          createdAt: new Date('2026-07-15T00:00:00.000Z'),
        },
        {
          id: 'r2',
          rating: 6,
          bodyLength: 50,
          createdAt: new Date('2026-07-28T00:00:00.000Z'),
        },
      ],
      posts: [{ id: 'p1', createdAt: new Date('2026-07-01T00:00:00.000Z') }],
      collections: [{ id: 'c1', createdAt: new Date('2026-07-02T00:00:00.000Z') }],
      commentCount: 3,
      followerCount: 4,
      followingCount: 2,
      friendCount: 1,
      communityCount: 2,
      tierListCount: 1,
      achievementAwardedCount: 2,
      genreCounts: new Map([
        ['RPG', 3],
        ['Indie', 1],
      ]),
      platformCounts: new Map([['PC', 4]]),
      franchiseCounts: new Map([['FromSoftware', 2]]),
    }),
  );
  service = new StatisticsService(metrics, users);
});

describe('StatisticsService.build', () => {
  it('builds lifetime UserStatisticsResponse from metrics', async () => {
    const stats = await service.build('user-1', 'lifetime');
    expect(stats).toMatchObject({
      gamesLogged: 4,
      gamesCompleted: 1,
      gamesDropped: 1,
      backlogSize: 1,
      wishlistSize: 1,
      hoursPlayed: 5,
      reviewCount: 2,
      postCount: 1,
      commentCount: 3,
      friendCount: 1,
      achievementCount: 2,
      favoriteGenres: ['RPG', 'Indie'],
      favoritePlatform: 'PC',
      favoriteDeveloper: 'FromSoftware',
      favoritePublisher: null,
      period: 'lifetime',
      profileCompletionPercent: 100,
    });
    expect(stats.averageRating).toBe(7);
  });

  it('filters library/review counts by weekly period', async () => {
    const stats = await service.build('user-1', 'weekly');
    expect(stats.period).toBe('weekly');
    expect(stats.gamesLogged).toBeLessThan(4);
    expect(stats.hoursPlayed).toBeGreaterThanOrEqual(1);
  });

  it('supports daily period and empty review / library edge cases', async () => {
    metrics.snapshot = emptySnapshot({
      hasAvatar: false,
      hasBio: false,
      hasBanner: false,
      libraryEntries: [],
      reviews: [],
      sessionOccurredAts: [new Date()],
      sessionLogCount: 1,
    });
    const stats = await service.build('user-1', 'daily');
    expect(stats.period).toBe('daily');
    expect(stats.averageRating).toBeNull();
    expect(stats.completionPercent).toBe(0);
    expect(stats.commentCount).toBe(0);
    expect(stats.tierListCount).toBe(0);
    expect(stats.profileCompletionPercent).toBe(25);
  });

  it('returns 404 when snapshot or user is missing', async () => {
    metrics.snapshot = null;
    await expect(service.build('user-1')).rejects.toBeInstanceOf(NotFoundException);
    metrics.snapshot = emptySnapshot();
    await expect(service.build('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('optionally refreshes archetypes and swallows failures', async () => {
    const recalculate = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error('archetype boom'))
      .mockResolvedValueOnce(undefined);
    const archetypes = { recalculate } as unknown as ArchetypeEngineService;
    const withArchetypes = new StatisticsService(
      metrics,
      users,
      archetypes as ArchetypeEngineService,
    );
    await withArchetypes.build('user-1', 'lifetime', { refreshArchetypes: true });
    await withArchetypes.build('user-1', 'lifetime', { refreshArchetypes: true });
    expect(recalculate).toHaveBeenCalledTimes(2);
  });
});

describe('StatisticsService.history', () => {
  it('buckets review and collection growth', async () => {
    const history = await service.history('user-1', 'monthly');
    expect(history.period).toBe('monthly');
    expect(history.reviewGrowth.length).toBeGreaterThan(0);
    expect(history.collectionGrowth.length).toBeGreaterThan(0);
    expect(history.completions.length).toBeGreaterThan(0);
  });

  it('maps lifetime history requests to monthly buckets and supports weekly', async () => {
    const lifetime = await service.history('user-1', 'lifetime');
    expect(lifetime.period).toBe('monthly');
    const weekly = await service.history('user-1', 'weekly');
    expect(weekly.period).toBe('weekly');
    expect(weekly.ratings.length).toBeGreaterThan(0);
  });

  it('returns 404 when metrics are missing', async () => {
    metrics.snapshot = null;
    await expect(service.history('user-1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
