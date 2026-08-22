import type { ApiEnvelope, DataExportResponse } from '@gmrlog/types';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { AuthModule } from '../auth/auth.module';
import { SESSION_REPOSITORY } from '../auth/auth.tokens';
import { issueTestAccessToken, MemorySessionRepository } from '../auth/testing/session-fixture';
import { AppConfigModule } from '../infrastructure/config/config.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { HttpInfrastructureModule } from '../infrastructure/http/http.module';
import { LoggerModule } from '../infrastructure/logging/logger.module';

import { LEGAL_CONSENT_REPOSITORY } from './legal.tokens';
import { LegalModule } from './legal.module';
import {
  createFakeUserConsentRepository,
  type FakeUserConsentRepository,
} from './testing/fake-repositories';

let app: NestFastifyApplication;
let accessToken: string;
const consents: FakeUserConsentRepository = createFakeUserConsentRepository();

function emptyFindMany() {
  return vi.fn().mockResolvedValue([]);
}

const fakePrisma = {
  user: {
    findUnique: vi.fn().mockResolvedValue({
      id: 'user-1',
      handle: 'playerone',
      displayName: 'Player One',
      bio: null,
      firstName: null,
      lastName: null,
      birthDate: null,
      countryCode: null,
      avatarKey: null,
      bannerKey: null,
      createdAt: new Date('2026-01-01'),
    }),
  },
  authCredential: { findMany: emptyFindMany() },
  userConsent: { findMany: emptyFindMany() },
  userSettings: { findUnique: vi.fn().mockResolvedValue(null) },
  libraryEntry: { findMany: emptyFindMany() },
  review: { findMany: emptyFindMany() },
  post: { findMany: emptyFindMany() },
  comment: { findMany: emptyFindMany() },
  reaction: { findMany: emptyFindMany() },
  collection: { findMany: emptyFindMany() },
  tierList: { findMany: emptyFindMany() },
  communityMember: { findMany: emptyFindMany() },
  eventParticipation: { findMany: emptyFindMany() },
  achievementProgress: { findMany: emptyFindMany() },
  follow: { findMany: emptyFindMany() },
  friendRequest: { findMany: emptyFindMany() },
  friendship: { findMany: emptyFindMany() },
  block: { findMany: emptyFindMany() },
  mute: { findMany: emptyFindMany() },
  message: { findMany: emptyFindMany() },
  session: { findMany: emptyFindMany() },
  auditLog: { findMany: emptyFindMany() },
  report: { findMany: emptyFindMany() },
  connectedAccount: { findMany: emptyFindMany() },
  userIntegration: { findMany: emptyFindMany() },
  gameLog: { findMany: emptyFindMany() },
};

function payload(body: string): DataExportResponse {
  return (JSON.parse(body) as ApiEnvelope<DataExportResponse>).data;
}

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppConfigModule, LoggerModule, HttpInfrastructureModule, AuthModule, LegalModule],
  })
    .overrideProvider(PrismaService)
    .useValue(fakePrisma)
    .overrideProvider(LEGAL_CONSENT_REPOSITORY)
    .useValue(consents)
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

describe('POST /me/export', () => {
  it("requires a token — this is the player's own data", async () => {
    const response = await app.inject({ method: 'POST', url: '/me/export' });
    expect(response.statusCode).toBe(401);
  });

  it('returns the five categories the Privacy Policy names', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/me/export',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(201);
    const body = payload(response.payload);
    expect(body.format).toBe('gmrlog.data-export.v1');
    expect(Object.keys(body.categories).sort()).toEqual(
      ['account', 'gamingActivity', 'optional', 'social', 'technical'].sort(),
    );
    expect(body.categories.account.handle).toBe('playerone');
  });

  it('404s when the account behind the token no longer exists', async () => {
    fakePrisma.user.findUnique.mockResolvedValueOnce(null);

    const response = await app.inject({
      method: 'POST',
      url: '/me/export',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(404);
  });
});
