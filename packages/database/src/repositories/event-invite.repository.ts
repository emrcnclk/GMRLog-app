import type { EventInvite, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * EventInvite persistence (D3.24 LFG · docs/07_SOCIAL/EVENTS_2.md). Unique per
 * (eventId, inviteeId) — one pending invite per invitee per event.
 */
export interface EventInviteRepository {
  create(data: Prisma.EventInviteCreateInput): Promise<EventInvite>;
  findById(id: string): Promise<EventInvite | null>;
  findByEventAndInvitee(eventId: string, inviteeId: string): Promise<EventInvite | null>;
  listByInvitee(inviteeId: string): Promise<EventInvite[]>;
  listByEvent(eventId: string): Promise<EventInvite[]>;
  delete(id: string): Promise<EventInvite>;
}

export class PrismaEventInviteRepository implements EventInviteRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.EventInviteCreateInput): Promise<EventInvite> {
    return this.db.eventInvite.create({ data });
  }

  findById(id: string): Promise<EventInvite | null> {
    return this.db.eventInvite.findUnique({ where: { id } });
  }

  findByEventAndInvitee(eventId: string, inviteeId: string): Promise<EventInvite | null> {
    return this.db.eventInvite.findUnique({
      where: { eventId_inviteeId: { eventId, inviteeId } },
    });
  }

  listByInvitee(inviteeId: string): Promise<EventInvite[]> {
    return this.db.eventInvite.findMany({
      where: { inviteeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  listByEvent(eventId: string): Promise<EventInvite[]> {
    return this.db.eventInvite.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
  }

  delete(id: string): Promise<EventInvite> {
    return this.db.eventInvite.delete({ where: { id } });
  }
}
