import type { ApiEnvelope, ApiErrorEnvelope, EventResponse } from '@gmrlog/types';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AuthModule } from '../auth/auth.module';
import { AppConfigModule } from '../infrastructure/config/config.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { HttpInfrastructureModule } from '../infrastructure/http/http.module';
import { EventReminderPublisher } from '../infrastructure/jobs/event-reminder.publisher';
import { JOBS_CONNECTION } from '../infrastructure/jobs/jobs.constants';
import { LoggerModule } from '../infrastructure/logging/logger.module';
import { createFakeCommunityRepository } from '../communities/testing/fake-repositories';
import { createFakeNotificationRepository } from '../notifications/testing/fake-repositories';

import { EventsModule } from './events.module';
import {
  EVENT_COMMUNITY_REPOSITORY,
  EVENT_INVITE_REPOSITORY,
  EVENT_NOTIFICATION_REPOSITORY,
  EVENT_PARTICIPATION_REPOSITORY,
  EVENT_REPOSITORY,
  EVENT_USER_REPOSITORY,
} from './events.tokens';
import {
  createFakeEventInviteRepository,
  createFakeEventParticipationRepository,
  createFakeEventRepository,
  createFakeUserRepository,
  makeEvent,
  makeUser,
} from './testing/fake-repositories';
import { SESSION_REPOSITORY } from '../auth/auth.tokens';
import { issueTestAccessToken, MemorySessionRepository } from '../auth/testing/session-fixture';

const events = createFakeEventRepository();
const participations = createFakeEventParticipationRepository();
const users = createFakeUserRepository([
  makeUser({ id: 'user-1' }),
  makeUser({ id: 'user-2', handle: 'friend', displayName: 'Friend' }),
]);
const invites = createFakeEventInviteRepository();
const notifications = createFakeNotificationRepository();
const communities = createFakeCommunityRepository();

let app: NestFastifyApplication;
let accessToken: string;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppConfigModule, LoggerModule, HttpInfrastructureModule, AuthModule, EventsModule],
  })
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(EVENT_REPOSITORY)
    .useValue(events)
    .overrideProvider(EVENT_PARTICIPATION_REPOSITORY)
    .useValue(participations)
    .overrideProvider(EVENT_USER_REPOSITORY)
    .useValue(users)
    .overrideProvider(EVENT_INVITE_REPOSITORY)
    .useValue(invites)
    .overrideProvider(EVENT_NOTIFICATION_REPOSITORY)
    .useValue(notifications)
    .overrideProvider(EVENT_COMMUNITY_REPOSITORY)
    .useValue(communities)
    .overrideProvider(EventReminderPublisher)
    .useValue({ schedule: async () => undefined, cancel: async () => undefined })
    .overrideProvider(JOBS_CONNECTION)
    .useValue({ disconnect: () => undefined })
    .overrideProvider(SESSION_REPOSITORY)
    .useValue(new MemorySessionRepository())
    .compile();

  app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  accessToken = await issueTestAccessToken(moduleRef, 'user-1');
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  events.rows.clear();
  participations.rows.clear();
  invites.rows.clear();
  notifications.rows.clear();
  events.rows.set('event-1', makeEvent({ id: 'event-1', title: 'Culture Cup' }));
});

function authHeaders(): Record<string, string> {
  return { authorization: `Bearer ${accessToken}` };
}

describe('GET /events/:id', () => {
  it('returns event detail for guests inside the S1 envelope', async () => {
    const response = await app.inject({ method: 'GET', url: '/events/event-1' });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<EventResponse>;
    expect(body.meta.requestId).toEqual(expect.any(String));
    expect(body.data).toMatchObject({
      id: 'event-1',
      title: 'Culture Cup',
      viewerParticipation: null,
    });
  });

  it('includes viewerParticipation when authenticated and joined', async () => {
    await app.inject({
      method: 'POST',
      url: '/events/event-1/participation',
      headers: authHeaders(),
      payload: {},
    });
    const response = await app.inject({
      method: 'GET',
      url: '/events/event-1',
      headers: authHeaders(),
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<EventResponse>;
    expect(body.data.viewerParticipation?.state).toBe('going');
  });

  it('returns 404 for missing events', async () => {
    const response = await app.inject({ method: 'GET', url: '/events/missing' });
    expect(response.statusCode).toBe(404);
  });
});

describe('POST/DELETE /events/:id/participation', () => {
  it('rejects guests with the canonical S1 authn error', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/events/event-1/participation',
      payload: {},
    });
    expect(response.statusCode).toBe(401);
    expect((JSON.parse(response.payload) as ApiErrorEnvelope).error.category).toBe('authn');
  });

  it('joins with 204 and rejects duplicate participation', async () => {
    const ok = await app.inject({
      method: 'POST',
      url: '/events/event-1/participation',
      headers: authHeaders(),
      payload: {},
    });
    expect(ok.statusCode).toBe(204);

    const duplicate = await app.inject({
      method: 'POST',
      url: '/events/event-1/participation',
      headers: authHeaders(),
      payload: {},
    });
    expect(duplicate.statusCode).toBe(409);
  });

  it('leaves with 204 and rejects leave without membership', async () => {
    await app.inject({
      method: 'POST',
      url: '/events/event-1/participation',
      headers: authHeaders(),
      payload: {},
    });
    const left = await app.inject({
      method: 'DELETE',
      url: '/events/event-1/participation',
      headers: authHeaders(),
    });
    expect(left.statusCode).toBe(204);

    const missing = await app.inject({
      method: 'DELETE',
      url: '/events/event-1/participation',
      headers: authHeaders(),
    });
    expect(missing.statusCode).toBe(404);
  });

  it('rejects unknown body fields with 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/events/event-1/participation',
      headers: authHeaders(),
      payload: { state: 'going' },
    });
    expect(response.statusCode).toBe(400);
  });
});

describe('POST /events/:id/rsvp', () => {
  it('upserts LFG state and returns event with viewerParticipation', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/events/event-1/rsvp',
      headers: authHeaders(),
      payload: { state: 'looking_for_team' },
    });
    expect(created.statusCode).toBe(200);
    const body = JSON.parse(created.payload) as ApiEnvelope<EventResponse>;
    expect(body.data.viewerParticipation?.state).toBe('looking_for_team');

    const updated = await app.inject({
      method: 'POST',
      url: '/events/event-1/rsvp',
      headers: authHeaders(),
      payload: { state: 'need_players' },
    });
    expect(updated.statusCode).toBe(200);
    expect(
      (JSON.parse(updated.payload) as ApiEnvelope<EventResponse>).data.viewerParticipation?.state,
    ).toBe('need_players');
  });

  it('rejects invalid state', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/events/event-1/rsvp',
      headers: authHeaders(),
      payload: { state: 'maybe' },
    });
    expect(response.statusCode).toBe(400);
  });
});

describe('POST /events/:id/invite', () => {
  it('creates invites with 204 and notifies invitees', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/events/event-1/invite',
      headers: authHeaders(),
      payload: { userIds: ['user-2'] },
    });
    expect(response.statusCode).toBe(204);
    expect([...invites.rows.values()]).toHaveLength(1);
    expect([...notifications.rows.values()][0]?.kind).toBe('event_invite');
  });
});
