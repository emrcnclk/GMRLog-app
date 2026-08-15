import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import type {
  Achievement,
  AchievementProgress,
  AchievementRepository,
  AchievementState,
  Collection,
  CollectionRepository,
  Game,
  GameRepository,
  ProfilePin,
  ProfilePinRepository,
  Review,
  ReviewRepository,
} from '@gmrlog/database';

import {
  createFakeUserRepository,
  makeUser,
  type FakeUserRepository,
} from '../users/testing/fake-repositories';

import { ACHIEVEMENT_PIN_LIMIT, ProfilePinsService } from './profile-pins.service';
import { GAME_CATALOG_DEFAULTS } from '../games/game-catalog.defaults';

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${String(idCounter)}`;
}

class FakePins implements ProfilePinRepository {
  rows = new Map<string, ProfilePin>();

  async listByUser(userId: string): Promise<ProfilePin[]> {
    return [...this.rows.values()]
      .filter((row) => row.userId === userId)
      .sort((a, b) => a.position - b.position);
  }

  async upsert(data: {
    userId: string;
    kind: ProfilePin['kind'];
    objectId: string;
    position: number;
  }): Promise<ProfilePin> {
    const key = `${data.userId}:${data.kind}:${data.objectId}`;
    const existing = this.rows.get(key);
    const row: ProfilePin = {
      id: existing?.id ?? nextId('pin'),
      userId: data.userId,
      kind: data.kind,
      objectId: data.objectId,
      position: data.position,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    this.rows.set(key, row);
    return row;
  }

  async delete(
    userId: string,
    kind: ProfilePin['kind'],
    objectId: string,
  ): Promise<ProfilePin | null> {
    const key = `${userId}:${kind}:${objectId}`;
    const existing = this.rows.get(key) ?? null;
    if (existing != null) {
      this.rows.delete(key);
    }
    return existing;
  }
}

class FakeGames implements Pick<GameRepository, 'findById'> {
  constructor(private readonly games: Game[]) {}
  async findById(id: string): Promise<Game | null> {
    return this.games.find((game) => game.id === id) ?? null;
  }
}

class FakeReviews implements Pick<ReviewRepository, 'findActiveById'> {
  constructor(private readonly reviews: Review[]) {}
  async findActiveById(id: string): Promise<Review | null> {
    return this.reviews.find((row) => row.id === id && row.deletedAt == null) ?? null;
  }
}

class FakeCollections implements Pick<CollectionRepository, 'findActiveById'> {
  constructor(private readonly collections: Collection[]) {}
  async findActiveById(id: string): Promise<Collection | null> {
    return this.collections.find((row) => row.id === id && row.deletedAt == null) ?? null;
  }
}

function makeAchievement(overrides: Partial<Achievement> = {}): Achievement {
  return {
    id: 'ach-1',
    key: 'ach-1',
    title: 'First Steps',
    description: '',
    criteriaRef: 'library.total',
    category: 'milestones',
    isHidden: false,
    isRare: false,
    target: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeProgress(overrides: Partial<AchievementProgress> = {}): AchievementProgress {
  return {
    id: 'progress-1',
    achievementId: 'ach-1',
    userId: 'user-1',
    current: 1,
    target: 1,
    state: 'awarded' as AchievementState,
    awardedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

class FakeAchievements implements Pick<
  AchievementRepository,
  'findById' | 'findProgress' | 'listProgressByUser'
> {
  constructor(
    private readonly achievements: Achievement[],
    private readonly progress: AchievementProgress[],
  ) {}

  async findById(id: string): Promise<Achievement | null> {
    return this.achievements.find((row) => row.id === id) ?? null;
  }

  async findProgress(achievementId: string, userId: string): Promise<AchievementProgress | null> {
    return (
      this.progress.find((row) => row.achievementId === achievementId && row.userId === userId) ??
      null
    );
  }

  async listProgressByUser(userId: string): Promise<AchievementProgress[]> {
    return this.progress.filter((row) => row.userId === userId);
  }
}

let users: FakeUserRepository;
let pins: FakePins;
let achievements: FakeAchievements;
let service: ProfilePinsService;

beforeEach(() => {
  users = createFakeUserRepository([
    makeUser({ id: 'user-1', handle: 'gamer', displayName: 'Gamer' }),
  ]);
  pins = new FakePins();
  achievements = new FakeAchievements(
    [
      makeAchievement({ id: 'ach-1' }),
      makeAchievement({ id: 'ach-2' }),
      makeAchievement({ id: 'ach-3' }),
      makeAchievement({ id: 'ach-4' }),
      makeAchievement({ id: 'ach-locked' }),
    ],
    [
      makeProgress({ id: 'p1', achievementId: 'ach-1', userId: 'user-1', state: 'awarded' }),
      makeProgress({ id: 'p2', achievementId: 'ach-2', userId: 'user-1', state: 'awarded' }),
      makeProgress({ id: 'p3', achievementId: 'ach-3', userId: 'user-1', state: 'awarded' }),
      makeProgress({ id: 'p4', achievementId: 'ach-4', userId: 'user-1', state: 'awarded' }),
      makeProgress({
        id: 'p-locked',
        achievementId: 'ach-locked',
        userId: 'user-1',
        state: 'in_progress',
        current: 0,
        awardedAt: null,
      }),
    ],
  );
  const games = new FakeGames([
    {
      id: 'game-1',
      title: 'Hollow Knight',
      slug: 'hollow-knight',
      coverKey: null,
      releaseDate: null,
      featured: false,
      popularity: 0,
      franchiseId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...GAME_CATALOG_DEFAULTS,
    },
  ]);
  const reviews = new FakeReviews([
    {
      id: 'review-1',
      authorId: 'user-1',
      gameId: 'game-1',
      rating: 9,
      body: 'great',
      containsSpoilers: false,
      visibility: 'public',
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ]);
  const collections = new FakeCollections([
    {
      id: 'col-1',
      ownerId: 'user-1',
      title: 'Favorites',
      description: null,
      visibility: 'public',
      type: 'manual',
      ruleKey: null,
      bannerKey: null,
      coverKey: null,
      color: null,
      tags: [],
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ]);
  service = new ProfilePinsService(
    pins,
    users,
    games as unknown as GameRepository,
    reviews as unknown as ReviewRepository,
    collections as unknown as CollectionRepository,
    achievements as unknown as AchievementRepository,
  );
});

describe('ProfilePinsService', () => {
  it('upserts and lists pins when the object exists', async () => {
    const pin = await service.upsert('user-1', {
      kind: 'game',
      objectId: 'game-1',
      position: 0,
    });
    expect(pin).toMatchObject({ kind: 'game', objectId: 'game-1', position: 0 });
    const list = await service.listMine('user-1');
    expect(list).toHaveLength(1);
  });

  it('pins the owner review and collection', async () => {
    const reviewPin = await service.upsert('user-1', {
      kind: 'review',
      objectId: 'review-1',
      position: 2,
    });
    expect(reviewPin.kind).toBe('review');
    const collectionPin = await service.upsert('user-1', {
      kind: 'collection',
      objectId: 'col-1',
      position: 3,
    });
    expect(collectionPin.kind).toBe('collection');
  });

  it('rejects missing pin targets', async () => {
    await expect(
      service.upsert('user-1', { kind: 'game', objectId: 'missing' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.upsert('user-1', { kind: 'review', objectId: 'missing-review' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.upsert('user-1', { kind: 'collection', objectId: 'missing-col' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects pinning another user review', async () => {
    await expect(
      service.upsert('user-1', { kind: 'review', objectId: 'review-other' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects pinning another user collection', async () => {
    const collections = new FakeCollections([
      {
        id: 'col-other',
        ownerId: 'user-2',
        title: 'Other',
        description: null,
        visibility: 'public',
        type: 'manual',
        ruleKey: null,
        bannerKey: null,
        coverKey: null,
        color: null,
        tags: [],
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ]);
    const otherService = new ProfilePinsService(
      pins,
      users,
      new FakeGames([]) as unknown as GameRepository,
      new FakeReviews([]) as unknown as ReviewRepository,
      collections as unknown as CollectionRepository,
      achievements as unknown as AchievementRepository,
    );
    await expect(
      otherService.upsert('user-1', { kind: 'collection', objectId: 'col-other' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deletes an existing pin', async () => {
    await service.upsert('user-1', { kind: 'collection', objectId: 'col-1', position: 1 });
    await service.delete('user-1', { kind: 'collection', objectId: 'col-1' });
    expect(await service.listMine('user-1')).toHaveLength(0);
  });

  it('returns 404 when deleting a missing pin', async () => {
    await expect(
      service.delete('user-1', { kind: 'game', objectId: 'game-1' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 for deleted users', async () => {
    users.rows.set(
      'user-1',
      makeUser({
        id: 'user-1',
        handle: 'gamer',
        displayName: 'Gamer',
        deletedAt: new Date(),
      }),
    );
    await expect(service.listMine('user-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  describe('9.5d — achievement (badge) pins', () => {
    it('equips an unlocked achievement', async () => {
      const pin = await service.upsert('user-1', {
        kind: 'achievement',
        objectId: 'ach-1',
        position: 0,
      });
      expect(pin).toMatchObject({ kind: 'achievement', objectId: 'ach-1', position: 0 });
      expect(await service.listMine('user-1')).toHaveLength(1);
    });

    it('rejects equipping an achievement that does not exist — hits the achievement repository, not the collection one', async () => {
      await expect(
        service.upsert('user-1', { kind: 'achievement', objectId: 'missing-ach' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects equipping an achievement that is not yet awarded', async () => {
      await expect(
        service.upsert('user-1', { kind: 'achievement', objectId: 'ach-locked' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('enforces the three-badge limit at the boundary — a fourth equip is rejected, a third is not', async () => {
      await service.upsert('user-1', { kind: 'achievement', objectId: 'ach-1', position: 0 });
      await service.upsert('user-1', { kind: 'achievement', objectId: 'ach-2', position: 1 });
      await service.upsert('user-1', { kind: 'achievement', objectId: 'ach-3', position: 2 });
      expect(await service.listMine('user-1')).toHaveLength(ACHIEVEMENT_PIN_LIMIT);

      await expect(
        service.upsert('user-1', { kind: 'achievement', objectId: 'ach-4', position: 2 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('re-positioning an already-equipped badge does not count against the limit', async () => {
      await service.upsert('user-1', { kind: 'achievement', objectId: 'ach-1', position: 0 });
      await service.upsert('user-1', { kind: 'achievement', objectId: 'ach-2', position: 1 });
      await service.upsert('user-1', { kind: 'achievement', objectId: 'ach-3', position: 2 });
      // Same objectId, different slot — an update, not a fourth pin.
      const repositioned = await service.upsert('user-1', {
        kind: 'achievement',
        objectId: 'ach-1',
        position: 2,
      });
      expect(repositioned.position).toBe(2);
      expect(await service.listMine('user-1')).toHaveLength(ACHIEVEMENT_PIN_LIMIT);
    });

    it('read path filters out a pin whose achievement is no longer awarded, without erroring', async () => {
      await service.upsert('user-1', { kind: 'achievement', objectId: 'ach-1', position: 0 });
      // Simulate a stale row: the achievement's progress regresses (e.g. the
      // achievement definition changed) after the pin was created — the pin
      // row itself is never deleted by that, only the read path notices.
      achievements = new FakeAchievements(
        [makeAchievement({ id: 'ach-1' })],
        [
          makeProgress({
            id: 'p1',
            achievementId: 'ach-1',
            userId: 'user-1',
            state: 'in_progress',
          }),
        ],
      );
      service = new ProfilePinsService(
        pins,
        users,
        new FakeGames([]) as unknown as GameRepository,
        new FakeReviews([]) as unknown as ReviewRepository,
        new FakeCollections([]) as unknown as CollectionRepository,
        achievements as unknown as AchievementRepository,
      );
      expect(await service.listMine('user-1')).toHaveLength(0);
    });

    it('rejects an organisation account equipping a badge, and read path omits any legacy achievement pin an org account holds', async () => {
      users.rows.set(
        'org-1',
        makeUser({
          id: 'org-1',
          handle: 'studio',
          displayName: 'Studio',
          accountKind: 'organisation',
        }),
      );
      await expect(
        service.upsert('org-1', { kind: 'achievement', objectId: 'ach-1' }),
      ).rejects.toBeInstanceOf(BadRequestException);

      // A row that exists anyway (e.g. written before this gate existed, or
      // by direct DB access) must still never render — read path is
      // authoritative, not just the write-time gate.
      await pins.upsert({ userId: 'org-1', kind: 'achievement', objectId: 'ach-1', position: 0 });
      expect(await service.listMine('org-1')).toHaveLength(0);
    });

    it('public listForViewer applies the identical earned/organisation filtering as listMine', async () => {
      await service.upsert('user-1', { kind: 'achievement', objectId: 'ach-1', position: 0 });
      const viewed = await service.listForViewer('user-1');
      expect(viewed).toMatchObject([{ kind: 'achievement', objectId: 'ach-1' }]);
    });
  });
});
