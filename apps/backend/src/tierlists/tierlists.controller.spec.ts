import type { ApiEnvelope, ApiErrorEnvelope, TierListResponse } from '@gmrlog/types';
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

import {
  createFakeGameRepository,
  createFakeTierListRepository,
  createFakeTierSlotRepository,
  createFakeUserRepository,
  makeGame,
  makeUser,
} from './testing/fake-repositories';
import { TierListsModule } from './tierlists.module';
import {
  TIER_LIST_GAME_REPOSITORY,
  TIER_LIST_REPOSITORY,
  TIER_LIST_USER_REPOSITORY,
  TIER_SLOT_REPOSITORY,
} from './tierlists.tokens';
import { SESSION_REPOSITORY } from '../auth/auth.tokens';
import { issueTestAccessToken, MemorySessionRepository } from '../auth/testing/session-fixture';

const tierLists = createFakeTierListRepository();
const slots = createFakeTierSlotRepository();
const games = createFakeGameRepository([
  makeGame({ id: 'game-1', title: 'Hollow Knight', slug: 'hollow-knight' }),
  makeGame({ id: 'game-2', title: 'Celeste', slug: 'celeste' }),
]);
const users = createFakeUserRepository([
  makeUser({ id: 'user-1', handle: 'gamer' }),
  makeUser({ id: 'user-2', handle: 'other' }),
]);
const follows = createFakeFollowRepository();

let app: NestFastifyApplication;
let accessToken: string;
let otherToken: string;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppConfigModule, LoggerModule, HttpInfrastructureModule, AuthModule, TierListsModule],
  })
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(TIER_LIST_REPOSITORY)
    .useValue(tierLists)
    .overrideProvider(TIER_SLOT_REPOSITORY)
    .useValue(slots)
    .overrideProvider(TIER_LIST_USER_REPOSITORY)
    .useValue(users)
    .overrideProvider(TIER_LIST_GAME_REPOSITORY)
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
  tierLists.rows.clear();
  slots.boards.clear();
  follows.rows.clear();
});

function authHeaders(token = accessToken): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

describe('POST /tier-lists', () => {
  it('rejects guests and creates inside the S1 envelope', async () => {
    const guest = await app.inject({
      method: 'POST',
      url: '/tier-lists',
      payload: { title: 'Nope' },
    });
    expect(guest.statusCode).toBe(401);
    expect((JSON.parse(guest.payload) as ApiErrorEnvelope).error.category).toBe('authn');

    const created = await app.inject({
      method: 'POST',
      url: '/tier-lists',
      headers: authHeaders(),
      payload: { title: '  Ranks  ' },
    });
    expect(created.statusCode).toBe(201);
    const body = JSON.parse(created.payload) as ApiEnvelope<TierListResponse>;
    expect(body.meta.requestId).toEqual(expect.any(String));
    expect(body.data).toMatchObject({
      title: 'Ranks',
      visibility: 'public',
      slots: [],
      owner: { handle: 'gamer' },
    });
  });

  it('rejects empty title and unknown fields', async () => {
    const empty = await app.inject({
      method: 'POST',
      url: '/tier-lists',
      headers: authHeaders(),
      payload: { title: '   ' },
    });
    expect(empty.statusCode).toBe(400);

    const unknown = await app.inject({
      method: 'POST',
      url: '/tier-lists',
      headers: authHeaders(),
      payload: { title: 'Ok', votes: 1 },
    });
    expect(unknown.statusCode).toBe(400);
  });
});

describe('GET /tier-lists and /tier-lists/{id}', () => {
  it('lists own tier lists and allows guest public detail', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/tier-lists',
      headers: authHeaders(),
      payload: { title: 'Public' },
    });
    const id = (JSON.parse(created.payload) as ApiEnvelope<TierListResponse>).data.id;

    const listed = await app.inject({
      method: 'GET',
      url: '/tier-lists',
      headers: authHeaders(),
    });
    expect(listed.statusCode).toBe(200);
    expect((JSON.parse(listed.payload) as ApiEnvelope<TierListResponse[]>).data).toHaveLength(1);

    const detail = await app.inject({ method: 'GET', url: `/tier-lists/${id}` });
    expect(detail.statusCode).toBe(200);
    expect((JSON.parse(detail.payload) as ApiEnvelope<TierListResponse>).meta.requestId).toEqual(
      expect.any(String),
    );
  });
});

describe('PATCH / DELETE /tier-lists/{id}', () => {
  it('allows owner patch, forbids others, soft-deletes with 204', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/tier-lists',
      headers: authHeaders(),
      payload: { title: 'Draft' },
    });
    const id = (JSON.parse(created.payload) as ApiEnvelope<TierListResponse>).data.id;

    const patched = await app.inject({
      method: 'PATCH',
      url: `/tier-lists/${id}`,
      headers: authHeaders(),
      payload: { title: 'Edited', visibility: 'private' },
    });
    expect(patched.statusCode).toBe(200);
    expect((JSON.parse(patched.payload) as ApiEnvelope<TierListResponse>).data.title).toBe(
      'Edited',
    );

    const forbidden = await app.inject({
      method: 'PATCH',
      url: `/tier-lists/${id}`,
      headers: authHeaders(otherToken),
      payload: { title: 'Hack' },
    });
    expect(forbidden.statusCode).toBe(403);

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/tier-lists/${id}`,
      headers: authHeaders(),
    });
    expect(deleted.statusCode).toBe(204);

    const missing = await app.inject({
      method: 'GET',
      url: `/tier-lists/${id}`,
      headers: authHeaders(),
    });
    expect(missing.statusCode).toBe(404);
  });
});

describe('PUT /tier-lists/{id}/slots', () => {
  it('replaces board, returns 409 on duplicates, 404 on missing game', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/tier-lists',
      headers: authHeaders(),
      payload: { title: 'Board' },
    });
    const id = (JSON.parse(created.payload) as ApiEnvelope<TierListResponse>).data.id;

    const replaced = await app.inject({
      method: 'PUT',
      url: `/tier-lists/${id}/slots`,
      headers: authHeaders(),
      payload: {
        slots: [
          { label: 'S', gameIds: ['game-2'] },
          { label: 'A', gameIds: ['game-1'] },
        ],
      },
    });
    expect(replaced.statusCode).toBe(200);
    const body = JSON.parse(replaced.payload) as ApiEnvelope<TierListResponse>;
    expect(body.data.slots.map((s) => s.label)).toEqual(['S', 'A']);
    expect(body.data.slots[0]?.games[0]?.gameId).toBe('game-2');

    const duplicate = await app.inject({
      method: 'PUT',
      url: `/tier-lists/${id}/slots`,
      headers: authHeaders(),
      payload: {
        slots: [
          { label: 'S', gameIds: ['game-1'] },
          { label: 'A', gameIds: ['game-1'] },
        ],
      },
    });
    expect(duplicate.statusCode).toBe(409);
    expect((JSON.parse(duplicate.payload) as ApiErrorEnvelope).error.category).toBe('conflict');

    const missingGame = await app.inject({
      method: 'PUT',
      url: `/tier-lists/${id}/slots`,
      headers: authHeaders(),
      payload: { slots: [{ label: 'S', gameIds: ['missing'] }] },
    });
    expect(missingGame.statusCode).toBe(404);
  });
});
