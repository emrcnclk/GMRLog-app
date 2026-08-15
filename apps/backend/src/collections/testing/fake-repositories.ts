import type {
  Collection,
  CollectionEntry,
  CollectionEntryRepository,
  CollectionEntryWrite,
  CollectionRepository,
  Game,
  GameRepository,
  Prisma,
  User,
  UserRepository,
} from '@gmrlog/database';

import { GAME_CATALOG_DEFAULTS } from '../../games/game-catalog.defaults';

/**
 * In-memory repository fakes — test support only (build-excluded).
 */

const notSupported = (): never => {
  throw new Error('not supported by this fake');
};

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${String(idCounter)}`;
}

function connectId(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || !('connect' in value)) {
    return undefined;
  }
  const connect = (value as { connect?: { id?: string } }).connect;
  return typeof connect?.id === 'string' ? connect.id : undefined;
}

function resolveVersion(current: number, data: Prisma.CollectionUpdateInput): number {
  const versionUpdate = data.version;
  if (typeof versionUpdate !== 'object') {
    return current;
  }
  const increment = Reflect.get(versionUpdate, 'increment');
  return typeof increment === 'number' ? current + increment : current;
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    handle: 'gamer',
    displayName: 'Gamer',
    bio: null,
    avatarKey: null,
    bannerKey: null,
    avatarBlurhash: null,
    avatarVariants: null,
    bannerBlurhash: null,
    bannerVariants: null,
    privacyId: null,
    creatorFeatured: false,
    accountKind: 'individual',
    cardNumber: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

export function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 'game-1',
    title: 'Hollow Knight',
    slug: 'hollow-knight',
    coverKey: null,
    releaseDate: null,
    featured: false,
    popularity: 0,
    franchiseId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...GAME_CATALOG_DEFAULTS,
    ...overrides,
  };
}

export function makeCollection(overrides: Partial<Collection> = {}): Collection {
  return {
    id: 'collection-1',
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
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

export function makeEntry(overrides: Partial<CollectionEntry> = {}): CollectionEntry {
  return {
    id: 'entry-1',
    collectionId: 'collection-1',
    gameId: 'game-1',
    position: 0,
    note: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export interface FakeCollectionRepository extends CollectionRepository {
  rows: Map<string, Collection>;
}

export function createFakeCollectionRepository(seed: Collection[] = []): FakeCollectionRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));
  const active = (): Collection[] => [...rows.values()].filter((c) => c.deletedAt === null);
  return {
    rows,
    create: (data) => {
      const ownerId = connectId(data.owner);
      if (!ownerId) {
        return Promise.reject(new Error('owner required'));
      }
      const collection = makeCollection({
        id: nextId('collection'),
        ownerId,
        title: data.title,
        description:
          typeof data.description === 'string' || data.description === null
            ? data.description
            : null,
        visibility: data.visibility ?? 'public',
        type:
          data.type === 'manual' ||
          data.type === 'dynamic' ||
          data.type === 'curated' ||
          data.type === 'official'
            ? data.type
            : 'manual',
        ruleKey: typeof data.ruleKey === 'string' || data.ruleKey === null ? data.ruleKey : null,
        color: typeof data.color === 'string' || data.color === null ? data.color : null,
        tags: Array.isArray(data.tags) ? data.tags : [],
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });
      rows.set(collection.id, collection);
      return Promise.resolve(collection);
    },
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findActiveById: (id) => {
      const collection = rows.get(id);
      return Promise.resolve(collection?.deletedAt === null ? collection : null);
    },
    listByOwner: (ownerId) =>
      Promise.resolve(
        active()
          .filter((c) => c.ownerId === ownerId)
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
      ),
    listPublicByOwner: (ownerId) =>
      Promise.resolve(
        active()
          .filter((c) => c.ownerId === ownerId && c.visibility === 'public')
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
      ),
    /** Entries live in a separate fake; without a join seed this returns []. */
    listPublicContainingGame: () => Promise.resolve([]),
    update: (id, data: Prisma.CollectionUpdateInput) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`collection ${id} not found`));
      }
      const next: Collection = {
        ...current,
        title: typeof data.title === 'string' ? data.title : current.title,
        description:
          typeof data.description === 'string' || data.description === null
            ? data.description
            : current.description,
        visibility:
          data.visibility === 'public' ||
          data.visibility === 'followers' ||
          data.visibility === 'private'
            ? data.visibility
            : current.visibility,
        type:
          data.type === 'manual' ||
          data.type === 'dynamic' ||
          data.type === 'curated' ||
          data.type === 'official'
            ? data.type
            : current.type,
        ruleKey:
          typeof data.ruleKey === 'string' || data.ruleKey === null
            ? data.ruleKey
            : current.ruleKey,
        color: typeof data.color === 'string' || data.color === null ? data.color : current.color,
        tags: Array.isArray(data.tags) ? data.tags : current.tags,
        version: resolveVersion(current.version, data),
        updatedAt: new Date(),
      };
      rows.set(id, next);
      return Promise.resolve(next);
    },
    softDelete: (id) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`collection ${id} not found`));
      }
      const next: Collection = { ...current, deletedAt: new Date(), updatedAt: new Date() };
      rows.set(id, next);
      return Promise.resolve(next);
    },
    delete: notSupported,
  };
}

export interface FakeCollectionEntryRepository extends CollectionEntryRepository {
  rows: Map<string, CollectionEntry>;
}

export function createFakeCollectionEntryRepository(
  seed: CollectionEntry[] = [],
): FakeCollectionEntryRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));
  return {
    rows,
    create: (data) => {
      const collectionId = connectId(data.collection);
      const gameId = connectId(data.game);
      if (!collectionId || !gameId) {
        return Promise.reject(new Error('collection and game required'));
      }
      const entry = makeEntry({
        id: nextId('entry'),
        collectionId,
        gameId,
        position: data.position,
        note: typeof data.note === 'string' || data.note === null ? data.note : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      rows.set(entry.id, entry);
      return Promise.resolve(entry);
    },
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findEntry: (collectionId, gameId) =>
      Promise.resolve(
        [...rows.values()].find((e) => e.collectionId === collectionId && e.gameId === gameId) ??
          null,
      ),
    listByCollection: (collectionId) =>
      Promise.resolve(
        [...rows.values()]
          .filter((e) => e.collectionId === collectionId)
          .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id)),
      ),
    addEntry: (data) => {
      const collectionId = connectId(data.collection);
      const gameId = connectId(data.game);
      if (!collectionId || !gameId) {
        return Promise.reject(new Error('collection and game required'));
      }
      const entry = makeEntry({
        id: nextId('entry'),
        collectionId,
        gameId,
        position: data.position,
        note: typeof data.note === 'string' || data.note === null ? data.note : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      rows.set(entry.id, entry);
      return Promise.resolve(entry);
    },
    removeEntry: (collectionId, gameId) => {
      const entry = [...rows.values()].find(
        (e) => e.collectionId === collectionId && e.gameId === gameId,
      );
      if (!entry) {
        return Promise.reject(new Error('entry not found'));
      }
      rows.delete(entry.id);
      return Promise.resolve(entry);
    },
    replaceEntries: (collectionId, entries: CollectionEntryWrite[]) => {
      for (const [id, entry] of [...rows.entries()]) {
        if (entry.collectionId === collectionId) {
          rows.delete(id);
        }
      }
      const created = entries.map((entry) => {
        const row = makeEntry({
          id: nextId('entry'),
          collectionId,
          gameId: entry.gameId,
          position: entry.position,
          note: entry.note ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        rows.set(row.id, row);
        return row;
      });
      return Promise.resolve(created);
    },
    delete: notSupported,
  };
}

export interface FakeUserRepository extends UserRepository {
  rows: Map<string, User>;
}

export function createFakeUserRepository(seed: User[] = []): FakeUserRepository {
  const rows = new Map(seed.map((user) => [user.id, user]));
  return {
    rows,
    create: notSupported,
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findManyByIds: (ids) =>
      Promise.resolve(ids.map((id) => rows.get(id)).filter((u): u is User => u !== undefined)),
    findByHandle: notSupported,
    update: notSupported,
    softDelete: notSupported,
    delete: notSupported,
  };
}

export interface FakeGameRepository extends GameRepository {
  rows: Map<string, Game>;
}

export function createFakeGameRepository(seed: Game[] = []): FakeGameRepository {
  const rows = new Map(seed.map((game) => [game.id, game]));
  return {
    rows,
    create: notSupported,
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findDetailById: (id) => {
      const game = rows.get(id);
      if (game === undefined) {
        return Promise.resolve(null);
      }
      return Promise.resolve({
        game,
        platforms: [],
        ratingAverage: null,
        ratingCount: 0,
        libraryCount: 0,
      });
    },
    findManyByIds: (ids) =>
      Promise.resolve(ids.map((id) => rows.get(id)).filter((g): g is Game => g !== undefined)),
    findBySlug: notSupported,
    list: notSupported,
    update: notSupported,
    delete: notSupported,
  };
}

interface FakeCollectionFollowerRow {
  id: string;
  collectionId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

/** In-memory Prisma slice for collectionFollower — test support only. */
export interface FakeCollectionPrisma {
  collectionFollower: {
    count: (args: { where: { collectionId: string } }) => Promise<number>;
    findUnique: (args: {
      where: { collectionId_userId: { collectionId: string; userId: string } };
      select?: { id: true };
    }) => Promise<{ id: string } | null>;
    create: (args: {
      data: {
        collection: { connect: { id: string } };
        user: { connect: { id: string } };
      };
    }) => Promise<FakeCollectionFollowerRow>;
    deleteMany: (args: {
      where: { collectionId: string; userId: string };
    }) => Promise<{ count: number }>;
    findMany: (args: {
      where: { collectionId: string };
      orderBy?: unknown;
      select?: { userId: true };
    }) => Promise<{ userId: string }[]>;
  };
  rows: Map<string, FakeCollectionFollowerRow>;
}

export function createFakeCollectionPrisma(
  seed: FakeCollectionFollowerRow[] = [],
): FakeCollectionPrisma {
  const rows = new Map(seed.map((row) => [row.id, row]));
  return {
    rows,
    collectionFollower: {
      count: ({ where }) =>
        Promise.resolve(
          [...rows.values()].filter((row) => row.collectionId === where.collectionId).length,
        ),
      findUnique: ({ where }) => {
        const found = [...rows.values()].find(
          (row) =>
            row.collectionId === where.collectionId_userId.collectionId &&
            row.userId === where.collectionId_userId.userId,
        );
        return Promise.resolve(found === undefined ? null : { id: found.id });
      },
      create: ({ data }) => {
        const collectionId = data.collection.connect.id;
        const userId = data.user.connect.id;
        const row: FakeCollectionFollowerRow = {
          id: nextId('cfollow'),
          collectionId,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        rows.set(row.id, row);
        return Promise.resolve(row);
      },
      deleteMany: ({ where }) => {
        let count = 0;
        for (const [id, row] of [...rows.entries()]) {
          if (row.collectionId === where.collectionId && row.userId === where.userId) {
            rows.delete(id);
            count += 1;
          }
        }
        return Promise.resolve({ count });
      },
      findMany: ({ where }) =>
        Promise.resolve(
          [...rows.values()]
            .filter((row) => row.collectionId === where.collectionId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .map((row) => ({ userId: row.userId })),
        ),
    },
  };
}

/** Stub DynamicCollectionResolver for unit tests. */
export function createFakeDynamicCollectionResolver(
  mapping: ReadonlyMap<string, string[]> = new Map(),
): { resolveGameIds: (ruleKey: string | null) => Promise<string[]> } {
  return {
    resolveGameIds: (ruleKey) => {
      if (ruleKey === null) {
        return Promise.resolve([]);
      }
      return Promise.resolve(mapping.get(ruleKey) ?? []);
    },
  };
}
