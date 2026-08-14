import type {
  Achievement,
  AchievementProgress,
  AchievementRepository,
  AchievementState,
  ActivityItem,
  ActivityRepository,
  FeedEntry,
  Notification,
  NotificationRepository,
  PlayerMetricSnapshot,
  PlayerMetricsRepository,
} from '@gmrlog/database';
import type { LibraryStatus } from '@prisma/client';

/**
 * In-memory fakes for D3.21 achievement tests.
 */

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${String(idCounter)}`;
}

export function emptySnapshot(overrides: Partial<PlayerMetricSnapshot> = {}): PlayerMetricSnapshot {
  return {
    libraryByStatus: new Map<LibraryStatus, number>(),
    libraryTotal: 0,
    libraryEntries: [],
    sessionLogCount: 0,
    sessionOccurredAts: [],
    reviews: [],
    posts: [],
    commentCount: 0,
    followerCount: 0,
    followingCount: 0,
    friendCount: 0,
    communityCount: 0,
    collections: [],
    tierListCount: 0,
    achievementAwardedCount: 0,
    eventParticipationCount: 0,
    genreCounts: new Map(),
    platformCounts: new Map(),
    franchiseCounts: new Map(),
    activeDayCount: 0,
    hasAvatar: false,
    hasBio: false,
    hasBanner: false,
    joinedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

/**
 * 9.3 — the facts `countHoldersByAchievementIds`/`countEligiblePlayers` need
 * about a user that plain `AchievementProgress` rows don't carry. A user
 * absent from this map is treated as an eligible, individual, active player
 * with library activity, so existing tests that never seed it keep behaving
 * exactly as before.
 */
export interface FakeAchievementUserFacts {
  accountKind: 'individual' | 'organisation';
  deletedAt: Date | null;
  hasLibraryActivity: boolean;
}

export interface FakeAchievementRepository extends AchievementRepository {
  definitions: Map<string, Achievement>;
  progress: Map<string, AchievementProgress>;
  userFacts: Map<string, FakeAchievementUserFacts>;
}

export function createFakeAchievementRepository(
  seed: Achievement[] = [],
): FakeAchievementRepository {
  const definitions = new Map(seed.map((row) => [row.id, row]));
  const progress = new Map<string, AchievementProgress>();
  const userFacts = new Map<string, FakeAchievementUserFacts>();
  const key = (achievementId: string, userId: string): string => `${achievementId}:${userId}`;
  const isEligibleHolder = (userId: string): boolean => {
    const facts = userFacts.get(userId);
    return facts === undefined || (facts.accountKind === 'individual' && facts.deletedAt === null);
  };

  return {
    definitions,
    progress,
    userFacts,
    async listDefinitions(): Promise<Achievement[]> {
      return [...definitions.values()].sort((a, b) => a.key.localeCompare(b.key));
    },
    async findByKey(lookup: string): Promise<Achievement | null> {
      return [...definitions.values()].find((row) => row.key === lookup) ?? null;
    },
    async findById(id: string): Promise<Achievement | null> {
      return definitions.get(id) ?? null;
    },
    async upsertDefinition(data): Promise<Achievement> {
      const existing = [...definitions.values()].find((row) => row.key === data.key);
      const row: Achievement = {
        id: existing?.id ?? nextId('ach'),
        key: data.key,
        title: data.title,
        description: data.description,
        criteriaRef: data.criteriaRef,
        category: data.category,
        isHidden: data.isHidden ?? false,
        isRare: data.isRare ?? false,
        target: data.target,
        createdAt: existing?.createdAt ?? new Date(),
        updatedAt: new Date(),
      };
      definitions.set(row.id, row);
      return row;
    },
    async listProgressByUser(userId: string): Promise<AchievementProgress[]> {
      return [...progress.values()].filter((row) => row.userId === userId);
    },
    async findProgress(achievementId: string, userId: string): Promise<AchievementProgress | null> {
      return progress.get(key(achievementId, userId)) ?? null;
    },
    async upsertProgress(data): Promise<AchievementProgress> {
      const idKey = key(data.achievementId, data.userId);
      const existing = progress.get(idKey);
      const row: AchievementProgress = {
        id: existing?.id ?? nextId('prog'),
        achievementId: data.achievementId,
        userId: data.userId,
        current: data.current,
        target: data.target,
        state: data.state,
        awardedAt: data.awardedAt === undefined ? (existing?.awardedAt ?? null) : data.awardedAt,
        createdAt: existing?.createdAt ?? new Date(),
        updatedAt: new Date(),
      };
      progress.set(idKey, row);
      return row;
    },
    async countAwarded(userId: string): Promise<number> {
      return [...progress.values()].filter(
        (row) => row.userId === userId && row.state === ('awarded' satisfies AchievementState),
      ).length;
    },
    async countHoldersByAchievementIds(achievementIds: string[]): Promise<Map<string, number>> {
      const counts = new Map(achievementIds.map((id) => [id, 0]));
      for (const row of progress.values()) {
        if (
          row.state === ('awarded' satisfies AchievementState) &&
          counts.has(row.achievementId) &&
          isEligibleHolder(row.userId)
        ) {
          counts.set(row.achievementId, (counts.get(row.achievementId) ?? 0) + 1);
        }
      }
      return counts;
    },
    async countEligiblePlayers(): Promise<number> {
      if (userFacts.size === 0) {
        // No facts seeded — fall back to the distinct users who have any
        // progress row, since that's the only population these tests know
        // about and mirrors "an eligible player is one who could act".
        return new Set([...progress.values()].map((row) => row.userId)).size;
      }
      return [...userFacts.values()].filter(
        (facts) =>
          facts.accountKind === 'individual' &&
          facts.deletedAt === null &&
          facts.hasLibraryActivity,
      ).length;
    },
  };
}

export interface FakePlayerMetricsRepository extends PlayerMetricsRepository {
  snapshot: PlayerMetricSnapshot | null;
}

export function createFakePlayerMetricsRepository(
  snapshot: PlayerMetricSnapshot | null,
): FakePlayerMetricsRepository {
  return {
    snapshot,
    async loadSnapshot(): Promise<PlayerMetricSnapshot | null> {
      return this.snapshot;
    },
  };
}

export interface FakeNotificationRepository extends NotificationRepository {
  rows: Notification[];
}

export function createFakeAchievementNotificationRepository(): FakeNotificationRepository {
  const rows: Notification[] = [];
  return {
    rows,
    async create(data): Promise<Notification> {
      const recipientId =
        typeof data.recipient === 'object' && data.recipient !== null && 'connect' in data.recipient
          ? (data.recipient.connect as { id: string }).id
          : 'unknown';
      const row: Notification = {
        id: nextId('notif'),
        recipientId,
        kind: String(data.kind),
        objectType: data.objectType,
        objectId: String(data.objectId),
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      rows.push(row);
      return row;
    },
    async findById(id: string): Promise<Notification | null> {
      return rows.find((row) => row.id === id) ?? null;
    },
    async listByUser(): Promise<Notification[]> {
      return rows;
    },
    async markRead(): Promise<Notification | null> {
      return null;
    },
    async markAllRead(): Promise<number> {
      return 0;
    },
    async markManyRead(): Promise<number> {
      return 0;
    },
    async deleteReadOlderThan(): Promise<number> {
      return 0;
    },
    async delete(): Promise<Notification> {
      throw new Error('not supported');
    },
  };
}

export interface FakeActivityRepository extends ActivityRepository {
  items: ActivityItem[];
  feeds: FeedEntry[];
}

export function createFakeAchievementActivityRepository(): FakeActivityRepository {
  const items: ActivityItem[] = [];
  const feeds: FeedEntry[] = [];
  return {
    items,
    feeds,
    async create(data): Promise<ActivityItem> {
      const actorId =
        typeof data.actor === 'object' && data.actor !== null && 'connect' in data.actor
          ? ((data.actor.connect as { id?: string }).id ?? null)
          : null;
      const row: ActivityItem = {
        id: nextId('act'),
        kind: data.kind,
        actorId,
        objectType: data.objectType,
        objectId: String(data.objectId),
        occurredAt: data.occurredAt as Date,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      items.push(row);
      return row;
    },
    async findById(id: string): Promise<ActivityItem | null> {
      return items.find((row) => row.id === id) ?? null;
    },
    async createFeedEntry(data): Promise<FeedEntry> {
      const userId =
        typeof data.user === 'object' && data.user !== null && 'connect' in data.user
          ? (data.user.connect as { id: string }).id
          : 'unknown';
      const activityItemId =
        typeof data.activityItem === 'object' &&
        data.activityItem !== null &&
        'connect' in data.activityItem
          ? (data.activityItem.connect as { id: string }).id
          : 'unknown';
      const row: FeedEntry = {
        id: nextId('feed'),
        userId,
        activityItemId,
        rank: Number(data.rank),
        insertedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      feeds.push(row);
      return row;
    },
    async listHomeFeed(): Promise<never[]> {
      return [];
    },
    async listForUser(): Promise<never[]> {
      return [];
    },
    async listByActorIds(): Promise<never[]> {
      return [];
    },
  };
}
