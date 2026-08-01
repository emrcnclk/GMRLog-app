import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import type { RequestIdentity } from '../auth/interfaces/identity';
import type { PrismaService } from '../infrastructure/database/prisma.service';
import {
  createFakeFollowRepository,
  makeFollow,
  type FakeFollowRepository,
} from '../follows/testing/fake-repositories';

import { CollectionEntriesService } from './collection-entries.service';
import { CollectionsService } from './collections.service';
import type { DynamicCollectionResolver } from './dynamic-collection.resolver';
import {
  createFakeCollectionEntryRepository,
  createFakeCollectionPrisma,
  createFakeCollectionRepository,
  createFakeDynamicCollectionResolver,
  createFakeGameRepository,
  createFakeUserRepository,
  makeGame,
  makeUser,
  type FakeCollectionEntryRepository,
  type FakeCollectionPrisma,
  type FakeCollectionRepository,
  type FakeGameRepository,
  type FakeUserRepository,
} from './testing/fake-repositories';

const player: RequestIdentity = { class: 'player', userId: 'user-1' };
const guest: RequestIdentity = { class: 'guest' };
const other: RequestIdentity = { class: 'player', userId: 'user-2' };

let collections: FakeCollectionRepository;
let entries: FakeCollectionEntryRepository;
let games: FakeGameRepository;
let users: FakeUserRepository;
let follows: FakeFollowRepository;
let prisma: FakeCollectionPrisma;
let dynamicResolver: ReturnType<typeof createFakeDynamicCollectionResolver>;
let collectionsService: CollectionsService;
let entriesService: CollectionEntriesService;

beforeEach(() => {
  users = createFakeUserRepository([
    makeUser({ id: 'user-1', handle: 'gamer' }),
    makeUser({ id: 'user-2', handle: 'other' }),
  ]);
  games = createFakeGameRepository([
    makeGame({ id: 'game-1', title: 'Hollow Knight', slug: 'hollow-knight' }),
    makeGame({ id: 'game-2', title: 'Celeste', slug: 'celeste' }),
    makeGame({ id: 'game-3', title: 'Dark Souls', slug: 'dark-souls' }),
  ]);
  collections = createFakeCollectionRepository();
  entries = createFakeCollectionEntryRepository();
  follows = createFakeFollowRepository();
  prisma = createFakeCollectionPrisma();
  dynamicResolver = createFakeDynamicCollectionResolver(
    new Map([
      ['soulslike', ['game-3', 'game-1']],
      ['cozy_games', ['game-2']],
    ]),
  );
  collectionsService = new CollectionsService(
    collections,
    entries,
    users,
    games,
    follows,
    prisma as unknown as PrismaService,
    dynamicResolver as unknown as DynamicCollectionResolver,
  );
  entriesService = new CollectionEntriesService(collections, entries, games, collectionsService);
});

describe('CollectionsService', () => {
  it('creates a public collection and lists own index', async () => {
    const created = await collectionsService.createCollection('user-1', {
      title: 'Shelf',
      description: 'Culture picks',
    });
    expect(created).toMatchObject({
      title: 'Shelf',
      visibility: 'public',
      owner: { id: 'user-1' },
      entries: [],
      type: 'manual',
      followerCount: 0,
      tags: [],
    });
    expect(await collectionsService.listCollections('user-1')).toHaveLength(1);
  });

  it('lists only public collections for another owner', async () => {
    await collectionsService.createCollection('user-2', {
      title: 'Public',
      visibility: 'public',
    });
    await collectionsService.createCollection('user-2', {
      title: 'Secret',
      visibility: 'private',
    });
    const listed = await collectionsService.listCollections('user-1', { ownerId: 'user-2' });
    expect(listed).toHaveLength(1);
    expect(listed[0]?.title).toBe('Public');
  });

  it('hides private collections from guests and non-owners', async () => {
    const created = await collectionsService.createCollection('user-1', {
      title: 'Secret',
      visibility: 'private',
    });
    await expect(collectionsService.getCollection(created.id, guest)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(collectionsService.getCollection(created.id, other)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(collectionsService.getCollection(created.id, player)).resolves.toMatchObject({
      id: created.id,
    });
  });

  it('resolves followers visibility via FollowRepository.exists', async () => {
    const created = await collectionsService.createCollection('user-1', {
      title: 'Circle',
      visibility: 'followers',
    });
    await expect(collectionsService.getCollection(created.id, other)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    follows.rows.set(
      'edge',
      makeFollow({ id: 'edge', followerId: 'user-2', followeeId: 'user-1' }),
    );
    await expect(collectionsService.getCollection(created.id, other)).resolves.toMatchObject({
      visibility: 'followers',
    });
  });

  it('enforces ownership on update and soft-delete', async () => {
    const created = await collectionsService.createCollection('user-1', { title: 'Mine' });
    await expect(
      collectionsService.updateCollection(created.id, 'user-2', { title: 'Hack' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await collectionsService.deleteCollection(created.id, 'user-1');
    expect(await collections.findActiveById(created.id)).toBeNull();
    await expect(collectionsService.getCollection(created.id, player)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('CollectionsService D3.22 Collection++', () => {
  it('persists type, ruleKey, color, and tags on create', async () => {
    const created = await collectionsService.createCollection('user-1', {
      title: 'Souls Shelf',
      type: 'dynamic',
      ruleKey: 'soulslike',
      color: '#112233',
      tags: ['souls', 'hard'],
    });
    expect(created.type).toBe('dynamic');
    expect(created.ruleKey).toBe('soulslike');
    expect(created.color).toBe('#112233');
    expect(created.tags).toEqual(['souls', 'hard']);
  });

  it('rejects dynamic create without ruleKey', async () => {
    await expect(
      collectionsService.createCollection('user-1', {
        title: 'Broken',
        type: 'dynamic',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('patches Collection++ fields', async () => {
    const created = await collectionsService.createCollection('user-1', { title: 'Base' });
    const patched = await collectionsService.updateCollection(created.id, 'user-1', {
      color: '#abcdef',
      tags: ['indie'],
      type: 'curated',
    });
    expect(patched.color).toBe('#abcdef');
    expect(patched.tags).toEqual(['indie']);
    expect(patched.type).toBe('curated');
  });

  it('projects dynamic membership via DynamicCollectionResolver', async () => {
    const created = await collectionsService.createCollection('user-1', {
      title: 'Souls',
      type: 'dynamic',
      ruleKey: 'soulslike',
    });
    const detail = await collectionsService.getCollection(created.id, player);
    expect(detail.entries.map((e) => e.gameId)).toEqual(['game-3', 'game-1']);
    expect(detail.entries.map((e) => e.position)).toEqual([0, 1]);
    expect(detail.entries[0]?.game?.title).toBe('Dark Souls');
  });

  it('uses stored entries for non-dynamic types', async () => {
    const created = await collectionsService.createCollection('user-1', {
      title: 'Manual',
      type: 'manual',
    });
    await entriesService.replaceEntries(created.id, 'user-1', {
      entries: [{ gameId: 'game-2' }],
    });
    const detail = await collectionsService.getCollection(created.id, player);
    expect(detail.entries.map((e) => e.gameId)).toEqual(['game-2']);
  });

  it('follows a collection and projects followerCount', async () => {
    const created = await collectionsService.createCollection('user-1', {
      title: 'Public Picks',
      visibility: 'public',
    });
    await collectionsService.followCollection('user-2', created.id);
    const detail = await collectionsService.getCollection(created.id, player);
    expect(detail.followerCount).toBe(1);
  });

  it('follow is idempotent and rejects self-follow', async () => {
    const created = await collectionsService.createCollection('user-1', {
      title: 'Public',
      visibility: 'public',
    });
    await collectionsService.followCollection('user-2', created.id);
    await collectionsService.followCollection('user-2', created.id);
    expect(prisma.rows.size).toBe(1);

    await expect(collectionsService.followCollection('user-1', created.id)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('unfollows and 404s when no edge exists', async () => {
    const created = await collectionsService.createCollection('user-1', {
      title: 'Public',
      visibility: 'public',
    });
    await collectionsService.followCollection('user-2', created.id);
    await collectionsService.unfollowCollection('user-2', created.id);
    expect(prisma.rows.size).toBe(0);
    await expect(
      collectionsService.unfollowCollection('user-2', created.id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists collection followers', async () => {
    const created = await collectionsService.createCollection('user-1', {
      title: 'Public',
      visibility: 'public',
    });
    await collectionsService.followCollection('user-2', created.id);
    const followers = await collectionsService.listFollowers(created.id, player);
    expect(followers).toHaveLength(1);
    expect(followers[0]?.handle).toBe('other');
  });

  it('clones a collection as manual with title copy and entries', async () => {
    const created = await collectionsService.createCollection('user-1', {
      title: 'Original',
      description: 'Desc',
      tags: ['a'],
      visibility: 'public',
    });
    await entriesService.replaceEntries(created.id, 'user-1', {
      entries: [{ gameId: 'game-1', note: 'keep' }, { gameId: 'game-2' }],
    });

    const cloned = await collectionsService.cloneCollection('user-2', created.id);
    expect(cloned.title).toBe('Original (copy)');
    expect(cloned.description).toBe('Desc');
    expect(cloned.tags).toEqual(['a']);
    expect(cloned.type).toBe('manual');
    expect(cloned.owner.id).toBe('user-2');
    expect(cloned.visibility).toBe('private');
    expect(cloned.entries.map((e) => e.gameId)).toEqual(['game-1', 'game-2']);
    expect(cloned.entries[0]?.note).toBe('keep');
  });

  it('clones dynamic membership into a manual shelf', async () => {
    const created = await collectionsService.createCollection('user-1', {
      title: 'Dyn',
      type: 'dynamic',
      ruleKey: 'cozy_games',
      visibility: 'public',
    });
    const cloned = await collectionsService.cloneCollection('user-2', created.id);
    expect(cloned.type).toBe('manual');
    expect(cloned.ruleKey).toBeNull();
    expect(cloned.entries.map((e) => e.gameId)).toEqual(['game-2']);
  });

  it('treats unique follow races as idempotent and skips deleted followers', async () => {
    const created = await collectionsService.createCollection('user-1', {
      title: 'Race',
      visibility: 'public',
    });
    prisma.collectionFollower.findUnique = async () => null;
    prisma.collectionFollower.create = async () => {
      throw Object.assign(new Error('unique'), { code: 'P2002' });
    };
    await expect(
      collectionsService.followCollection('user-2', created.id),
    ).resolves.toBeUndefined();

    users.rows.set(
      'user-gone',
      makeUser({ id: 'user-gone', handle: 'gone', deletedAt: new Date() }),
    );
    prisma.collectionFollower.findMany = async () => [
      { userId: 'user-2' },
      { userId: 'user-gone' },
    ];
    const followers = await collectionsService.listFollowers(created.id, player);
    expect(followers.map((row) => row.id)).toEqual(['user-2']);
  });

  it('returns empty followers without loading users', async () => {
    const created = await collectionsService.createCollection('user-1', {
      title: 'Quiet',
      visibility: 'public',
    });
    await expect(collectionsService.listFollowers(created.id, guest)).resolves.toEqual([]);
  });
});

describe('CollectionEntriesService', () => {
  it('replaces entries in array order and preserves positions', async () => {
    const created = await collectionsService.createCollection('user-1', { title: 'Ordered' });
    const replaced = await entriesService.replaceEntries(created.id, 'user-1', {
      entries: [{ gameId: 'game-2', note: 'Second first' }, { gameId: 'game-1' }],
    });
    expect(replaced.entries.map((e) => e.gameId)).toEqual(['game-2', 'game-1']);
    expect(replaced.entries.map((e) => e.position)).toEqual([0, 1]);
    expect(replaced.entries[0]?.note).toBe('Second first');
  });

  it('rejects duplicate games, missing games, and non-owner replace', async () => {
    const created = await collectionsService.createCollection('user-1', { title: 'Dup' });

    await expect(
      entriesService.replaceEntries(created.id, 'user-1', {
        entries: [{ gameId: 'game-1' }, { gameId: 'game-1' }],
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    await expect(
      entriesService.replaceEntries(created.id, 'user-1', {
        entries: [{ gameId: 'missing' }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    await expect(
      entriesService.replaceEntries(created.id, 'user-2', {
        entries: [{ gameId: 'game-1' }],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
