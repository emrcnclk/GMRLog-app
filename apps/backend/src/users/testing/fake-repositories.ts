import type {
  ConnectedAccount,
  ConnectedAccountRepository,
  Prisma,
  User,
  UserRepository,
  UserSettings,
  UserSettingsRepository,
} from '@gmrlog/database';

/**
 * In-memory repository fakes implementing the `@gmrlog/database` contracts.
 * Test support only — excluded from the build output.
 */

const notSupported = (): never => {
  throw new Error('not supported by this fake');
};

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

export function makeConnectedAccount(overrides: Partial<ConnectedAccount> = {}): ConnectedAccount {
  return {
    id: 'account-1',
    userId: 'user-1',
    provider: 'steam',
    status: 'connected',
    linkedAt: new Date('2026-02-01T00:00:00.000Z'),
    scopes: ['profile'],
    createdAt: new Date('2026-02-01T00:00:00.000Z'),
    updatedAt: new Date('2026-02-01T00:00:00.000Z'),
    ...overrides,
  };
}

/** The service only writes plain scalar values — mirror that subset. */
function toPlainUserPatch(data: Prisma.UserUpdateInput): Partial<User> {
  const patch: Partial<User> = {};
  if (typeof data.displayName === 'string') {
    patch.displayName = data.displayName;
  }
  if (typeof data.bio === 'string' || data.bio === null) {
    patch.bio = data.bio;
  }
  if (typeof data.avatarKey === 'string' || data.avatarKey === null) {
    patch.avatarKey = data.avatarKey;
  }
  if (typeof data.bannerKey === 'string' || data.bannerKey === null) {
    patch.bannerKey = data.bannerKey;
  }
  return patch;
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
    findByHandle: (handle) =>
      Promise.resolve([...rows.values()].find((user) => user.handle === handle) ?? null),
    update: (id, data) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`user ${id} not found`));
      }
      const next: User = { ...current, ...toPlainUserPatch(data), updatedAt: new Date() };
      rows.set(id, next);
      return Promise.resolve(next);
    },
    softDelete: notSupported,
    delete: notSupported,
  };
}

export interface FakeUserSettingsRepository extends UserSettingsRepository {
  rows: Map<string, UserSettings>;
}

export function createFakeUserSettingsRepository(): FakeUserSettingsRepository {
  const rows = new Map<string, UserSettings>();
  return {
    rows,
    findByUser: (userId) => Promise.resolve(rows.get(userId) ?? null),
    upsertByUser: (userId, data) => {
      const current = rows.get(userId) ?? {
        id: `settings-${userId}`,
        userId,
        locale: null,
        theme: null,
        reduceMotion: false,
        profileVisibility: 'public' as const,
        accent: 'neutral' as const,
        cardStyle: 'elevated' as const,
        bannerStyle: 'artwork' as const,
        favoritePlatform: null,
        consoleGeneration: null,
        widgetOrder: [],
        pinnedWidgets: [],
        hiddenWidgets: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const next: UserSettings = {
        ...current,
        locale: data.locale !== undefined ? data.locale : current.locale,
        theme: data.theme !== undefined ? data.theme : current.theme,
        reduceMotion: data.reduceMotion ?? current.reduceMotion,
        profileVisibility: data.profileVisibility ?? current.profileVisibility,
        accent: data.accent ?? current.accent,
        cardStyle: data.cardStyle ?? current.cardStyle,
        bannerStyle: data.bannerStyle ?? current.bannerStyle,
        favoritePlatform:
          data.favoritePlatform !== undefined ? data.favoritePlatform : current.favoritePlatform,
        consoleGeneration:
          data.consoleGeneration !== undefined ? data.consoleGeneration : current.consoleGeneration,
        widgetOrder: data.widgetOrder ?? current.widgetOrder,
        pinnedWidgets: data.pinnedWidgets ?? current.pinnedWidgets,
        hiddenWidgets: data.hiddenWidgets ?? current.hiddenWidgets,
        updatedAt: new Date(),
      };
      rows.set(userId, next);
      return Promise.resolve(next);
    },
  };
}

export interface FakeConnectedAccountRepository extends ConnectedAccountRepository {
  rows: ConnectedAccount[];
}

export function createFakeConnectedAccountRepository(
  seed: ConnectedAccount[] = [],
): FakeConnectedAccountRepository {
  const rows = [...seed];
  return {
    rows,
    create: notSupported,
    findById: (id) => Promise.resolve(rows.find((account) => account.id === id) ?? null),
    findByUserAndProvider: (userId, provider) =>
      Promise.resolve(
        rows.find((account) => account.userId === userId && account.provider === provider) ?? null,
      ),
    listByUser: (userId) => Promise.resolve(rows.filter((account) => account.userId === userId)),
    update: notSupported,
    delete: notSupported,
  };
}
