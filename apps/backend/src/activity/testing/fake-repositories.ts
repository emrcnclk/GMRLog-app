import type {
  ActivityFeedRow,
  ActivityItem,
  ActivityListParams,
  ActivityRepository,
  HomeFeedRow,
  Prisma,
  User,
} from '@gmrlog/database';

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

export function makeActivityItem(overrides: Partial<ActivityItem> = {}): ActivityItem {
  return {
    id: 'activity-1',
    kind: 'post',
    actorId: 'actor-1',
    objectType: 'post',
    objectId: 'post-1',
    occurredAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function makeActor(overrides: Partial<User> = {}): User {
  return {
    id: 'actor-1',
    handle: 'actor',
    displayName: 'Actor',
    bio: null,
    avatarKey: null,
    bannerKey: null,
    avatarBlurhash: null,
    avatarVariants: null,
    bannerBlurhash: null,
    bannerVariants: null,
    privacyId: null,
    firstName: null,
    lastName: null,
    birthDate: null,
    countryCode: null,
    creatorFeatured: false,
    accountKind: 'individual',
    cardNumber: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

export interface FakeActivityRepository extends ActivityRepository {
  items: Map<string, ActivityItem>;
  feedUserIds: Map<string, string>;
  feedEntryIds: Map<string, string>;
  actors: Map<string, User>;
}

export function createFakeActivityRepository(
  seed: { item: ActivityItem; userId: string; feedEntryId?: string; actor?: User }[] = [],
): FakeActivityRepository {
  const items = new Map(seed.map((row) => [row.item.id, row.item]));
  const feedUserIds = new Map(seed.map((row) => [row.item.id, row.userId]));
  const feedEntryIds = new Map(
    seed.map((row, index) => [row.item.id, row.feedEntryId ?? `feed-${String(index + 1)}`]),
  );
  const actors = new Map<string, User>();
  for (const row of seed) {
    if (row.actor !== undefined) {
      actors.set(row.item.actorId ?? row.actor.id, row.actor);
    }
  }

  const filterFeedItems = (userId: string, params: ActivityListParams): ActivityItem[] => {
    let list = [...items.values()]
      .filter((item) => feedUserIds.get(item.id) === userId)
      .sort((a, b) => {
        const byTime = b.occurredAt.getTime() - a.occurredAt.getTime();
        return byTime !== 0 ? byTime : b.id.localeCompare(a.id);
      });

    if (params.from !== undefined) {
      const fromTime = params.from.getTime();
      list = list.filter((item) => item.occurredAt.getTime() >= fromTime);
    }
    if (params.to !== undefined) {
      const toTime = params.to.getTime();
      list = list.filter((item) => item.occurredAt.getTime() <= toTime);
    }
    if (params.cursor !== undefined) {
      const cursor = params.cursor;
      const cursorTime = cursor.occurredAt.getTime();
      list = list.filter((item) => {
        const time = item.occurredAt.getTime();
        return time < cursorTime || (time === cursorTime && item.id < cursor.id);
      });
    }

    return list;
  };

  return {
    items,
    feedUserIds,
    feedEntryIds,
    actors,
    create: (data: Prisma.ActivityItemCreateInput) => {
      const actorId = connectId(data.actor);
      const item = makeActivityItem({
        id: nextId('activity'),
        kind: data.kind,
        objectType: data.objectType,
        objectId: data.objectId,
        actorId: actorId ?? null,
        occurredAt: (() => {
          if (data.occurredAt instanceof Date) {
            return data.occurredAt;
          }
          if (typeof data.occurredAt === 'string') {
            return new Date(data.occurredAt);
          }
          return new Date();
        })(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      items.set(item.id, item);
      return Promise.resolve(item);
    },
    findById: (id) => Promise.resolve(items.get(id) ?? null),
    createFeedEntry: (data: Prisma.FeedEntryCreateInput) => {
      const userId = connectId(data.user);
      const activityItemId = connectId(data.activityItem);
      if (!userId || !activityItemId) {
        return Promise.reject(new Error('user and activityItem required'));
      }
      const feedEntryId = nextId('feed');
      feedUserIds.set(activityItemId, userId);
      feedEntryIds.set(activityItemId, feedEntryId);
      return Promise.resolve({
        id: feedEntryId,
        userId,
        activityItemId,
        rank: typeof data.rank === 'number' ? data.rank : 0,
        insertedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    },
    listHomeFeed: (userId, params: ActivityListParams) => {
      const page = filterFeedItems(userId, params).slice(0, params.limit);
      const rows: HomeFeedRow[] = page.map((activityItem) => ({
        feedEntryId: feedEntryIds.get(activityItem.id) ?? activityItem.id,
        activityItem,
        actor: activityItem.actorId !== null ? (actors.get(activityItem.actorId) ?? null) : null,
      }));
      return Promise.resolve(rows);
    },
    listForUser: (userId, params: ActivityListParams) => {
      const page = filterFeedItems(userId, params).slice(0, params.limit);
      const rows: ActivityFeedRow[] = page.map((activityItem) => ({
        activityItem,
        actor: activityItem.actorId !== null ? (actors.get(activityItem.actorId) ?? null) : null,
      }));
      return Promise.resolve(rows);
    },
    listByActorIds: (actorIds, params: ActivityListParams) => {
      const idSet = new Set(actorIds);
      let list = [...items.values()]
        .filter((item) => item.actorId !== null && idSet.has(item.actorId))
        .sort((a, b) => {
          const byTime = b.occurredAt.getTime() - a.occurredAt.getTime();
          return byTime !== 0 ? byTime : b.id.localeCompare(a.id);
        });
      if (params.from !== undefined) {
        const fromTime = params.from.getTime();
        list = list.filter((item) => item.occurredAt.getTime() >= fromTime);
      }
      if (params.to !== undefined) {
        const toTime = params.to.getTime();
        list = list.filter((item) => item.occurredAt.getTime() <= toTime);
      }
      if (params.cursor !== undefined) {
        const cursor = params.cursor;
        const cursorTime = cursor.occurredAt.getTime();
        list = list.filter((item) => {
          const time = item.occurredAt.getTime();
          return time < cursorTime || (time === cursorTime && item.id < cursor.id);
        });
      }
      const page = list.slice(0, params.limit);
      const rows: ActivityFeedRow[] = page.map((activityItem) => ({
        activityItem,
        actor: activityItem.actorId !== null ? (actors.get(activityItem.actorId) ?? null) : null,
      }));
      return Promise.resolve(rows);
    },
  };
}

/** Minimal fake — create/createFeedEntry succeed without tracking feed state. */
export function createNoOpActivityRepository(): ActivityRepository {
  return {
    create: (data: Prisma.ActivityItemCreateInput) => {
      const actorId = connectId(data.actor);
      return Promise.resolve(
        makeActivityItem({
          id: nextId('activity'),
          kind: data.kind,
          objectType: data.objectType,
          objectId: data.objectId,
          actorId: actorId ?? null,
          occurredAt: (() => {
            if (data.occurredAt instanceof Date) {
              return data.occurredAt;
            }
            if (typeof data.occurredAt === 'string') {
              return new Date(data.occurredAt);
            }
            return new Date();
          })(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );
    },
    findById: () => Promise.resolve(null),
    createFeedEntry: (data: Prisma.FeedEntryCreateInput) => {
      const userId = connectId(data.user);
      const activityItemId = connectId(data.activityItem);
      return Promise.resolve({
        id: nextId('feed'),
        userId: userId ?? '',
        activityItemId: activityItemId ?? '',
        rank: typeof data.rank === 'number' ? data.rank : 0,
        insertedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    },
    listHomeFeed: () => Promise.resolve([]),
    listForUser: () => Promise.resolve([]),
    listByActorIds: () => Promise.resolve([]),
  };
}
