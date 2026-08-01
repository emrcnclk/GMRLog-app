import type { Follow, FollowRepository, Prisma, User } from '@gmrlog/database';

/**
 * In-memory Follow repository fake — test support only (build-excluded).
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

export function makeFollow(overrides: Partial<Follow> = {}): Follow {
  return {
    id: 'follow-1',
    followerId: 'user-1',
    followeeId: 'user-2',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
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

export interface FakeFollowRepository extends FollowRepository {
  rows: Map<string, Follow>;
}

export function createFakeFollowRepository(seed: Follow[] = []): FakeFollowRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));

  const findByPair = (followerId: string, followeeId: string): Promise<Follow | null> =>
    Promise.resolve(
      [...rows.values()].find(
        (row) => row.followerId === followerId && row.followeeId === followeeId,
      ) ?? null,
    );

  return {
    rows,
    create: (data: Prisma.FollowCreateInput) => {
      const followerId = connectId(data.follower);
      const followeeId = connectId(data.followee);
      if (!followerId || !followeeId) {
        return Promise.reject(new Error('follower and followee required'));
      }
      const follow = makeFollow({
        id: nextId('follow'),
        followerId,
        followeeId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      rows.set(follow.id, follow);
      return Promise.resolve(follow);
    },
    findByPair,
    exists: async (followerId, followeeId) => (await findByPair(followerId, followeeId)) !== null,
    listFollowers: (followeeId) =>
      Promise.resolve(
        [...rows.values()]
          .filter((row) => row.followeeId === followeeId)
          .sort((a, b) => {
            const byTime = a.createdAt.getTime() - b.createdAt.getTime();
            return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
          }),
      ),
    listFollowing: (followerId) =>
      Promise.resolve(
        [...rows.values()]
          .filter((row) => row.followerId === followerId)
          .sort((a, b) => {
            const byTime = a.createdAt.getTime() - b.createdAt.getTime();
            return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
          }),
      ),
    delete: (id) => {
      const existing = rows.get(id);
      if (!existing) {
        return Promise.reject(new Error(`follow ${id} not found`));
      }
      rows.delete(id);
      return Promise.resolve(existing);
    },
    deleteByPair: async (followerId, followeeId) => {
      const existing = await findByPair(followerId, followeeId);
      if (!existing) {
        return null;
      }
      rows.delete(existing.id);
      return existing;
    },
  };
}
