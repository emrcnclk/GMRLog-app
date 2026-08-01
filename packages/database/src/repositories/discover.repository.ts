import type { Community, Event } from '@prisma/client';

import {
  listDiscoverGames as listDiscoverGamesQuery,
  listDiscoverGamesByIds as listDiscoverGamesByIdsQuery,
  type DiscoverGameRecord,
  type DiscoverGamesListParams,
} from './discover-games.repository';
import type { DatabaseClient } from './types';

/** Keyset cursor for discover lists (`orderedAt` + `id`). */
export interface DiscoverListCursor {
  orderedAt: Date;
  id: string;
}

export interface DiscoverListParams {
  limit: number;
  cursor?: DiscoverListCursor;
}

/**
 * Discover projection reads (S1 §13.5).
 * D3.22 adds ordered id lookups for deterministic ranking surfaces.
 */
export interface DiscoverRepository {
  listDiscoverCommunities(params: DiscoverListParams): Promise<Community[]>;
  listDiscoverEvents(params: DiscoverListParams): Promise<Event[]>;
  listDiscoverGames(params: DiscoverGamesListParams): Promise<DiscoverGameRecord[]>;
  listDiscoverGamesByIds(gameIds: string[]): Promise<DiscoverGameRecord[]>;
}

export class PrismaDiscoverRepository implements DiscoverRepository {
  constructor(private readonly db: DatabaseClient) {}

  listDiscoverCommunities(params: DiscoverListParams): Promise<Community[]> {
    const where = {
      deletedAt: null,
      visibility: 'public' as const,
      ...(params.cursor !== undefined
        ? {
            OR: [
              { updatedAt: { lt: params.cursor.orderedAt } },
              { updatedAt: params.cursor.orderedAt, id: { lt: params.cursor.id } },
            ],
          }
        : {}),
    };

    return this.db.community.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: params.limit,
    });
  }

  listDiscoverEvents(params: DiscoverListParams): Promise<Event[]> {
    const where = {
      deletedAt: null,
      ...(params.cursor !== undefined
        ? {
            OR: [
              { startsAt: { lt: params.cursor.orderedAt } },
              { startsAt: params.cursor.orderedAt, id: { lt: params.cursor.id } },
            ],
          }
        : {}),
    };

    return this.db.event.findMany({
      where,
      orderBy: [{ startsAt: 'desc' }, { id: 'desc' }],
      take: params.limit,
    });
  }

  listDiscoverGames(params: DiscoverGamesListParams): Promise<DiscoverGameRecord[]> {
    return listDiscoverGamesQuery(this.db, params);
  }

  listDiscoverGamesByIds(gameIds: string[]): Promise<DiscoverGameRecord[]> {
    return listDiscoverGamesByIdsQuery(this.db, gameIds);
  }
}
