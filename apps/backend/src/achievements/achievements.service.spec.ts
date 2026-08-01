import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ArchetypeEngineService } from '../archetypes/archetype-engine.service';
import {
  createFakeUserRepository,
  makeUser,
  type FakeUserRepository,
} from '../users/testing/fake-repositories';

import { AchievementsService } from './achievements.service';
import {
  createFakeAchievementActivityRepository,
  createFakeAchievementNotificationRepository,
  createFakeAchievementRepository,
  createFakePlayerMetricsRepository,
  emptySnapshot,
  type FakeAchievementRepository,
  type FakeActivityRepository,
  type FakeNotificationRepository,
  type FakePlayerMetricsRepository,
} from './testing/fake-repositories';

let achievements: FakeAchievementRepository;
let metrics: FakePlayerMetricsRepository;
let users: FakeUserRepository;
let notifications: FakeNotificationRepository;
let activity: FakeActivityRepository;
let service: AchievementsService;

beforeEach(async () => {
  users = createFakeUserRepository([
    makeUser({ id: 'user-1', handle: 'gamer', displayName: 'Gamer' }),
  ]);
  achievements = createFakeAchievementRepository();
  metrics = createFakePlayerMetricsRepository(
    emptySnapshot({
      libraryTotal: 1,
      libraryByStatus: new Map([['owned', 1]]),
      friendCount: 0,
    }),
  );
  notifications = createFakeAchievementNotificationRepository();
  activity = createFakeAchievementActivityRepository();
  service = new AchievementsService(achievements, metrics, users, notifications, activity);
  await service.seedDefinitions();
});

describe('AchievementsService.recalculate', () => {
  it('awards logging.first_game and emits notification + activity once', async () => {
    const results = await service.recalculate('user-1');
    const first = results.find((row) => row.key === 'logging.first_game');
    expect(first?.progress.state).toBe('awarded');
    expect(notifications.rows.some((row) => row.kind === 'achievement_unlocked')).toBe(true);
    expect(activity.items.some((row) => row.kind === 'achievement')).toBe(true);

    const beforeNotifs = notifications.rows.length;
    await service.recalculate('user-1');
    expect(notifications.rows.length).toBe(beforeNotifs);
  });

  it('keeps progress in_progress below target', async () => {
    metrics.snapshot = emptySnapshot({
      libraryTotal: 3,
      libraryByStatus: new Map([['owned', 3]]),
    });
    const results = await service.recalculate('user-1');
    const ten = results.find((row) => row.key === 'logging.ten_games');
    expect(ten?.progress.state).toBe('in_progress');
    expect(ten?.progress.current).toBe(3);
  });

  it('rejects unknown users', async () => {
    await expect(service.recalculate('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('AchievementsService.listForViewer', () => {
  it('redacts hidden locked achievements for other viewers', async () => {
    await service.recalculate('user-1');
    const forOther = await service.listForViewer('user-1', 'someone-else', { refresh: false });
    const hidden = forOther.find((row) => row.key === 'hidden.secret_dropper');
    expect(hidden?.title).toBe('Hidden achievement');
    expect(hidden?.progress.state).toBe('locked');
  });

  it('lazy-refreshes for the owner when refresh=true', async () => {
    metrics.snapshot = emptySnapshot({
      libraryTotal: 1,
      libraryByStatus: new Map([['owned', 1]]),
    });
    const list = await service.listForViewer('user-1', 'user-1', { refresh: true });
    expect(
      list.some((row) => row.key === 'logging.first_game' && row.progress.state === 'awarded'),
    ).toBe(true);
  });
});

describe('AchievementsService.getById', () => {
  it('returns a definition and optional viewer progress', async () => {
    await service.recalculate('user-1');
    const first = (await achievements.listDefinitions()).find(
      (row) => row.key === 'logging.first_game',
    );
    expect(first).toBeDefined();
    if (first == null) {
      return;
    }
    const withProgress = await service.getById(first.id, 'user-1');
    expect(withProgress.progress.state).toBe('awarded');
    const withoutViewer = await service.getById(first.id, null);
    expect(withoutViewer.id).toBe(first.id);
  });

  it('rejects unknown achievement ids', async () => {
    await expect(service.getById('missing', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('AchievementsService.recalculate criteria coverage', () => {
  it('awards across multiple criteria refs and keeps locked at zero', async () => {
    metrics.snapshot = emptySnapshot({
      libraryTotal: 0,
      libraryByStatus: new Map([
        ['completed', 2],
        ['dropped', 1],
      ]),
      reviews: [
        {
          id: 'r1',
          rating: 8,
          bodyLength: 10,
          createdAt: new Date(),
        },
      ],
      friendCount: 1,
      collections: [{ id: 'c1', createdAt: new Date() }],
      tierListCount: 1,
      communityCount: 1,
      sessionLogCount: 2,
      activeDayCount: 3,
      hasAvatar: true,
      hasBio: true,
      hasBanner: true,
    });
    const results = await service.recalculate('user-1');
    expect(
      results.some((row) => row.key === 'friends.first_friend' && row.progress.state === 'awarded'),
    ).toBe(true);
    expect(results.some((row) => row.progress.state === 'locked')).toBe(true);
  });

  it('returns 404 when metrics snapshot is missing', async () => {
    metrics.snapshot = null;
    await expect(service.recalculate('user-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('seeds definitions when the catalog is empty and swallows archetype failures', async () => {
    achievements.definitions.clear();
    metrics.snapshot = emptySnapshot({ libraryTotal: 1 });
    const recalculateArchetype = vi
      .fn<() => Promise<void>>()
      .mockRejectedValue(new Error('archetype fail'));
    const withArchetypes = new AchievementsService(
      achievements,
      metrics,
      users,
      notifications,
      activity,
      { recalculate: recalculateArchetype } as unknown as ArchetypeEngineService,
    );
    const results = await withArchetypes.recalculate('user-1');
    expect(results.length).toBeGreaterThan(0);
    expect(recalculateArchetype).toHaveBeenCalled();
  });
});
