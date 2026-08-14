import type { EventParticipation, EventParticipationState, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * Event participation persistence (S2 §10.6). Unique per (eventId, userId).
 * Leave = hard delete of the relationship row (§6).
 */
export interface EventParticipationRepository {
  create(data: Prisma.EventParticipationCreateInput): Promise<EventParticipation>;
  findByEventAndUser(eventId: string, userId: string): Promise<EventParticipation | null>;
  listByEvent(eventId: string): Promise<EventParticipation[]>;
  /**
   * 7.1 — BACKEND_CHANGES.md §5. Participation counts per user across a set
   * of events in one `state`, since a cutoff, one `groupBy` (community
   * leaderboard "events hosted" points).
   */
  countByEventsGroupedByUserSince(
    eventIds: readonly string[],
    state: EventParticipationState,
    since: Date,
  ): Promise<{ userId: string; count: number }[]>;
  /**
   * 9.4 — `attendeeCount` on `EventResponse`. `going`/`hosting` only: `interested`
   * and the LFG states (`looking_for_team`/`need_players`) are intent, not a
   * commitment to attend, and `not_going` is an explicit decline — none belong
   * in a count of attendees. One `groupBy` per page, keyed by `eventId`.
   */
  countAttendeesByEvents(
    eventIds: readonly string[],
  ): Promise<{ eventId: string; count: number }[]>;
  updateState(id: string, state: EventParticipationState): Promise<EventParticipation>;
  delete(id: string): Promise<EventParticipation>;
  deleteByEventAndUser(eventId: string, userId: string): Promise<EventParticipation | null>;
}

export class PrismaEventParticipationRepository implements EventParticipationRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.EventParticipationCreateInput): Promise<EventParticipation> {
    return this.db.eventParticipation.create({ data });
  }

  findByEventAndUser(eventId: string, userId: string): Promise<EventParticipation | null> {
    return this.db.eventParticipation.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
  }

  listByEvent(eventId: string): Promise<EventParticipation[]> {
    return this.db.eventParticipation.findMany({
      where: { eventId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  async countByEventsGroupedByUserSince(
    eventIds: readonly string[],
    state: EventParticipationState,
    since: Date,
  ): Promise<{ userId: string; count: number }[]> {
    if (eventIds.length === 0) {
      return [];
    }
    const rows = await this.db.eventParticipation.groupBy({
      by: ['userId'],
      where: { eventId: { in: [...eventIds] }, state, createdAt: { gte: since } },
      _count: { _all: true },
    });
    return rows.map((row) => ({ userId: row.userId, count: row._count._all }));
  }

  async countAttendeesByEvents(
    eventIds: readonly string[],
  ): Promise<{ eventId: string; count: number }[]> {
    if (eventIds.length === 0) {
      return [];
    }
    const rows = await this.db.eventParticipation.groupBy({
      by: ['eventId'],
      where: { eventId: { in: [...eventIds] }, state: { in: ['going', 'hosting'] } },
      _count: { _all: true },
    });
    return rows.map((row) => ({ eventId: row.eventId, count: row._count._all }));
  }

  updateState(id: string, state: EventParticipationState): Promise<EventParticipation> {
    return this.db.eventParticipation.update({ where: { id }, data: { state } });
  }

  delete(id: string): Promise<EventParticipation> {
    return this.db.eventParticipation.delete({ where: { id } });
  }

  async deleteByEventAndUser(eventId: string, userId: string): Promise<EventParticipation | null> {
    const existing = await this.findByEventAndUser(eventId, userId);
    if (!existing) {
      return null;
    }
    return this.delete(existing.id);
  }
}
