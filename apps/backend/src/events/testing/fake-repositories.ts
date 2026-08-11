import type {
  Event,
  EventInvite,
  EventInviteRepository,
  EventListParams,
  EventParticipation,
  EventParticipationRepository,
  EventRepository,
  Prisma,
  User,
  UserRepository,
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

export function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'event-1',
    title: 'Culture Cup',
    kind: 'tournament',
    description: null,
    startsAt: new Date('2026-01-02T00:00:00.000Z'),
    endsAt: null,
    gameId: null,
    communityId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

export function makeParticipation(overrides: Partial<EventParticipation> = {}): EventParticipation {
  return {
    id: 'participation-1',
    eventId: 'event-1',
    userId: 'user-1',
    state: 'going',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    handle: 'gamer',
    displayName: 'Gamer',
    bio: null,
    avatarKey: null,
    bannerKey: null,
    avatarBlurhash: null,
    avatarVariants: null,
    bannerBlurhash: null,
    bannerVariants: null,
    privacyId: null,
    creatorFeatured: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

export function makeInvite(overrides: Partial<EventInvite> = {}): EventInvite {
  return {
    id: 'invite-1',
    eventId: 'event-1',
    inviterId: 'user-1',
    inviteeId: 'user-2',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export interface FakeEventRepository extends EventRepository {
  rows: Map<string, Event>;
}

export function createFakeEventRepository(seed: Event[] = []): FakeEventRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));
  const active = (): Event[] => [...rows.values()].filter((row) => row.deletedAt === null);

  return {
    rows,
    create: (data: Prisma.EventCreateInput) => {
      const startsAt =
        data.startsAt instanceof Date
          ? data.startsAt
          : typeof data.startsAt === 'string'
            ? new Date(data.startsAt)
            : new Date();
      const endsAt =
        data.endsAt === null || data.endsAt === undefined
          ? null
          : data.endsAt instanceof Date
            ? data.endsAt
            : typeof data.endsAt === 'string'
              ? new Date(data.endsAt)
              : null;
      const event = makeEvent({
        id: nextId('event'),
        title: data.title,
        kind: data.kind,
        startsAt,
        endsAt,
        gameId: connectId(data.game) ?? null,
        communityId: connectId(data.community) ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });
      rows.set(event.id, event);
      return Promise.resolve(event);
    },
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findActiveById: (id) => {
      const event = rows.get(id);
      return Promise.resolve(event?.deletedAt === null ? event : null);
    },
    listPublic: (params: EventListParams) => {
      let list = active().sort((a, b) => {
        const byTime = b.startsAt.getTime() - a.startsAt.getTime();
        return byTime !== 0 ? byTime : b.id.localeCompare(a.id);
      });
      if (params.cursor !== undefined) {
        const cursor = params.cursor;
        const cursorTime = cursor.startsAt.getTime();
        list = list.filter((row) => {
          const time = row.startsAt.getTime();
          return time < cursorTime || (time === cursorTime && row.id < cursor.id);
        });
      }
      return Promise.resolve(list.slice(0, params.limit));
    },
    listByGame: (gameId) =>
      Promise.resolve(
        active()
          .filter((row) => row.gameId === gameId)
          .sort((a, b) => {
            const byTime = a.startsAt.getTime() - b.startsAt.getTime();
            return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
          }),
      ),
    listByCommunity: (communityId) =>
      Promise.resolve(
        active()
          .filter((row) => row.communityId === communityId)
          .sort((a, b) => {
            const byTime = a.startsAt.getTime() - b.startsAt.getTime();
            return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
          }),
      ),
    listByCommunityPaginated: (communityId, params: EventListParams) => {
      let list = active()
        .filter((row) => row.communityId === communityId)
        .sort((a, b) => {
          const byTime = a.startsAt.getTime() - b.startsAt.getTime();
          return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
        });
      if (params.cursor !== undefined) {
        const cursor = params.cursor;
        const cursorTime = cursor.startsAt.getTime();
        list = list.filter((row) => {
          const time = row.startsAt.getTime();
          return time > cursorTime || (time === cursorTime && row.id > cursor.id);
        });
      }
      return Promise.resolve(list.slice(0, params.limit));
    },
    update: (id, data: Prisma.EventUpdateInput) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`event ${id} not found`));
      }
      const next: Event = {
        ...current,
        ...(typeof data.title === 'string' ? { title: data.title } : {}),
        updatedAt: new Date(),
      };
      rows.set(id, next);
      return Promise.resolve(next);
    },
    softDelete: (id) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`event ${id} not found`));
      }
      const next: Event = { ...current, deletedAt: new Date(), updatedAt: new Date() };
      rows.set(id, next);
      return Promise.resolve(next);
    },
  };
}

export interface FakeEventParticipationRepository extends EventParticipationRepository {
  rows: Map<string, EventParticipation>;
}

export function createFakeEventParticipationRepository(
  seed: EventParticipation[] = [],
): FakeEventParticipationRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));

  return {
    rows,
    create: (data: Prisma.EventParticipationCreateInput) => {
      const eventId = connectId(data.event);
      const userId = connectId(data.user);
      if (!eventId || !userId) {
        return Promise.reject(new Error('event and user required'));
      }
      const participation = makeParticipation({
        id: nextId('participation'),
        eventId,
        userId,
        state: data.state,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      rows.set(participation.id, participation);
      return Promise.resolve(participation);
    },
    findByEventAndUser: (eventId, userId) =>
      Promise.resolve(
        [...rows.values()].find((row) => row.eventId === eventId && row.userId === userId) ?? null,
      ),
    listByEvent: (eventId) =>
      Promise.resolve(
        [...rows.values()]
          .filter((row) => row.eventId === eventId)
          .sort((a, b) => {
            const byTime = a.createdAt.getTime() - b.createdAt.getTime();
            return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
          }),
      ),
    // 7.1 — communities' leaderboard "events hosted" points.
    countByEventsGroupedByUserSince: (eventIds, state, since) => {
      const idSet = new Set(eventIds);
      const counts = new Map<string, number>();
      for (const row of rows.values()) {
        if (!idSet.has(row.eventId)) continue;
        if (row.state !== state) continue;
        if (row.createdAt.getTime() < since.getTime()) continue;
        counts.set(row.userId, (counts.get(row.userId) ?? 0) + 1);
      }
      return Promise.resolve([...counts.entries()].map(([userId, count]) => ({ userId, count })));
    },
    updateState: (id, state) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`participation ${id} not found`));
      }
      const next: EventParticipation = { ...current, state, updatedAt: new Date() };
      rows.set(id, next);
      return Promise.resolve(next);
    },
    delete: (id) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`participation ${id} not found`));
      }
      rows.delete(id);
      return Promise.resolve(current);
    },
    deleteByEventAndUser: (eventId, userId) => {
      const existing = [...rows.values()].find(
        (row) => row.eventId === eventId && row.userId === userId,
      );
      if (!existing) {
        return Promise.resolve(null);
      }
      rows.delete(existing.id);
      return Promise.resolve(existing);
    },
  };
}

export interface FakeUserRepository extends UserRepository {
  rows: Map<string, User>;
}

export function createFakeUserRepository(seed: User[] = []): FakeUserRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));
  return {
    rows,
    create: () => Promise.reject(new Error('not supported')),
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findByHandle: () => Promise.resolve(null),
    findManyByIds: (ids) =>
      Promise.resolve(
        ids.flatMap((id) => {
          const user = rows.get(id);
          return user ? [user] : [];
        }),
      ),
    update: () => Promise.reject(new Error('not supported')),
    softDelete: () => Promise.reject(new Error('not supported')),
    delete: () => Promise.reject(new Error('not supported')),
  };
}

export interface FakeEventInviteRepository extends EventInviteRepository {
  rows: Map<string, EventInvite>;
}

export function createFakeEventInviteRepository(
  seed: EventInvite[] = [],
): FakeEventInviteRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));

  return {
    rows,
    create: (data: Prisma.EventInviteCreateInput) => {
      const eventId = connectId(data.event);
      const inviterId = connectId(data.inviter);
      const inviteeId = connectId(data.invitee);
      if (!eventId || !inviterId || !inviteeId) {
        return Promise.reject(new Error('event, inviter, and invitee required'));
      }
      const invite = makeInvite({
        id: nextId('invite'),
        eventId,
        inviterId,
        inviteeId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      rows.set(invite.id, invite);
      return Promise.resolve(invite);
    },
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findByEventAndInvitee: (eventId, inviteeId) =>
      Promise.resolve(
        [...rows.values()].find((row) => row.eventId === eventId && row.inviteeId === inviteeId) ??
          null,
      ),
    listByInvitee: (inviteeId) =>
      Promise.resolve(
        [...rows.values()]
          .filter((row) => row.inviteeId === inviteeId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      ),
    listByEvent: (eventId) =>
      Promise.resolve(
        [...rows.values()]
          .filter((row) => row.eventId === eventId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      ),
    delete: (id) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`invite ${id} not found`));
      }
      rows.delete(id);
      return Promise.resolve(current);
    },
  };
}
