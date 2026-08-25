import type { AccountDeletionStatusResponse, ApiEnvelope } from '@gmrlog/types';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

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

const fakePrisma = {
  accountDeletionRequest: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
  },
  communityMember: { findMany: vi.fn().mockResolvedValue([]) },
  community: { updateMany: vi.fn() },
  post: { updateMany: vi.fn() },
  review: { updateMany: vi.fn() },
  collection: { updateMany: vi.fn() },
  tierList: { updateMany: vi.fn() },
  quote: { updateMany: vi.fn() },
  authCredential: { deleteMany: vi.fn() },
  connectedAccount: { deleteMany: vi.fn() },
  session: { deleteMany: vi.fn() },
  user: { update: vi.fn() },
  $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
};

function payload(body: string): AccountDeletionStatusResponse {
  return (JSON.parse(body) as ApiEnvelope<AccountDeletionStatusResponse>).data;
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

beforeEach(() => {
  vi.clearAllMocks();
  fakePrisma.communityMember.findMany.mockResolvedValue([]);
  fakePrisma.$transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
});

describe('/me/account/deletion', () => {
  it("requires a token on every route — this is the player's own account", async () => {
    for (const method of ['GET', 'POST', 'DELETE'] as const) {
      const response = await app.inject({ method, url: '/me/account/deletion' });
      expect(response.statusCode).toBe(401);
    }
  });

  it('reports nothing pending by default', async () => {
    fakePrisma.accountDeletionRequest.findUnique.mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/me/account/deletion',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);
    expect(payload(response.payload)).toEqual({
      pending: false,
      requestedAt: null,
      deletesAt: null,
    });
  });

  it('starts the grace period on request', async () => {
    fakePrisma.accountDeletionRequest.findUnique.mockResolvedValue(null);
    fakePrisma.accountDeletionRequest.upsert.mockImplementation(
      ({ create }: { create: { userId: string; requestedAt: Date; deletesAt: Date } }) => ({
        id: 'req-1',
        cancelledAt: null,
        erasedAt: null,
        ...create,
      }),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/me/account/deletion',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(201);
    const body = payload(response.payload);
    expect(body.pending).toBe(true);
    expect(body.deletesAt).not.toBeNull();
  });

  it('refuses a second request while one is pending', async () => {
    fakePrisma.accountDeletionRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      userId: 'user-1',
      requestedAt: new Date(),
      deletesAt: new Date(Date.now() + 1000),
      cancelledAt: null,
      erasedAt: null,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/me/account/deletion',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(409);
  });

  it('cancels a pending request', async () => {
    fakePrisma.accountDeletionRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      userId: 'user-1',
      requestedAt: new Date(),
      deletesAt: new Date(Date.now() + 1000),
      cancelledAt: null,
      erasedAt: null,
    });

    const response = await app.inject({
      method: 'DELETE',
      url: '/me/account/deletion',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);
    expect(payload(response.payload)).toEqual({
      pending: false,
      requestedAt: null,
      deletesAt: null,
    });
  });

  it('404s cancelling when nothing is pending', async () => {
    fakePrisma.accountDeletionRequest.findUnique.mockResolvedValue(null);

    const response = await app.inject({
      method: 'DELETE',
      url: '/me/account/deletion',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(404);
  });
});
