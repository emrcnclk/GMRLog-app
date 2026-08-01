import { beforeEach, describe, expect, it } from 'vitest';

import type {
  PlayerMetricSnapshot,
  PlayerMetricsRepository,
  UserArchetype,
  UserArchetypeRepository,
} from '@gmrlog/database';
import type { LibraryStatus } from '@prisma/client';

import {
  createFakeUserRepository,
  makeUser,
  type FakeUserRepository,
} from '../users/testing/fake-repositories';

import { ArchetypeEngineService } from './archetype-engine.service';

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

class FakeArchetypeRepository implements UserArchetypeRepository {
  rows = new Map<string, UserArchetype[]>();

  async listByUser(userId: string): Promise<UserArchetype[]> {
    return this.rows.get(userId) ?? [];
  }

  async replaceForUser(
    userId: string,
    data: ReadonlyArray<{ archetypeKey: string; score: number }>,
  ): Promise<UserArchetype[]> {
    const now = new Date();
    const created = data.map((row, index) => ({
      id: `arch-${String(index)}`,
      userId,
      archetypeKey: row.archetypeKey,
      score: row.score,
      awardedAt: now,
      createdAt: now,
      updatedAt: now,
    }));
    this.rows.set(userId, created);
    return created;
  }
}

class FakeMetrics implements PlayerMetricsRepository {
  constructor(public snapshot: PlayerMetricSnapshot | null) {}
  async loadSnapshot(): Promise<PlayerMetricSnapshot | null> {
    return this.snapshot;
  }
}

let users: FakeUserRepository;
let archetypes: FakeArchetypeRepository;
let metrics: FakeMetrics;
let service: ArchetypeEngineService;

beforeEach(() => {
  users = createFakeUserRepository([
    makeUser({ id: 'user-1', handle: 'gamer', displayName: 'Gamer' }),
  ]);
  archetypes = new FakeArchetypeRepository();
  metrics = new FakeMetrics(
    emptySnapshot({
      libraryByStatus: new Map([
        ['owned', 20],
        ['wishlist', 10],
        ['completed', 8],
        ['backlog', 15],
      ]),
      libraryTotal: 53,
      collections: Array.from({ length: 4 }, (_, i) => ({
        id: `c-${String(i)}`,
        createdAt: new Date(),
      })),
      reviews: Array.from({ length: 12 }, (_, i) => ({
        id: `r-${String(i)}`,
        rating: 8,
        bodyLength: 400,
        createdAt: new Date(),
      })),
      sessionLogCount: 30,
      friendCount: 6,
      followingCount: 10,
      communityCount: 3,
      commentCount: 20,
      achievementAwardedCount: 5,
      genreCounts: new Map([
        ['RPG', 5],
        ['Adventure', 4],
        ['Shooter', 1],
      ]),
    }),
  );
  service = new ArchetypeEngineService(archetypes, metrics, users);
});

describe('ArchetypeEngineService.recalculate', () => {
  it('awards multiple badges above threshold and replaces rows', async () => {
    const awarded = await service.recalculate('user-1');
    expect(awarded.length).toBeGreaterThan(1);
    expect(awarded.every((row) => row.score >= 40)).toBe(true);
    expect(awarded.some((row) => row.key === 'collector')).toBe(true);
    expect(awarded.some((row) => row.key === 'reviewer')).toBe(true);
    expect(awarded.some((row) => row.key === 'social_gamer')).toBe(true);
    expect(awarded.some((row) => row.key === 'indie_hunter')).toBe(false);
  });

  it('lists stored badges without recalculating', async () => {
    await service.recalculate('user-1');
    metrics.snapshot = emptySnapshot();
    const listed = await service.listForUser('user-1');
    expect(listed.length).toBeGreaterThan(0);
  });
});
