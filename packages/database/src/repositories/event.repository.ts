import type { Event, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

export interface EventListCursor {
  startsAt: Date;
  id: string;
}

export interface EventListParams {
  limit: number;
  cursor?: EventListCursor;
}

/**
 * Event persistence (S2 §10.6). Soft-deletable Shared Destination.
 * No owner / visibility columns — active rows are publicly readable.
 */
export interface EventRepository {
  create(data: Prisma.EventCreateInput): Promise<Event>;
  findById(id: string): Promise<Event | null>;
  findActiveById(id: string): Promise<Event | null>;
  /** Active events — newest `startsAt` first (discover dialect). */
  listPublic(params: EventListParams): Promise<Event[]>;
  /** D3.24 Game Hub — active events for a game, soonest first. */
  listByGame(gameId: string): Promise<Event[]>;
  /** D3.24 Communities 2.0 — active events for a community, soonest first. */
  listByCommunity(communityId: string): Promise<Event[]>;
  /** 3b.2a — `GET /communities/{id}/events`, cursor-paginated, soonest first. */
  listByCommunityPaginated(communityId: string, params: EventListParams): Promise<Event[]>;
  update(id: string, data: Prisma.EventUpdateInput): Promise<Event>;
  softDelete(id: string): Promise<Event>;
}

export class PrismaEventRepository implements EventRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.EventCreateInput): Promise<Event> {
    return this.db.event.create({ data });
  }

  findById(id: string): Promise<Event | null> {
    return this.db.event.findUnique({ where: { id } });
  }

  findActiveById(id: string): Promise<Event | null> {
    return this.db.event.findFirst({ where: { id, deletedAt: null } });
  }

  listPublic(params: EventListParams): Promise<Event[]> {
    return this.db.event.findMany({
      where: {
        deletedAt: null,
        ...(params.cursor !== undefined
          ? {
              OR: [
                { startsAt: { lt: params.cursor.startsAt } },
                { startsAt: params.cursor.startsAt, id: { lt: params.cursor.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ startsAt: 'desc' }, { id: 'desc' }],
      take: params.limit,
    });
  }

  listByGame(gameId: string): Promise<Event[]> {
    return this.db.event.findMany({
      where: { gameId, deletedAt: null },
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
    });
  }

  listByCommunity(communityId: string): Promise<Event[]> {
    return this.db.event.findMany({
      where: { communityId, deletedAt: null },
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
    });
  }

  listByCommunityPaginated(communityId: string, params: EventListParams): Promise<Event[]> {
    return this.db.event.findMany({
      where: {
        communityId,
        deletedAt: null,
        ...(params.cursor !== undefined
          ? {
              OR: [
                { startsAt: { gt: params.cursor.startsAt } },
                { startsAt: params.cursor.startsAt, id: { gt: params.cursor.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      take: params.limit,
    });
  }

  update(id: string, data: Prisma.EventUpdateInput): Promise<Event> {
    return this.db.event.update({ where: { id }, data });
  }

  softDelete(id: string): Promise<Event> {
    return this.db.event.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
