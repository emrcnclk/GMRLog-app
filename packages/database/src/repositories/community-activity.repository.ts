import type { ActivityItem, ActivityKind, CommunityActivity, Prisma, User } from '@prisma/client';

import type { ActivityListParams } from './activity.repository';
import type { DatabaseClient } from './types';

export interface CommunityActivityFeedRow {
  communityActivityId: string;
  activityItem: ActivityItem;
  actor: User | null;
}

export interface CommunityActivityListParams extends ActivityListParams {
  /** Optional ActivityKind filter for community feed tabs (D3.24). */
  kinds?: readonly ActivityKind[];
}

/**
 * Community-scoped activity persistence (S2 §10.9). Links communities to
 * ActivityItem rows — no feed ranking or generation.
 */
export interface CommunityActivityRepository {
  create(data: Prisma.CommunityActivityCreateInput): Promise<CommunityActivity>;
  listByCommunity(
    communityId: string,
    params: CommunityActivityListParams,
  ): Promise<CommunityActivityFeedRow[]>;
}

export class PrismaCommunityActivityRepository implements CommunityActivityRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.CommunityActivityCreateInput): Promise<CommunityActivity> {
    return this.db.communityActivity.create({ data });
  }

  async listByCommunity(
    communityId: string,
    params: CommunityActivityListParams,
  ): Promise<CommunityActivityFeedRow[]> {
    const occurredAtFilter: Prisma.DateTimeFilter = {};
    if (params.from !== undefined) {
      occurredAtFilter.gte = params.from;
    }
    if (params.to !== undefined) {
      occurredAtFilter.lte = params.to;
    }

    const activityItemWhere: Prisma.ActivityItemWhereInput = {
      ...(Object.keys(occurredAtFilter).length > 0 ? { occurredAt: occurredAtFilter } : {}),
      ...(params.kinds !== undefined && params.kinds.length > 0
        ? { kind: { in: [...params.kinds] } }
        : {}),
      ...(params.cursor !== undefined
        ? {
            OR: [
              { occurredAt: { lt: params.cursor.occurredAt } },
              { occurredAt: params.cursor.occurredAt, id: { lt: params.cursor.id } },
            ],
          }
        : {}),
    };

    const rows = await this.db.communityActivity.findMany({
      where: {
        communityId,
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
      communityActivityId: row.id,
      activityItem: row.activityItem,
      actor: row.activityItem.actor,
    }));
  }
}
