import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import type {
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

import { ProfilePinsService } from './profile-pins.service';
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

let users: FakeUserRepository;
let pins: FakePins;
let service: ProfilePinsService;

beforeEach(() => {
  users = createFakeUserRepository([
    makeUser({ id: 'user-1', handle: 'gamer', displayName: 'Gamer' }),
  ]);
  pins = new FakePins();
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
});
