import type { ApiEnvelope, ApiErrorEnvelope, CollectionResponse } from '@gmrlog/types';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AuthModule } from '../auth/auth.module';
import { FOLLOW_REPOSITORY } from '../follows/follows.tokens';
import { createFakeFollowRepository } from '../follows/testing/fake-repositories';
import { AppConfigModule } from '../infrastructure/config/config.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { HttpInfrastructureModule } from '../infrastructure/http/http.module';
import { LoggerModule } from '../infrastructure/logging/logger.module';

import { CollectionsModule } from './collections.module';
import {
  COLLECTION_ENTRY_REPOSITORY,
  COLLECTION_GAME_REPOSITORY,
  COLLECTION_REPOSITORY,
  COLLECTION_USER_REPOSITORY,
} from './collections.tokens';
import { DynamicCollectionResolver } from './dynamic-collection.resolver';
import {
  createFakeCollectionEntryRepository,
  createFakeCollectionPrisma,
  createFakeCollectionRepository,
  createFakeDynamicCollectionResolver,
  createFakeGameRepository,
  createFakeUserRepository,
  makeGame,
  makeUser,
} from './testing/fake-repositories';
import { SESSION_REPOSITORY } from '../auth/auth.tokens';
import { issueTestAccessToken, MemorySessionRepository } from '../auth/testing/session-fixture';

const collections = createFakeCollectionRepository();
const entries = createFakeCollectionEntryRepository();
const games = createFakeGameRepository([
  makeGame({ id: 'game-1', title: 'Hollow Knight', slug: 'hollow-knight' }),
  makeGame({ id: 'game-2', title: 'Celeste', slug: 'celeste' }),
]);
const users = createFakeUserRepository([
  makeUser({ id: 'user-1', handle: 'gamer' }),
  makeUser({ id: 'user-2', handle: 'other' }),
]);
const follows = createFakeFollowRepository();
const prisma = createFakeCollectionPrisma();
const dynamicResolver = createFakeDynamicCollectionResolver();

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
      CollectionsModule,
    ],
  })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .overrideProvider(DynamicCollectionResolver)
    .useValue(dynamicResolver)
    .overrideProvider(COLLECTION_REPOSITORY)
    .useValue(collections)
    .overrideProvider(COLLECTION_ENTRY_REPOSITORY)
    .useValue(entries)
    .overrideProvider(COLLECTION_USER_REPOSITORY)
    .useValue(users)
    .overrideProvider(COLLECTION_GAME_REPOSITORY)
    .useValue(games)
    .overrideProvider(FOLLOW_REPOSITORY)
    .useValue(follows)
    .overrideProvider(SESSION_REPOSITORY)
    .useValue(new MemorySessionRepository())
    .compile();

  app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  accessToken = await issueTestAccessToken(moduleRef, 'user-1');
  otherToken = await issueTestAccessToken(moduleRef, 'user-2');
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  collections.rows.clear();
  entries.rows.clear();
  follows.rows.clear();
  prisma.rows.clear();
});

function authHeaders(token = accessToken): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

describe('POST /collections', () => {
  it('rejects guests and creates inside the S1 envelope', async () => {
    const guest = await app.inject({
      method: 'POST',
      url: '/collections',
      payload: { title: 'Nope' },
    });
    expect(guest.statusCode).toBe(401);
    expect((JSON.parse(guest.payload) as ApiErrorEnvelope).error.category).toBe('authn');

    const created = await app.inject({
      method: 'POST',
      url: '/collections',
      headers: authHeaders(),
      payload: { title: '  Shelf  ', description: 'Picks' },
    });
    expect(created.statusCode).toBe(201);
    const body = JSON.parse(created.payload) as ApiEnvelope<CollectionResponse>;
    expect(body.meta.requestId).toEqual(expect.any(String));
    expect(body.data).toMatchObject({
      title: 'Shelf',
      description: 'Picks',
      visibility: 'public',
      entries: [],
      owner: { handle: 'gamer' },
    });
  });

  it('rejects empty title and unknown fields', async () => {
    const empty = await app.inject({
      method: 'POST',
      url: '/collections',
      headers: authHeaders(),
      payload: { title: '   ' },
    });
    expect(empty.statusCode).toBe(400);

    const unknown = await app.inject({
      method: 'POST',
      url: '/collections',
      headers: authHeaders(),
      payload: { title: 'Ok', ranking: 1 },
    });
    expect(unknown.statusCode).toBe(400);
  });
});

describe('GET /collections and /collections/{id}', () => {
  it('lists own collections and allows guest public detail', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/collections',
      headers: authHeaders(),
      payload: { title: 'Public' },
    });
    const id = (JSON.parse(created.payload) as ApiEnvelope<CollectionResponse>).data.id;

    const listed = await app.inject({
      method: 'GET',
      url: '/collections',
      headers: authHeaders(),
    });
    expect(listed.statusCode).toBe(200);
    expect((JSON.parse(listed.payload) as ApiEnvelope<CollectionResponse[]>).data).toHaveLength(1);

    const detail = await app.inject({ method: 'GET', url: `/collections/${id}` });
    expect(detail.statusCode).toBe(200);
    expect((JSON.parse(detail.payload) as ApiEnvelope<CollectionResponse>).meta.requestId).toEqual(
      expect.any(String),
    );
  });
});

describe('PATCH / DELETE /collections/{id}', () => {
  it('allows owner patch, forbids others, soft-deletes with 204', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/collections',
      headers: authHeaders(),
      payload: { title: 'Draft' },
    });
    const id = (JSON.parse(created.payload) as ApiEnvelope<CollectionResponse>).data.id;

    const patched = await app.inject({
      method: 'PATCH',
      url: `/collections/${id}`,
      headers: authHeaders(),
      payload: { title: 'Edited', visibility: 'private' },
    });
    expect(patched.statusCode).toBe(200);
    expect((JSON.parse(patched.payload) as ApiEnvelope<CollectionResponse>).data.title).toBe(
      'Edited',
    );

    const forbidden = await app.inject({
      method: 'PATCH',
      url: `/collections/${id}`,
      headers: authHeaders(otherToken),
      payload: { title: 'Hack' },
    });
    expect(forbidden.statusCode).toBe(403);

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/collections/${id}`,
      headers: authHeaders(),
    });
    expect(deleted.statusCode).toBe(204);

    const missing = await app.inject({
      method: 'GET',
      url: `/collections/${id}`,
      headers: authHeaders(),
    });
    expect(missing.statusCode).toBe(404);
  });
});

describe('PUT /collections/{id}/entries', () => {
  it('replaces entries, returns 409 on duplicates, 404 on missing game', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/collections',
      headers: authHeaders(),
      payload: { title: 'Games' },
    });
    const id = (JSON.parse(created.payload) as ApiEnvelope<CollectionResponse>).data.id;

    const replaced = await app.inject({
      method: 'PUT',
      url: `/collections/${id}/entries`,
      headers: authHeaders(),
      payload: { entries: [{ gameId: 'game-2' }, { gameId: 'game-1', note: 'Best' }] },
    });
    expect(replaced.statusCode).toBe(200);
    const body = JSON.parse(replaced.payload) as ApiEnvelope<CollectionResponse>;
    expect(body.data.entries.map((e) => e.gameId)).toEqual(['game-2', 'game-1']);

    const duplicate = await app.inject({
      method: 'PUT',
      url: `/collections/${id}/entries`,
      headers: authHeaders(),
      payload: { entries: [{ gameId: 'game-1' }, { gameId: 'game-1' }] },
    });
    expect(duplicate.statusCode).toBe(409);
    expect((JSON.parse(duplicate.payload) as ApiErrorEnvelope).error.category).toBe('conflict');

    const missingGame = await app.inject({
      method: 'PUT',
      url: `/collections/${id}/entries`,
      headers: authHeaders(),
      payload: { entries: [{ gameId: 'missing' }] },
    });
    expect(missingGame.statusCode).toBe(404);
  });
});
