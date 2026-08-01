import type {
  FriendRequest,
  Friendship,
  FriendshipRepository,
  FriendRequestListParams,
  Prisma,
  PresenceRepository,
  PresenceStatus,
  UserPresence,
} from '@gmrlog/database';
import { friendshipPairIds } from '@gmrlog/database';

/**
 * In-memory friendship / presence fakes — test support only (build-excluded).
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

export function makeFriendRequest(overrides: Partial<FriendRequest> = {}): FriendRequest {
  return {
    id: 'request-1',
    senderId: 'user-1',
    receiverId: 'user-2',
    status: 'pending',
    message: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    respondedAt: null,
    ...overrides,
  };
}

export function makeFriendship(overrides: Partial<Friendship> = {}): Friendship {
  const userLowId = overrides.userLowId ?? 'user-1';
  const userHighId = overrides.userHighId ?? 'user-2';
  return {
    id: 'friendship-1',
    userLowId,
    userHighId,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function makePresence(overrides: Partial<UserPresence> = {}): UserPresence {
  return {
    userId: 'user-1',
    status: 'offline',
    lastSeenAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export interface FakeFriendshipRepository extends FriendshipRepository {
  requests: Map<string, FriendRequest>;
  friendships: Map<string, Friendship>;
}

export function createFakeFriendshipRepository(
  seed: { requests?: FriendRequest[]; friendships?: Friendship[] } = {},
): FakeFriendshipRepository {
  const requests = new Map((seed.requests ?? []).map((row) => [row.id, row]));
  const friendships = new Map((seed.friendships ?? []).map((row) => [row.id, row]));

  const findFriendship = (userA: string, userB: string): Promise<Friendship | null> => {
    const pair = friendshipPairIds(userA, userB);
    return Promise.resolve(
      [...friendships.values()].find(
        (row) => row.userLowId === pair.userLowId && row.userHighId === pair.userHighId,
      ) ?? null,
    );
  };

  const listFriendIds = (userId: string): Promise<string[]> =>
    Promise.resolve(
      [...friendships.values()]
        .filter((row) => row.userLowId === userId || row.userHighId === userId)
        .map((row) => (row.userLowId === userId ? row.userHighId : row.userLowId)),
    );

  const applyCreatedAtCursor = <T extends { createdAt: Date; id: string }>(
    list: T[],
    params: FriendRequestListParams,
  ): T[] => {
    let filtered = [...list].sort((a, b) => {
      const byTime = b.createdAt.getTime() - a.createdAt.getTime();
      return byTime !== 0 ? byTime : b.id.localeCompare(a.id);
    });
    if (params.cursor !== undefined) {
      const cursor = params.cursor;
      const cursorTime = cursor.createdAt.getTime();
      filtered = filtered.filter((row) => {
        const time = row.createdAt.getTime();
        return time < cursorTime || (time === cursorTime && row.id < cursor.id);
      });
    }
    return filtered.slice(0, params.limit);
  };

  return {
    requests,
    friendships,
    createRequest: (data: Prisma.FriendRequestCreateInput) => {
      const senderId = connectId(data.sender);
      const receiverId = connectId(data.receiver);
      if (!senderId || !receiverId) {
        return Promise.reject(new Error('sender and receiver required'));
      }
      const request = makeFriendRequest({
        id: nextId('request'),
        senderId,
        receiverId,
        status: 'pending',
        message: typeof data.message === 'string' ? data.message : null,
        createdAt: new Date(),
        updatedAt: new Date(),
        respondedAt: null,
      });
      requests.set(request.id, request);
      return Promise.resolve(request);
    },
    findRequestById: (id) => Promise.resolve(requests.get(id) ?? null),
    findPendingBetween: (senderId, receiverId) =>
      Promise.resolve(
        [...requests.values()].find(
          (row) =>
            row.senderId === senderId && row.receiverId === receiverId && row.status === 'pending',
        ) ?? null,
      ),
    listIncoming: (receiverId, params) => {
      const list = [...requests.values()].filter(
        (row) => row.receiverId === receiverId && row.status === 'pending',
      );
      return Promise.resolve(applyCreatedAtCursor(list, params));
    },
    listOutgoing: (senderId, params) => {
      const list = [...requests.values()].filter(
        (row) => row.senderId === senderId && row.status === 'pending',
      );
      return Promise.resolve(applyCreatedAtCursor(list, params));
    },
    updateRequest: (id, data) => {
      const current = requests.get(id);
      if (current == null) {
        return Promise.reject(new Error(`request ${id} not found`));
      }
      let nextStatus = current.status;
      if (typeof data.status === 'string') {
        nextStatus = data.status;
      } else if (
        typeof data.status === 'object' &&
        'set' in data.status &&
        typeof data.status.set === 'string'
      ) {
        nextStatus = data.status.set;
      }
      let nextRespondedAt = current.respondedAt;
      if (data.respondedAt instanceof Date) {
        nextRespondedAt = data.respondedAt;
      } else if (data.respondedAt === null) {
        nextRespondedAt = null;
      }
      const next: FriendRequest = {
        ...current,
        status: nextStatus,
        respondedAt: nextRespondedAt,
        updatedAt: new Date(),
      };
      requests.set(id, next);
      return Promise.resolve(next);
    },
    createFriendship: async (userA, userB) => {
      const pair = friendshipPairIds(userA, userB);
      const existing = await findFriendship(userA, userB);
      if (existing != null) {
        return existing;
      }
      const friendship = makeFriendship({
        id: nextId('friendship'),
        userLowId: pair.userLowId,
        userHighId: pair.userHighId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      friendships.set(friendship.id, friendship);
      return friendship;
    },
    findFriendship,
    listFriendships: (userId, params) => {
      const list = [...friendships.values()].filter(
        (row) => row.userLowId === userId || row.userHighId === userId,
      );
      return Promise.resolve(applyCreatedAtCursor(list, params));
    },
    deleteFriendship: async (userA, userB) => {
      const existing = await findFriendship(userA, userB);
      if (existing == null) {
        return null;
      }
      friendships.delete(existing.id);
      return existing;
    },
    countFriends: (userId) =>
      Promise.resolve(
        [...friendships.values()].filter(
          (row) => row.userLowId === userId || row.userHighId === userId,
        ).length,
      ),
    countMutualFriends: async (userA, userB) => {
      const [aIds, bIds] = await Promise.all([listFriendIds(userA), listFriendIds(userB)]);
      const bSet = new Set(bIds);
      return aIds.filter((id) => id !== userB && bSet.has(id)).length;
    },
    listFriendIds,
    searchFriends: (userId, query, limit) => {
      const trimmed = query.trim().toLowerCase();
      const list = [...friendships.values()].filter(
        (row) => row.userLowId === userId || row.userHighId === userId,
      );
      if (trimmed.length === 0) {
        return Promise.resolve(applyCreatedAtCursor(list, { limit }));
      }
      return Promise.resolve(applyCreatedAtCursor(list, { limit }));
    },
  };
}

export interface FakePresenceRepository extends PresenceRepository {
  rows: Map<string, UserPresence>;
}

export function createFakePresenceRepository(seed: UserPresence[] = []): FakePresenceRepository {
  const rows = new Map(seed.map((row) => [row.userId, row]));
  return {
    rows,
    upsert: (userId, status: PresenceStatus) => {
      const now = new Date();
      const next = makePresence({
        userId,
        status,
        lastSeenAt: now,
        updatedAt: now,
      });
      rows.set(userId, next);
      return Promise.resolve(next);
    },
    findByUserId: (userId) => Promise.resolve(rows.get(userId) ?? null),
    findManyByUserIds: (userIds) =>
      Promise.resolve(
        userIds.map((id) => rows.get(id)).filter((row): row is UserPresence => row !== undefined),
      ),
  };
}
