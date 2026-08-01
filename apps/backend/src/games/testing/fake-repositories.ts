import type {
  Game,
  GameDetailRecord,
  GameRepository,
  LibraryEntry,
  LibraryEntryRepository,
  Platform,
  Prisma,
} from '@gmrlog/database';

import { GAME_CATALOG_DEFAULTS } from '../game-catalog.defaults';

/**
 * In-memory repository fakes — test support only (build-excluded).
 */

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

export function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 'game-1',
    title: 'Hollow Knight',
    slug: 'hollow-knight',
    coverKey: 'covers/hollow-knight.jpg',
    releaseDate: new Date('2017-02-24T00:00:00.000Z'),
    featured: false,
    popularity: 0,
    franchiseId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...GAME_CATALOG_DEFAULTS,
    ...overrides,
  };
}

export function makePlatform(overrides: Partial<Platform> = {}): Platform {
  return {
    id: 'platform-1',
    name: 'PC',
    slug: 'pc',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export interface FakeGameRepository extends GameRepository {
  rows: Map<string, Game>;
  details: Map<string, GameDetailRecord>;
}

export function createFakeGameRepository(
  seed: { game: Game; detail?: GameDetailRecord }[] = [],
): FakeGameRepository {
  const rows = new Map(seed.map((row) => [row.game.id, row.game]));
  const details = new Map(
    seed.map((row) => [
      row.game.id,
      row.detail ?? {
        game: row.game,
        platforms: [],
        ratingAverage: null,
        ratingCount: 0,
        libraryCount: 0,
      },
    ]),
  );

  return {
    rows,
    details,
    create: (data: Prisma.GameCreateInput) => {
      const game = makeGame({
        id: nextId('game'),
        title: data.title,
        slug: data.slug,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      rows.set(game.id, game);
      details.set(game.id, {
        game,
        platforms: [],
        ratingAverage: null,
        ratingCount: 0,
        libraryCount: 0,
      });
      return Promise.resolve(game);
    },
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findDetailById: (id) => Promise.resolve(details.get(id) ?? null),
    findManyByIds: (ids) =>
      Promise.resolve(
        ids.flatMap((id) => {
          const row = rows.get(id);
          return row !== undefined ? [row] : [];
        }),
      ),
    findBySlug: (slug) =>
      Promise.resolve([...rows.values()].find((row) => row.slug === slug) ?? null),
    list: () => Promise.resolve([...rows.values()]),
    update: (id, data) => {
      const existing = rows.get(id);
      if (existing === undefined) {
        return Promise.reject(new Error('Game not found'));
      }
      const updated = {
        ...existing,
        ...(typeof data.title === 'string' ? { title: data.title } : {}),
        ...(typeof data.slug === 'string' ? { slug: data.slug } : {}),
        updatedAt: new Date(),
      };
      rows.set(id, updated);
      const detail = details.get(id);
      if (detail !== undefined) {
        details.set(id, { ...detail, game: updated });
      }
      return Promise.resolve(updated);
    },
    delete: (id) => {
      const existing = rows.get(id);
      if (existing === undefined) {
        return Promise.reject(new Error('Game not found'));
      }
      rows.delete(id);
      details.delete(id);
      return Promise.resolve(existing);
    },
  };
}

export interface FakeLibraryEntryRepository extends LibraryEntryRepository {
  rows: Map<string, LibraryEntry>;
}

export function createFakeLibraryEntryRepository(
  seed: LibraryEntry[] = [],
): FakeLibraryEntryRepository {
  const rows = new Map(seed.map((row) => [`${row.userId}:${row.gameId}`, row]));

  return {
    rows,
    create: (data: Prisma.LibraryEntryCreateInput) => {
      const userId = connectId(data.user);
      const gameId = connectId(data.game);
      if (!userId || !gameId) {
        return Promise.reject(new Error('user and game required'));
      }
      const entry: LibraryEntry = {
        id: nextId('library'),
        userId,
        gameId,
        status: data.status,
        source: data.source,
        platformId: connectId(data.platform) ?? null,
        note: typeof data.note === 'string' ? data.note : null,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      rows.set(`${userId}:${gameId}`, entry);
      return Promise.resolve(entry);
    },
    findById: (id) => Promise.resolve([...rows.values()].find((row) => row.id === id) ?? null),
    findByUserAndGame: (userId, gameId) => Promise.resolve(rows.get(`${userId}:${gameId}`) ?? null),
    listByUser: (userId, filter) =>
      Promise.resolve(
        [...rows.values()].filter(
          (row) =>
            row.userId === userId && (filter?.status === undefined || row.status === filter.status),
        ),
      ),
    listByGame: (gameId) =>
      Promise.resolve(
        [...rows.values()]
          .filter((row) => row.gameId === gameId)
          .sort(
            (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime() || a.id.localeCompare(b.id),
          ),
      ),
    countByUserGroupedByStatus: (userId) => {
      const counts = new Map<LibraryEntry['status'], number>();
      for (const row of rows.values()) {
        if (row.userId === userId) {
          counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
        }
      }
      return Promise.resolve(counts);
    },
    update: (id, data) => {
      const existing = [...rows.values()].find((row) => row.id === id);
      if (existing === undefined) {
        return Promise.reject(new Error('Library entry not found'));
      }
      const updated = {
        ...existing,
        ...(data.status !== undefined ? { status: data.status as LibraryEntry['status'] } : {}),
        updatedAt: new Date(),
      };
      rows.set(`${updated.userId}:${updated.gameId}`, updated);
      return Promise.resolve(updated);
    },
    delete: (id) => {
      const existing = [...rows.values()].find((row) => row.id === id);
      if (existing === undefined) {
        return Promise.reject(new Error('Library entry not found'));
      }
      rows.delete(`${existing.userId}:${existing.gameId}`);
      return Promise.resolve(existing);
    },
  };
}
