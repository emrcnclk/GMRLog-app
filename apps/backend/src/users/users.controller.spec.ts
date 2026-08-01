import type {
  ApiEnvelope,
  ApiErrorEnvelope,
  ConnectedAccountResponse,
  SettingsResponse,
  UserSelfResponse,
} from '@gmrlog/types';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AuthModule } from '../auth/auth.module';
import { TokenService } from '../auth/jwt/token.service';
import { AppConfigModule } from '../infrastructure/config/config.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { HttpInfrastructureModule } from '../infrastructure/http/http.module';
import { LoggerModule } from '../infrastructure/logging/logger.module';

import {
  createFakeConnectedAccountRepository,
  createFakeUserRepository,
  createFakeUserSettingsRepository,
  makeConnectedAccount,
  makeUser,
} from './testing/fake-repositories';
import { UsersModule } from './users.module';
import {
  CONNECTED_ACCOUNT_REPOSITORY,
  UPLOAD_REPOSITORY,
  USER_REPOSITORY,
  USER_SETTINGS_REPOSITORY,
} from './users.tokens';
import { createFakeUploadRepository } from '../uploads/testing/fake-repositories';

/**
 * Controller/integration tests — the real Nest + Fastify pipeline (guards,
 * global Zod pipe, envelope interceptor, exception filter) over fake
 * repositories. No network, no database.
 */

const userRepo = createFakeUserRepository();
const settingsRepo = createFakeUserSettingsRepository();
const accountsRepo = createFakeConnectedAccountRepository([
  makeConnectedAccount({ id: 'account-steam', provider: 'steam', status: 'connected' }),
  makeConnectedAccount({
    id: 'account-discord',
    provider: 'discord',
    status: 'disconnected',
    linkedAt: null,
    scopes: [],
  }),
]);
const uploadRepo = createFakeUploadRepository();

let app: NestFastifyApplication;
let accessToken: string;
let staleToken: string;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppConfigModule, LoggerModule, HttpInfrastructureModule, AuthModule, UsersModule],
  })
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(USER_REPOSITORY)
    .useValue(userRepo)
    .overrideProvider(USER_SETTINGS_REPOSITORY)
    .useValue(settingsRepo)
    .overrideProvider(CONNECTED_ACCOUNT_REPOSITORY)
    .useValue(accountsRepo)
    .overrideProvider(UPLOAD_REPOSITORY)
    .useValue(uploadRepo)
    .compile();

  app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  const tokens = moduleRef.get(TokenService);
  accessToken = await tokens.signAccessToken('user-1');
  staleToken = await tokens.signAccessToken('ghost');
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  userRepo.rows.clear();
  userRepo.rows.set('user-1', makeUser());
  settingsRepo.rows.clear();
});

function authHeaders(): Record<string, string> {
  return { authorization: `Bearer ${accessToken}` };
}

describe('authentication boundary', () => {
  it('rejects guests with the canonical S1 authn error envelope', async () => {
    const response = await app.inject({ method: 'GET', url: '/me' });
    expect(response.statusCode).toBe(401);

    const body = JSON.parse(response.payload) as ApiErrorEnvelope;
    expect(body.error.category).toBe('authn');
    expect(body.error.code).toBe('UNAUTHENTICATED');
    expect(body.error.retryable).toBe(false);
    expect(body.error.requestId).toEqual(expect.any(String));
  });

  it('rejects a verified token whose subject no longer exists', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/me',
      headers: { authorization: `Bearer ${staleToken}` },
    });
    expect(response.statusCode).toBe(401);
    expect((JSON.parse(response.payload) as ApiErrorEnvelope).error.category).toBe('authn');
  });
});

describe('GET /me · PATCH /me', () => {
  it('returns the self profile inside the S1 §4 envelope', async () => {
    const response = await app.inject({ method: 'GET', url: '/me', headers: authHeaders() });
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.payload) as ApiEnvelope<UserSelfResponse>;
    expect(body.meta.requestId).toEqual(expect.any(String));
    expect(body.data).toMatchObject({
      id: 'user-1',
      handle: 'gamer',
      displayName: 'Gamer',
      bio: null,
      avatarUrl: null,
      connectedProviders: ['steam'],
    });
  });

  it('updates displayName and clears bio with null', async () => {
    const updated = await app.inject({
      method: 'PATCH',
      url: '/me',
      headers: authHeaders(),
      payload: { displayName: 'New Name', bio: 'Hello' },
    });
    expect(updated.statusCode).toBe(200);
    expect((JSON.parse(updated.payload) as ApiEnvelope<UserSelfResponse>).data).toMatchObject({
      displayName: 'New Name',
      bio: 'Hello',
    });

    const cleared = await app.inject({
      method: 'PATCH',
      url: '/me',
      headers: authHeaders(),
      payload: { bio: null },
    });
    expect((JSON.parse(cleared.payload) as ApiEnvelope<UserSelfResponse>).data.bio).toBeNull();
  });

  it('rejects non-allowlisted fields through the shared Zod schema', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/me',
      headers: authHeaders(),
      payload: { handle: 'new-handle' },
    });
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.payload) as ApiErrorEnvelope;
    expect(body.error.category).toBe('validation');
    expect(body.error.code).toBe('VALIDATION_FAILED');
    expect(body.error.fields).toBeDefined();
  });

  it('rejects an out-of-contract bio (max 500)', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/me',
      headers: authHeaders(),
      payload: { bio: 'x'.repeat(501) },
    });
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.payload) as ApiErrorEnvelope;
    expect(body.error.fields?.[0]?.path).toBe('bio');
  });

  it('rejects unconfirmable upload references honestly', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/me',
      headers: authHeaders(),
      payload: { avatarUploadId: 'upload-1' },
    });
    expect(response.statusCode).toBe(400);
    expect((JSON.parse(response.payload) as ApiErrorEnvelope).error.message).toContain(
      'confirmed upload',
    );
  });
});

describe('GET /settings · PATCH /settings/*', () => {
  it('returns section defaults before any settings row exists', async () => {
    const response = await app.inject({ method: 'GET', url: '/settings', headers: authHeaders() });
    expect(response.statusCode).toBe(200);
    expect((JSON.parse(response.payload) as ApiEnvelope<SettingsResponse>).data).toEqual({
      appearance: { theme: 'system', locale: null },
      accessibility: { reduceMotion: false },
    });
  });

  it('patches appearance and accessibility independently', async () => {
    const appearance = await app.inject({
      method: 'PATCH',
      url: '/settings/appearance',
      headers: authHeaders(),
      payload: { theme: 'dark', locale: 'tr' },
    });
    expect(appearance.statusCode).toBe(200);
    expect(
      (JSON.parse(appearance.payload) as ApiEnvelope<SettingsResponse>).data.appearance,
    ).toEqual({ theme: 'dark', locale: 'tr' });

    const accessibility = await app.inject({
      method: 'PATCH',
      url: '/settings/accessibility',
      headers: authHeaders(),
      payload: { reduceMotion: true },
    });
    const body = JSON.parse(accessibility.payload) as ApiEnvelope<SettingsResponse>;
    expect(body.data.accessibility.reduceMotion).toBe(true);
    expect(body.data.appearance).toEqual({ theme: 'dark', locale: 'tr' });
  });

  it('rejects a value outside the closed theme vocabulary', async () => {
    // Dedicated subject avoids shared write-class rate budget exhaustion across the suite.
    userRepo.rows.set('user-theme', makeUser({ id: 'user-theme', handle: 'theme_user' }));
    const tokens = app.get(TokenService);
    const themeToken = await tokens.signAccessToken('user-theme');
    const response = await app.inject({
      method: 'PATCH',
      url: '/settings/appearance',
      headers: { authorization: `Bearer ${themeToken}` },
      payload: { theme: 'neon' },
    });
    expect(response.statusCode).toBe(400);
    expect((JSON.parse(response.payload) as ApiErrorEnvelope).error.category).toBe('validation');
  });
});

describe('GET /connected-accounts', () => {
  it('lists link state read-only — providers, status, linkedAt, scopes only', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/connected-accounts',
      headers: authHeaders(),
    });
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.payload) as ApiEnvelope<ConnectedAccountResponse[]>;
    expect(body.data).toEqual([
      {
        provider: 'steam',
        status: 'connected',
        linkedAt: '2026-02-01T00:00:00.000Z',
        scopes: ['profile'],
      },
      { provider: 'discord', status: 'disconnected', linkedAt: null, scopes: [] },
    ]);
  });
});
