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
