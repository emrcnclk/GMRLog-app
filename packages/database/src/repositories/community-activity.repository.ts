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
  /**
   * 3b.1e — `postsToday`/`activeNow` (BACKEND_CHANGES.md §6), one `groupBy` per
   * page rather than a query per card, the same batching rule 3b.1a already
   * established for member counts. The caller picks the cutoff: the current
   * UTC day's start for `postsToday`, now minus 3 hours for `activeNow`.
   * Communities with no matching activity are absent from the map, not zero.
   */
  countPostActivityByCommunityIdsSince(
    communityIds: readonly string[],
    since: Date,
  ): Promise<Map<string, number>>;
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

  async countPostActivityByCommunityIdsSince(
    communityIds: readonly string[],
    since: Date,
  ): Promise<Map<string, number>> {
    if (communityIds.length === 0) {
      return new Map();
    }
    const rows = await this.db.communityActivity.groupBy({
      by: ['communityId'],
      where: {
        communityId: { in: [...communityIds] },
        activityItem: { kind: 'post', occurredAt: { gte: since } },
      },
      _count: { _all: true },
    });
    return new Map(rows.map((row) => [row.communityId, row._count._all]));
  }
}
