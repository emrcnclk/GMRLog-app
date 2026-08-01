import type {
  Game,
  GameLog,
  GameLogRepository,
  GameRepository,
  LibraryEntry,
  LibraryEntryListFilter,
  LibraryEntryRepository,
  LibraryStatus,
  Prisma,
  WishlistMetadata,
  WishlistPriority,
  WishlistWaitStatus,
} from '@gmrlog/database';

import { GAME_CATALOG_DEFAULTS } from '../../games/game-catalog.defaults';

/**
 * In-memory repository fakes implementing the `@gmrlog/database` contracts.
 * Test support only — excluded from the build output.
 */

const notSupported = (): never => {
  throw new Error('not supported by this fake');
};

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${String(idCounter)}`;
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

export function makeLibraryEntry(overrides: Partial<LibraryEntry> = {}): LibraryEntry {
  return {
    id: 'entry-1',
    userId: 'user-1',
    gameId: 'game-1',
    status: 'playing',
    source: 'manual',
    platformId: null,
    note: null,
    version: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function connectId(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || !('connect' in value)) {
    return undefined;
  }
  const connect = (value as { connect?: { id?: string } }).connect;
  return typeof connect?.id === 'string' ? connect.id : undefined;
}

function resolveVersion(current: number, data: Prisma.LibraryEntryUpdateInput): number {
  const versionUpdate = data.version;
  if (typeof versionUpdate !== 'object') {
    return current;
  }
  const increment = Reflect.get(versionUpdate, 'increment');
  return typeof increment === 'number' ? current + increment : current;
}

export interface FakeLibraryEntryRepository extends LibraryEntryRepository {
  rows: Map<string, LibraryEntry>;
}

export function createFakeLibraryEntryRepository(
  seed: LibraryEntry[] = [],
): FakeLibraryEntryRepository {
  const rows = new Map(seed.map((entry) => [entry.id, entry]));
  return {
    rows,
    create: (data) => {
      const userId = connectId(data.user);
      const gameId = connectId(data.game);
      if (!userId || !gameId) {
        return Promise.reject(new Error('user and game required'));
      }
      const duplicate = [...rows.values()].find(
        (entry) => entry.userId === userId && entry.gameId === gameId,
      );
      if (duplicate) {
        return Promise.reject(new Error('unique (userId, gameId) violated'));
      }
      const entry = makeLibraryEntry({
        id: nextId('entry'),
        userId,
        gameId,
        status: data.status,
        source: data.source,
        platformId: connectId(data.platform) ?? null,
        note: typeof data.note === 'string' || data.note === null ? data.note : null,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      rows.set(entry.id, entry);
      return Promise.resolve(entry);
    },
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findByUserAndGame: (userId, gameId) =>
      Promise.resolve(
        [...rows.values()].find((entry) => entry.userId === userId && entry.gameId === gameId) ??
          null,
      ),
    listByUser: (userId, filter: LibraryEntryListFilter = {}) => {
      const listed = [...rows.values()]
        .filter((entry) => entry.userId === userId)
        .filter((entry) => (filter.status === undefined ? true : entry.status === filter.status))
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      return Promise.resolve(listed);
    },
    listByGame: (gameId) =>
      Promise.resolve(
        [...rows.values()]
          .filter((entry) => entry.gameId === gameId)
          .sort(
            (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime() || a.id.localeCompare(b.id),
          ),
      ),
    countByUserGroupedByStatus: (userId) => {
      const counts = new Map<LibraryStatus, number>();
      for (const entry of rows.values()) {
        if (entry.userId !== userId) continue;
        counts.set(entry.status, (counts.get(entry.status) ?? 0) + 1);
      }
      return Promise.resolve(counts);
    },
    update: (id, data) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`entry ${id} not found`));
      }
      const next: LibraryEntry = {
        ...current,
        status: typeof data.status === 'string' ? data.status : current.status,
        note:
          data.note === undefined
            ? current.note
            : typeof data.note === 'string' || data.note === null
              ? data.note
              : current.note,
        platformId:
          data.platform === undefined
            ? current.platformId
            : (connectId(data.platform) ?? current.platformId),
        version: resolveVersion(current.version, data),
        updatedAt: new Date(),
      };
      rows.set(id, next);
      return Promise.resolve(next);
    },
    delete: (id) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`entry ${id} not found`));
      }
      rows.delete(id);
      return Promise.resolve(current);
    },
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
    findBySlug: (slug) =>
      Promise.resolve([...rows.values()].find((game) => game.slug === slug) ?? null),
    list: notSupported,
    update: notSupported,
    delete: notSupported,
  };
}

export interface FakeGameLogRepository extends GameLogRepository {
  rows: GameLog[];
}

export function createFakeGameLogRepository(): FakeGameLogRepository {
  const rows: GameLog[] = [];
  return {
    rows,
    create: (data: Prisma.GameLogCreateInput) => {
      const libraryEntryId = connectId(data.libraryEntry);
      if (!libraryEntryId) {
        return Promise.reject(new Error('libraryEntry required'));
      }
      const log: GameLog = {
        id: nextId('log'),
        libraryEntryId,
        kind: data.kind,
        occurredAt: data.occurredAt instanceof Date ? data.occurredAt : new Date(data.occurredAt),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      rows.push(log);
      return Promise.resolve(log);
    },
    listByLibraryEntry: (libraryEntryId) =>
      Promise.resolve(rows.filter((log) => log.libraryEntryId === libraryEntryId)),
    deleteByLibraryEntry: (libraryEntryId) => {
      const before = rows.length;
      for (let i = rows.length - 1; i >= 0; i -= 1) {
        if (rows[i]?.libraryEntryId === libraryEntryId) {
          rows.splice(i, 1);
        }
      }
      return Promise.resolve(before - rows.length);
    },
  };
}

/** In-memory Prisma slice for wishlistMetadata — test support only. */
export interface FakeWishlistPrisma {
  wishlistMetadata: {
    findUnique: (args: { where: { libraryEntryId: string } }) => Promise<WishlistMetadata | null>;
    findMany: (args: {
      where: { libraryEntryId: { in: string[] } };
    }) => Promise<WishlistMetadata[]>;
    create: (args: {
      data: {
        libraryEntry: { connect: { id: string } };
        priority?: WishlistPriority;
        waitStatus?: WishlistWaitStatus;
        notes?: string | null;
      };
    }) => Promise<WishlistMetadata>;
    update: (args: {
      where: { libraryEntryId: string };
      data: {
        priority?: WishlistPriority;
        waitStatus?: WishlistWaitStatus;
        notes?: string | null;
      };
    }) => Promise<WishlistMetadata>;
  };
  rows: Map<string, WishlistMetadata>;
}

export function createFakeWishlistPrisma(seed: WishlistMetadata[] = []): FakeWishlistPrisma {
  const rows = new Map(seed.map((row) => [row.libraryEntryId, row]));
  return {
    rows,
    wishlistMetadata: {
      findUnique: ({ where }) => Promise.resolve(rows.get(where.libraryEntryId) ?? null),
      findMany: ({ where }) =>
        Promise.resolve(
          where.libraryEntryId.in
            .map((id) => rows.get(id))
            .filter((row): row is WishlistMetadata => row !== undefined),
        ),
      create: ({ data }) => {
        const libraryEntryId = data.libraryEntry.connect.id;
        const row: WishlistMetadata = {
          id: nextId('wmeta'),
          libraryEntryId,
          priority: data.priority ?? 'medium',
          waitStatus: data.waitStatus ?? 'none',
          notes: data.notes ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        rows.set(libraryEntryId, row);
        return Promise.resolve(row);
      },
      update: ({ where, data }) => {
        const current = rows.get(where.libraryEntryId);
        if (!current) {
          return Promise.reject(new Error('wishlist metadata not found'));
        }
        const next: WishlistMetadata = {
          ...current,
          priority: data.priority ?? current.priority,
          waitStatus: data.waitStatus ?? current.waitStatus,
          notes: data.notes !== undefined ? data.notes : current.notes,
          updatedAt: new Date(),
        };
        rows.set(where.libraryEntryId, next);
        return Promise.resolve(next);
      },
    },
  };
}
