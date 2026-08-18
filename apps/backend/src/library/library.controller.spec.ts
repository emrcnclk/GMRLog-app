import type {
  ApiEnvelope,
  ApiErrorEnvelope,
  LibraryEntryResponse,
  LibraryHubResponse,
} from '@gmrlog/types';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AuthModule } from '../auth/auth.module';
import { AppConfigModule } from '../infrastructure/config/config.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { HttpInfrastructureModule } from '../infrastructure/http/http.module';
import { FeedFanoutPublisher } from '../infrastructure/jobs/feed-fanout.publisher';
import {
  asFeedFanoutPublisher,
  createFakeFeedFanoutPublisher,
} from '../infrastructure/jobs/testing/fake-feed-fanout.publisher';
import { LoggerModule } from '../infrastructure/logging/logger.module';

import { LibraryModule } from './library.module';
import { GAME_LOG_REPOSITORY, GAME_REPOSITORY, LIBRARY_ENTRY_REPOSITORY } from './library.tokens';
import {
  createFakeGameLogRepository,
  createFakeGameRepository,
  createFakeLibraryEntryRepository,
  createFakeWishlistPrisma,
  makeGame,
} from './testing/fake-repositories';
import { SESSION_REPOSITORY } from '../auth/auth.tokens';
import { issueTestAccessToken, MemorySessionRepository } from '../auth/testing/session-fixture';

const entries = createFakeLibraryEntryRepository();
const logs = createFakeGameLogRepository();
const games = createFakeGameRepository([
  makeGame({ id: 'game-1', title: 'Hollow Knight', slug: 'hollow-knight' }),
  makeGame({ id: 'game-2', title: 'Celeste', slug: 'celeste' }),
]);
const feedFanout = createFakeFeedFanoutPublisher();
const prisma = createFakeWishlistPrisma();

let app: NestFastifyApplication;
let accessToken: string;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppConfigModule, LoggerModule, HttpInfrastructureModule, AuthModule, LibraryModule],
  })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .overrideProvider(LIBRARY_ENTRY_REPOSITORY)
    .useValue(entries)
    .overrideProvider(GAME_LOG_REPOSITORY)
    .useValue(logs)
    .overrideProvider(GAME_REPOSITORY)
    .useValue(games)
    .overrideProvider(FeedFanoutPublisher)
    .useValue(asFeedFanoutPublisher(feedFanout))
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
  entries.rows.clear();
  logs.rows.length = 0;
  prisma.rows.clear();
});

function authHeaders(): Record<string, string> {
  return { authorization: `Bearer ${accessToken}` };
}

describe('authentication boundary', () => {
  it('rejects guests with the canonical S1 authn error envelope', async () => {
    const response = await app.inject({ method: 'GET', url: '/library' });
    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.payload) as ApiErrorEnvelope;
    expect(body.error.category).toBe('authn');
    expect(body.error.code).toBe('UNAUTHENTICATED');
  });
});

describe('GET /library', () => {
  it('returns the hub summary inside the S1 §4 envelope', async () => {
    const response = await app.inject({ method: 'GET', url: '/library', headers: authHeaders() });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<LibraryHubResponse>;
    expect(body.meta.requestId).toEqual(expect.any(String));
    expect(body.data.total).toBe(0);
    expect(body.data.counts.owned).toBe(0);
  });
});

describe('PUT /library/entries/:gameId', () => {
  it('upserts a library entry and returns LibraryEntryResponse', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/library/entries/game-1',
      headers: authHeaders(),
      payload: { status: 'playing', note: 'Day one' },
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<LibraryEntryResponse>;
    expect(body.data).toMatchObject({
      gameId: 'game-1',
      status: 'playing',
      source: 'manual',
      game: { id: 'game-1', title: 'Hollow Knight' },
    });
  });

  it('rejects a status outside the closed vocabulary', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/library/entries/game-1',
      headers: authHeaders(),
      payload: { status: 'favorite' },
    });
    expect(response.statusCode).toBe(400);
    expect((JSON.parse(response.payload) as ApiErrorEnvelope).error.category).toBe('validation');
  });

  it('rejects non-allowlisted fields', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/library/entries/game-1',
      headers: authHeaders(),
      payload: { status: 'owned', favorite: true },
    });
    expect(response.statusCode).toBe(400);
  });

  it('returns not_found for an unknown game', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/library/entries/missing',
      headers: authHeaders(),
      payload: { status: 'owned' },
    });
    expect(response.statusCode).toBe(404);
    expect((JSON.parse(response.payload) as ApiErrorEnvelope).error.category).toBe('not_found');
  });
});

describe('GET /library/entries', () => {
  beforeEach(async () => {
    await app.inject({
      method: 'PUT',
      url: '/library/entries/game-1',
      headers: authHeaders(),
      payload: { status: 'playing' },
    });
    await app.inject({
      method: 'PUT',
      url: '/library/entries/game-2',
      headers: authHeaders(),
      payload: { status: 'wishlist' },
    });
  });

  it('lists all entries for the owner', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/library/entries',
      headers: authHeaders(),
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<LibraryEntryResponse[]>;
    expect(body.data).toHaveLength(2);
  });

  it('filters by filter[status]', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/library/entries?filter[status]=wishlist',
      headers: authHeaders(),
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<LibraryEntryResponse[]>;
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.status).toBe('wishlist');
  });
});

describe('GET/DELETE /library/entries/:gameId', () => {
  beforeEach(async () => {
    await app.inject({
      method: 'PUT',
      url: '/library/entries/game-1',
      headers: authHeaders(),
      payload: { status: 'backlog' },
    });
  });

  it('reads a single relationship', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/library/entries/game-1',
      headers: authHeaders(),
    });
    expect(response.statusCode).toBe(200);
    expect((JSON.parse(response.payload) as ApiEnvelope<LibraryEntryResponse>).data.status).toBe(
      'backlog',
    );
  });

  it('hard-deletes with 204 and removes the relationship', async () => {
    const deleted = await app.inject({
      method: 'DELETE',
      url: '/library/entries/game-1',
      headers: authHeaders(),
    });
    expect(deleted.statusCode).toBe(204);

    const missing = await app.inject({
      method: 'GET',
      url: '/library/entries/game-1',
      headers: authHeaders(),
    });
    expect(missing.statusCode).toBe(404);
  });
});
