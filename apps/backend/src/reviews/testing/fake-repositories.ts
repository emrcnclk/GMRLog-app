import type {
  Game,
  GameRepository,
  Prisma,
  Review,
  ReviewRepository,
  User,
  UserRepository,
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

function connectId(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || !('connect' in value)) {
    return undefined;
  }
  const connect = (value as { connect?: { id?: string } }).connect;
  return typeof connect?.id === 'string' ? connect.id : undefined;
}

function resolveVersion(current: number, data: Prisma.ReviewUpdateInput): number {
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

export function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 'review-1',
    authorId: 'user-1',
    gameId: 'game-1',
    rating: 8,
    body: 'Great game',
    containsSpoilers: false,
    visibility: 'public',
    version: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

export interface FakeReviewRepository extends ReviewRepository {
  rows: Map<string, Review>;
}

export function createFakeReviewRepository(seed: Review[] = []): FakeReviewRepository {
  const rows = new Map(seed.map((review) => [review.id, review]));
  const active = (): Review[] => [...rows.values()].filter((r) => r.deletedAt === null);
  return {
    rows,
    create: (data) => {
      const authorId = connectId(data.author);
      const gameId = connectId(data.game);
      if (!authorId || !gameId) {
        return Promise.reject(new Error('author and game required'));
      }
      const review = makeReview({
        id: nextId('review'),
        authorId,
        gameId,
        rating: data.rating,
        body: typeof data.body === 'string' || data.body === null ? data.body : null,
        containsSpoilers: data.containsSpoilers ?? false,
        visibility: data.visibility,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });
      rows.set(review.id, review);
      return Promise.resolve(review);
    },
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findActiveById: (id) => {
      const review = rows.get(id);
      return Promise.resolve(review?.deletedAt === null ? review : null);
    },
    findActiveByAuthorAndGame: (authorId, gameId) =>
      Promise.resolve(
        active().find((review) => review.authorId === authorId && review.gameId === gameId) ?? null,
      ),
    listByGame: (gameId) =>
      Promise.resolve(
        active()
          .filter((review) => review.gameId === gameId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      ),
    countByGame: (gameId) =>
      Promise.resolve(active().filter((review) => review.gameId === gameId).length),
    listByAuthor: (authorId) =>
      Promise.resolve(active().filter((review) => review.authorId === authorId)),
    update: (id, data) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`review ${id} not found`));
      }
      const next: Review = {
        ...current,
        rating: typeof data.rating === 'number' ? data.rating : current.rating,
        body:
          data.body === undefined
            ? current.body
            : typeof data.body === 'string' || data.body === null
              ? data.body
              : current.body,
        containsSpoilers:
          typeof data.containsSpoilers === 'boolean'
            ? data.containsSpoilers
            : current.containsSpoilers,
        visibility: typeof data.visibility === 'string' ? data.visibility : current.visibility,
        version: resolveVersion(current.version, data),
        updatedAt: new Date(),
      };
      rows.set(id, next);
      return Promise.resolve(next);
    },
    softDelete: (id) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`review ${id} not found`));
      }
      const next: Review = { ...current, deletedAt: new Date(), updatedAt: new Date() };
      rows.set(id, next);
      return Promise.resolve(next);
    },
    delete: (id) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`review ${id} not found`));
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
    findBySlug: notSupported,
    list: notSupported,
    update: notSupported,
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
