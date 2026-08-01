import type { ActivityItem, FeedEntry, Prisma, User } from '@prisma/client';

import type { DatabaseClient } from './types';

export interface ActivityListCursor {
  occurredAt: Date;
  id: string;
}

export interface ActivityListParams {
  limit: number;
  cursor?: ActivityListCursor;
  from?: Date;
  to?: Date;
}

export interface ActivityFeedRow {
  activityItem: ActivityItem;
  actor: User | null;
}

export interface HomeFeedRow {
  feedEntryId: string;
  activityItem: ActivityItem;
  actor: User | null;
}

/**
 * Activity persistence (S2 §10.9). Feed projection reads only — no ranking or generation.
 */
export interface ActivityRepository {
  create(data: Prisma.ActivityItemCreateInput): Promise<ActivityItem>;
  findById(id: string): Promise<ActivityItem | null>;
  createFeedEntry(data: Prisma.FeedEntryCreateInput): Promise<FeedEntry>;
  /** User home feed rows — newest `occurredAt` first. Includes feed entry id. */
  listHomeFeed(userId: string, params: ActivityListParams): Promise<HomeFeedRow[]>;
  /** User activity center rows — newest `occurredAt` first. */
  listForUser(userId: string, params: ActivityListParams): Promise<ActivityFeedRow[]>;
  /** Activity rows for the given actors — newest `occurredAt` first (friends activity). */
  listByActorIds(
    actorIds: readonly string[],
    params: ActivityListParams,
  ): Promise<ActivityFeedRow[]>;
}

export class PrismaActivityRepository implements ActivityRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.ActivityItemCreateInput): Promise<ActivityItem> {
    return this.db.activityItem.create({ data });
  }

  findById(id: string): Promise<ActivityItem | null> {
    return this.db.activityItem.findUnique({ where: { id } });
  }

  createFeedEntry(data: Prisma.FeedEntryCreateInput): Promise<FeedEntry> {
    return this.db.feedEntry.create({ data });
  }

  async listHomeFeed(userId: string, params: ActivityListParams): Promise<HomeFeedRow[]> {
    const occurredAtFilter: Prisma.DateTimeFilter = {};
    if (params.from !== undefined) {
      occurredAtFilter.gte = params.from;
    }
    if (params.to !== undefined) {
      occurredAtFilter.lte = params.to;
    }

    const activityItemWhere: Prisma.ActivityItemWhereInput = {
      ...(Object.keys(occurredAtFilter).length > 0 ? { occurredAt: occurredAtFilter } : {}),
      ...(params.cursor !== undefined
        ? {
            OR: [
              { occurredAt: { lt: params.cursor.occurredAt } },
              { occurredAt: params.cursor.occurredAt, id: { lt: params.cursor.id } },
            ],
          }
        : {}),
    };

    const rows = await this.db.feedEntry.findMany({
      where: {
        userId,
        activityItem: activityItemWhere,
      },
      include: {
        activityItem: {
          include: { actor: true },
        },
      },
      orderBy: [{ activityItem: { occurredAt: 'desc' } }, { activityItem: { id: 'desc' } }],
      take: params.limit,
    });

    return rows.map((row) => ({
      feedEntryId: row.id,
      activityItem: row.activityItem,
      actor: row.activityItem.actor,
    }));
  }

  async listForUser(userId: string, params: ActivityListParams): Promise<ActivityFeedRow[]> {
    const rows = await this.listHomeFeed(userId, params);
    return rows.map(({ activityItem, actor }) => ({ activityItem, actor }));
  }

  async listByActorIds(
    actorIds: readonly string[],
    params: ActivityListParams,
  ): Promise<ActivityFeedRow[]> {
    if (actorIds.length === 0) {
      return [];
    }

    const occurredAtFilter: Prisma.DateTimeFilter = {};
    if (params.from !== undefined) {
      occurredAtFilter.gte = params.from;
    }
    if (params.to !== undefined) {
      occurredAtFilter.lte = params.to;
    }

    const rows = await this.db.activityItem.findMany({
      where: {
        actorId: { in: [...actorIds] },
        ...(Object.keys(occurredAtFilter).length > 0 ? { occurredAt: occurredAtFilter } : {}),
        ...(params.cursor !== undefined
          ? {
              OR: [
                { occurredAt: { lt: params.cursor.occurredAt } },
                { occurredAt: params.cursor.occurredAt, id: { lt: params.cursor.id } },
              ],
            }
          : {}),
      },
      include: { actor: true },
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      take: params.limit,
    });

    return rows.map((row) => ({
      activityItem: row,
      actor: row.actor,
    }));
  }
}
