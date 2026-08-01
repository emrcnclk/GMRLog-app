import type { ApiEnvelope, ApiErrorEnvelope, NotificationResponse } from '@gmrlog/types';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AuthModule } from '../auth/auth.module';
import { TokenService } from '../auth/jwt/token.service';
import { AppConfigModule } from '../infrastructure/config/config.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { HttpInfrastructureModule } from '../infrastructure/http/http.module';
import { LoggerModule } from '../infrastructure/logging/logger.module';

import { NotificationsModule } from './notifications.module';
import { NOTIFICATION_REPOSITORY } from './notifications.tokens';
import { createFakeNotificationRepository, makeNotification } from './testing/fake-repositories';

const notifications = createFakeNotificationRepository();

let app: NestFastifyApplication;
let accessToken: string;
let otherToken: string;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [
      AppConfigModule,
      LoggerModule,
      HttpInfrastructureModule,
      AuthModule,
      NotificationsModule,
    ],
  })
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(NOTIFICATION_REPOSITORY)
    .useValue(notifications)
    .compile();

  app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  const tokens = moduleRef.get(TokenService);
  accessToken = await tokens.signAccessToken('user-1');
  otherToken = await tokens.signAccessToken('user-2');
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  notifications.rows.clear();
});

function authHeaders(token = accessToken): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

describe('GET /notifications', () => {
  it('rejects guests with the canonical S1 authn error', async () => {
    const response = await app.inject({ method: 'GET', url: '/notifications' });
    expect(response.statusCode).toBe(401);
    expect((JSON.parse(response.payload) as ApiErrorEnvelope).error.category).toBe('authn');
  });

  it('lists recipient notifications inside the S1 list envelope', async () => {
    notifications.rows.set(
      'n-1',
      makeNotification({
        id: 'n-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    );
    notifications.rows.set(
      'n-2',
      makeNotification({
        id: 'n-2',
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
      }),
    );

    const response = await app.inject({
      method: 'GET',
      url: '/notifications?limit=1',
      headers: authHeaders(),
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<NotificationResponse[]>;
    expect(body.meta.requestId).toEqual(expect.any(String));
    expect(body.meta.hasMore).toBe(true);
    expect(body.meta.limit).toBe(1);
    expect(body.meta.cursor?.next).toEqual(expect.any(String));
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      id: 'n-2',
      kind: 'follow',
      actor: null,
      objectRef: { type: 'user', id: 'user-x' },
      messageKey: 'follow',
    });
  });
});

describe('POST /notifications/read', () => {
  it('marks ids with 204 and forbids foreign notifications', async () => {
    notifications.rows.set('mine', makeNotification({ id: 'mine', recipientId: 'user-1' }));
    notifications.rows.set('theirs', makeNotification({ id: 'theirs', recipientId: 'user-2' }));

    const ok = await app.inject({
      method: 'POST',
      url: '/notifications/read',
      headers: authHeaders(),
      payload: { ids: ['mine'] },
    });
    expect(ok.statusCode).toBe(204);
    expect(notifications.rows.get('mine')?.readAt).toBeInstanceOf(Date);

    const foreign = await app.inject({
      method: 'POST',
      url: '/notifications/read',
      headers: authHeaders(),
      payload: { ids: ['theirs'] },
    });
    expect(foreign.statusCode).toBe(404);

    const otherActor = await app.inject({
      method: 'POST',
      url: '/notifications/read',
      headers: authHeaders(otherToken),
      payload: { ids: ['mine'] },
    });
    expect(otherActor.statusCode).toBe(404);
  });

  it('marks all unread and rejects empty payloads', async () => {
    notifications.rows.set('a', makeNotification({ id: 'a', readAt: null }));
    notifications.rows.set(
      'b',
      makeNotification({ id: 'b', readAt: new Date('2026-01-01T00:00:00.000Z') }),
    );

    const all = await app.inject({
      method: 'POST',
      url: '/notifications/read',
      headers: authHeaders(),
      payload: { all: true },
    });
    expect(all.statusCode).toBe(204);
    expect(notifications.rows.get('a')?.readAt).toBeInstanceOf(Date);
    expect(notifications.rows.get('b')?.readAt?.toISOString()).toBe('2026-01-01T00:00:00.000Z');

    const empty = await app.inject({
      method: 'POST',
      url: '/notifications/read',
      headers: authHeaders(),
      payload: {},
    });
    expect(empty.statusCode).toBe(400);
  });
});
