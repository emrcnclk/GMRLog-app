import type { ApiEnvelope, ApiErrorEnvelope, ReportResponse } from '@gmrlog/types';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AuthModule } from '../auth/auth.module';
import { TokenService } from '../auth/jwt/token.service';
import { AppConfigModule } from '../infrastructure/config/config.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { HttpInfrastructureModule } from '../infrastructure/http/http.module';
import { LoggerModule } from '../infrastructure/logging/logger.module';

import { ModerationModule } from './moderation.module';
import {
  MODERATION_CASE_REPOSITORY,
  MODERATION_POST_REPOSITORY,
  MODERATION_USER_REPOSITORY,
  REPORT_REPOSITORY,
} from './moderation.tokens';
import {
  createActiveIdLookup,
  createFakeModerationCaseRepository,
  createFakeReportRepository,
  createFakeUserRepository,
  makeUser,
} from './testing/fake-repositories';

const reports = createFakeReportRepository();
const cases = createFakeModerationCaseRepository();
const users = createFakeUserRepository([
  makeUser({ id: 'user-1' }),
  makeUser({ id: 'user-2', handle: 'target' }),
]);
const posts = createActiveIdLookup([{ id: 'post-1' }]);

let app: NestFastifyApplication;
let accessToken: string;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [
      AppConfigModule,
      LoggerModule,
      HttpInfrastructureModule,
      AuthModule,
      ModerationModule,
    ],
  })
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(REPORT_REPOSITORY)
    .useValue(reports)
    .overrideProvider(MODERATION_CASE_REPOSITORY)
    .useValue(cases)
    .overrideProvider(MODERATION_USER_REPOSITORY)
    .useValue(users)
    .overrideProvider(MODERATION_POST_REPOSITORY)
    .useValue(posts)
    .compile();

  app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  const tokens = moduleRef.get(TokenService);
  accessToken = await tokens.signAccessToken('user-1');
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  reports.rows.clear();
  cases.rows.clear();
});

function authHeaders(): Record<string, string> {
  return { authorization: `Bearer ${accessToken}` };
}

describe('POST /reports', () => {
  it('rejects guests with the canonical S1 authn error', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/reports',
      payload: { targetType: 'user', targetId: 'user-2', reason: 'spam' },
    });
    expect(response.statusCode).toBe(401);
    expect((JSON.parse(response.payload) as ApiErrorEnvelope).error.category).toBe('authn');
  });

  it('creates a report inside the S1 envelope', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/reports',
      headers: authHeaders(),
      payload: { targetType: 'user', targetId: 'user-2', reason: 'harassment' },
    });
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload) as ApiEnvelope<ReportResponse>;
    expect(body.meta.requestId).toEqual(expect.any(String));
    expect(body.data).toMatchObject({
      targetType: 'user',
      targetId: 'user-2',
      reason: 'harassment',
      status: 'open',
    });
    expect(cases.rows.size).toBe(1);
  });

  it('rejects invalid reason and missing fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/reports',
      headers: authHeaders(),
      payload: { targetType: 'user', targetId: 'user-2', reason: 'not-a-reason' },
    });
    expect(response.statusCode).toBe(400);
  });

  it('rejects self-reports with 403', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/reports',
      headers: authHeaders(),
      payload: { targetType: 'user', targetId: 'user-1', reason: 'spam' },
    });
    expect(response.statusCode).toBe(403);
  });

  it('rejects duplicate open reports with 409', async () => {
    await app.inject({
      method: 'POST',
      url: '/reports',
      headers: authHeaders(),
      payload: { targetType: 'post', targetId: 'post-1', reason: 'spam' },
    });
    const duplicate = await app.inject({
      method: 'POST',
      url: '/reports',
      headers: authHeaders(),
      payload: { targetType: 'post', targetId: 'post-1', reason: 'other' },
    });
    expect(duplicate.statusCode).toBe(409);
  });

  it('rejects missing targets with 404', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/reports',
      headers: authHeaders(),
      payload: { targetType: 'post', targetId: 'missing', reason: 'spam' },
    });
    expect(response.statusCode).toBe(404);
  });
});
