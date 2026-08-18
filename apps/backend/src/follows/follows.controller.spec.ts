import type {
  ApiEnvelope,
  ApiErrorEnvelope,
  FollowResponse,
  UserPublicResponse,
} from '@gmrlog/types';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AuthModule } from '../auth/auth.module';
import { AppConfigModule } from '../infrastructure/config/config.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { HttpInfrastructureModule } from '../infrastructure/http/http.module';
import { LoggerModule } from '../infrastructure/logging/logger.module';

import { FollowsModule } from './follows.module';
import { FOLLOW_REPOSITORY, FOLLOW_USER_REPOSITORY } from './follows.tokens';
import { createFakeFollowRepository, makeFollow, makeUser } from './testing/fake-repositories';
import { createFakeUserRepository } from '../users/testing/fake-repositories';
import { SESSION_REPOSITORY } from '../auth/auth.tokens';
import { issueTestAccessToken, MemorySessionRepository } from '../auth/testing/session-fixture';

const follows = createFakeFollowRepository();
const users = createFakeUserRepository([
  makeUser({ id: 'user-1', handle: 'gamer', displayName: 'Gamer' }),
  makeUser({ id: 'user-2', handle: 'other', displayName: 'Other' }),
  makeUser({ id: 'user-3', handle: 'third', displayName: 'Third' }),
]);

let app: NestFastifyApplication;
let accessToken: string;
let otherToken: string;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppConfigModule, LoggerModule, HttpInfrastructureModule, AuthModule, FollowsModule],
  })
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(FOLLOW_REPOSITORY)
    .useValue(follows)
    .overrideProvider(FOLLOW_USER_REPOSITORY)
    .useValue(users)
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
  follows.rows.clear();
});

function authHeaders(token = accessToken): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

describe('POST /follows', () => {
  it('rejects guests with authn 401', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/follows',
      payload: { userId: 'user-2' },
    });
    expect(response.statusCode).toBe(401);
    expect((JSON.parse(response.payload) as ApiErrorEnvelope).error.category).toBe('authn');
  });

  it('follows a user inside the S1 envelope', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/follows',
      headers: authHeaders(),
      payload: { userId: 'user-2' },
    });
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload) as ApiEnvelope<FollowResponse>;
    expect(body.meta.requestId).toEqual(expect.any(String));
    expect(body.data).toMatchObject({
      follower: { id: 'user-1' },
      followee: { id: 'user-2' },
    });
  });

  it('returns 409 on duplicate and 400 on self-follow', async () => {
    await app.inject({
      method: 'POST',
      url: '/follows',
      headers: authHeaders(),
      payload: { userId: 'user-2' },
    });
    const duplicate = await app.inject({
      method: 'POST',
      url: '/follows',
      headers: authHeaders(),
      payload: { userId: 'user-2' },
    });
    expect(duplicate.statusCode).toBe(409);

    const self = await app.inject({
      method: 'POST',
      url: '/follows',
      headers: authHeaders(),
      payload: { userId: 'user-1' },
    });
    expect(self.statusCode).toBe(400);
  });

  it('returns 404 for unknown followee', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/follows',
      headers: authHeaders(),
      payload: { userId: 'missing-user' },
    });
    expect(response.statusCode).toBe(404);
  });
});

describe('DELETE /follows/{userId}', () => {
  it('hard-deletes with 204', async () => {
    follows.rows.set('f-1', makeFollow({ id: 'f-1', followerId: 'user-1', followeeId: 'user-2' }));
    const response = await app.inject({
      method: 'DELETE',
      url: '/follows/user-2',
      headers: authHeaders(),
    });
    expect(response.statusCode).toBe(204);
    expect(follows.rows.size).toBe(0);
  });

  it('returns 404 when relationship is missing', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/follows/user-2',
      headers: authHeaders(),
    });
    expect(response.statusCode).toBe(404);
  });
});

describe('GET /users/{id}/followers|following', () => {
  it('allows guests to read public lists with requestId', async () => {
    follows.rows.set(
      'f-1',
      makeFollow({
        id: 'f-1',
        followerId: 'user-2',
        followeeId: 'user-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    );
    follows.rows.set(
      'f-2',
      makeFollow({
        id: 'f-2',
        followerId: 'user-1',
        followeeId: 'user-3',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    );

    const followers = await app.inject({ method: 'GET', url: '/users/user-1/followers' });
    expect(followers.statusCode).toBe(200);
    const followersBody = JSON.parse(followers.payload) as ApiEnvelope<UserPublicResponse[]>;
    expect(followersBody.meta.requestId).toEqual(expect.any(String));
    expect(followersBody.data).toEqual([
      expect.objectContaining({ id: 'user-2', handle: 'other' }),
    ]);

    const following = await app.inject({ method: 'GET', url: '/users/user-1/following' });
    expect(following.statusCode).toBe(200);
    const followingBody = JSON.parse(following.payload) as ApiEnvelope<UserPublicResponse[]>;
    expect(followingBody.data).toEqual([
      expect.objectContaining({ id: 'user-3', handle: 'third' }),
    ]);
  });
});

describe('GET /me/followers|following', () => {
  it('requires authentication and lists the actor edges', async () => {
    follows.rows.set('f-1', makeFollow({ id: 'f-1', followerId: 'user-2', followeeId: 'user-1' }));

    const guest = await app.inject({ method: 'GET', url: '/me/followers' });
    expect(guest.statusCode).toBe(401);

    const mine = await app.inject({
      method: 'GET',
      url: '/me/followers',
      headers: authHeaders(),
    });
    expect(mine.statusCode).toBe(200);
    const body = JSON.parse(mine.payload) as ApiEnvelope<UserPublicResponse[]>;
    expect(body.data[0]?.id).toBe('user-2');

    void otherToken;
  });
});
