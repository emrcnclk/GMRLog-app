import type {
  Game,
  GameRepository,
  Prisma,
  TierList,
  TierListRepository,
  TierSlot,
  TierSlotBoardRow,
  TierSlotGame,
  TierSlotRepository,
  TierSlotWrite,
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

function resolveVersion(current: number, data: Prisma.TierListUpdateInput): number {
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

export function makeTierList(overrides: Partial<TierList> = {}): TierList {
  return {
    id: 'tier-1',
    ownerId: 'user-1',
    title: 'Ranks',
    visibility: 'public',
    version: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

export interface FakeTierListRepository extends TierListRepository {
  rows: Map<string, TierList>;
}

export function createFakeTierListRepository(seed: TierList[] = []): FakeTierListRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));
  const active = (): TierList[] => [...rows.values()].filter((t) => t.deletedAt === null);
  return {
    rows,
    create: (data) => {
      const ownerId = connectId(data.owner);
      if (!ownerId) {
        return Promise.reject(new Error('owner required'));
      }
      const tierList = makeTierList({
        id: nextId('tier'),
        ownerId,
        title: data.title,
        visibility: data.visibility,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });
      rows.set(tierList.id, tierList);
      return Promise.resolve(tierList);
    },
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findActiveById: (id) => {
      const tierList = rows.get(id);
      return Promise.resolve(tierList?.deletedAt === null ? tierList : null);
    },
    listByOwner: (ownerId) =>
      Promise.resolve(
        active()
          .filter((t) => t.ownerId === ownerId)
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
      ),
    listPublicByOwner: (ownerId) =>
      Promise.resolve(
        active()
          .filter((t) => t.ownerId === ownerId && t.visibility === 'public')
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
      ),
    /** Slots live in a separate fake; without a join seed this returns []. */
    listPublicContainingGame: () => Promise.resolve([]),
    update: (id, data: Prisma.TierListUpdateInput) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`tier list ${id} not found`));
      }
      const next: TierList = {
        ...current,
        title: typeof data.title === 'string' ? data.title : current.title,
        visibility:
          data.visibility === 'public' ||
          data.visibility === 'followers' ||
          data.visibility === 'private'
            ? data.visibility
            : current.visibility,
        version: resolveVersion(current.version, data),
        updatedAt: new Date(),
      };
      rows.set(id, next);
      return Promise.resolve(next);
    },
    softDelete: (id) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`tier list ${id} not found`));
      }
      const next: TierList = { ...current, deletedAt: new Date(), updatedAt: new Date() };
      rows.set(id, next);
      return Promise.resolve(next);
    },
    delete: notSupported,
  };
}

export interface FakeTierSlotRepository extends TierSlotRepository {
  boards: Map<string, TierSlotBoardRow[]>;
}

export function createFakeTierSlotRepository(
  seed: Map<string, TierSlotBoardRow[]> = new Map<string, TierSlotBoardRow[]>(),
): FakeTierSlotRepository {
  const boards = new Map<string, TierSlotBoardRow[]>(seed);
  return {
    boards,
    listSlots: (tierListId) => Promise.resolve(boards.get(tierListId) ?? []),
    replaceSlots: (tierListId, slots: TierSlotWrite[]) => {
      const rows: TierSlotBoardRow[] = slots.map((slot) => {
        const slotRow: TierSlot = {
          id: nextId('slot'),
          tierListId,
          label: slot.label,
          position: slot.position,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const games: TierSlotGame[] = slot.games.map((game) => ({
          id: nextId('slot-game'),
          tierSlotId: slotRow.id,
          gameId: game.gameId,
          position: game.position,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        return { slot: slotRow, games };
      });
      boards.set(tierListId, rows);
      return Promise.resolve(rows);
    },
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
