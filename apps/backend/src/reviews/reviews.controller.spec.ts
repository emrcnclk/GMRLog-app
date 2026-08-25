import type { ApiEnvelope, ApiErrorEnvelope, ReviewResponse } from '@gmrlog/types';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AuthModule } from '../auth/auth.module';
import {
  asFeedFanoutPublisher,
  createFakeFeedFanoutPublisher,
} from '../infrastructure/jobs/testing/fake-feed-fanout.publisher';
import { FeedFanoutPublisher } from '../infrastructure/jobs/feed-fanout.publisher';
import {
  asSearchIndexPublisher,
  createFakeSearchIndexPublisher,
} from '../infrastructure/jobs/testing/fake-search-index.publisher';
import { SearchIndexPublisher } from '../infrastructure/jobs/search-index.publisher';
import { JOBS_CONNECTION } from '../infrastructure/jobs/jobs.constants';
import { JobsService } from '../infrastructure/jobs/jobs.service';
import {
  asJobsService,
  createFakeJobsService,
} from '../infrastructure/jobs/testing/fake-jobs.service';
import { FOLLOW_REPOSITORY } from '../follows/follows.tokens';
import { createFakeFollowRepository } from '../follows/testing/fake-repositories';
import { AppConfigModule } from '../infrastructure/config/config.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { HttpInfrastructureModule } from '../infrastructure/http/http.module';
import { LoggerModule } from '../infrastructure/logging/logger.module';

import { ReviewsModule } from './reviews.module';
import {
  REVIEW_GAME_REPOSITORY,
  REVIEW_REPOSITORY,
  REVIEW_USER_REPOSITORY,
} from './reviews.tokens';
import {
  createFakeGameRepository,
  createFakeReviewRepository,
  createFakeUserRepository,
  makeGame,
  makeUser,
} from './testing/fake-repositories';
import { SESSION_REPOSITORY } from '../auth/auth.tokens';
import { issueTestAccessToken, MemorySessionRepository } from '../auth/testing/session-fixture';

const reviews = createFakeReviewRepository();
const games = createFakeGameRepository([
  makeGame({ id: 'game-1', title: 'Hollow Knight', slug: 'hollow-knight' }),
]);
const users = createFakeUserRepository([
  makeUser({ id: 'user-1', handle: 'gamer', displayName: 'Gamer' }),
  makeUser({ id: 'user-2', handle: 'other', displayName: 'Other' }),
]);
const follows = createFakeFollowRepository();
const feedFanout = createFakeFeedFanoutPublisher();

let app: NestFastifyApplication;
let accessToken: string;
let otherToken: string;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppConfigModule, LoggerModule, HttpInfrastructureModule, AuthModule, ReviewsModule],
  })
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(REVIEW_REPOSITORY)
    .useValue(reviews)
    .overrideProvider(REVIEW_GAME_REPOSITORY)
    .useValue(games)
    .overrideProvider(REVIEW_USER_REPOSITORY)
    .useValue(users)
    .overrideProvider(FOLLOW_REPOSITORY)
    .useValue(follows)
    .overrideProvider(FeedFanoutPublisher)
    .useValue(asFeedFanoutPublisher(feedFanout))
    .overrideProvider(SearchIndexPublisher)
    .useValue(asSearchIndexPublisher(createFakeSearchIndexPublisher()))
    .overrideProvider(JOBS_CONNECTION)
    .useValue({ disconnect: () => undefined })
    // A bare JOBS_CONNECTION stub is read by BullMQ as connection *options*,
    // not as a client, so any getQueue() reached from here would dial a real
    // localhost Redis. See fake-jobs.service.ts.
    .overrideProvider(JobsService)
    .useValue(asJobsService(createFakeJobsService()))
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
  reviews.rows.clear();
  follows.rows.clear();
});

function authHeaders(token = accessToken): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

describe('POST /reviews', () => {
  it('rejects guests with the canonical S1 authn error', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/reviews',
      payload: { gameId: 'game-1', rating: 8 },
    });
    expect(response.statusCode).toBe(401);
    expect((JSON.parse(response.payload) as ApiErrorEnvelope).error.category).toBe('authn');
  });

  it('creates a review inside the S1 §4 envelope', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/reviews',
      headers: authHeaders(),
      payload: { gameId: 'game-1', rating: 8, containsSpoilers: true, body: 'Wow' },
    });
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload) as ApiEnvelope<ReviewResponse>;
    expect(body.meta.requestId).toEqual(expect.any(String));
    expect(body.data).toMatchObject({
      rating: 8,
      containsSpoilers: true,
      visibility: 'public',
      gameId: 'game-1',
      author: { handle: 'gamer' },
    });
  });

  it('rejects a rating outside the closed 1–10 integer scale', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/reviews',
      headers: authHeaders(),
      payload: { gameId: 'game-1', rating: 11 },
    });
    expect(response.statusCode).toBe(400);
    expect((JSON.parse(response.payload) as ApiErrorEnvelope).error.category).toBe('validation');
  });

  it('rejects a second active review for the same game (conflict)', async () => {
    await app.inject({
      method: 'POST',
      url: '/reviews',
      headers: authHeaders(),
      payload: { gameId: 'game-1', rating: 7 },
    });
    const response = await app.inject({
      method: 'POST',
      url: '/reviews',
      headers: authHeaders(),
      payload: { gameId: 'game-1', rating: 8 },
    });
    expect(response.statusCode).toBe(409);
    expect((JSON.parse(response.payload) as ApiErrorEnvelope).error.category).toBe('conflict');
  });
});

describe('GET /reviews/:id · GET /games/:id/reviews', () => {
  let reviewId: string;

  beforeEach(async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/reviews',
      headers: authHeaders(),
      payload: { gameId: 'game-1', rating: 9, body: 'Public take' },
    });
    reviewId = (JSON.parse(created.payload) as ApiEnvelope<ReviewResponse>).data.id;
  });

  it('allows guests to read a public review', async () => {
    const response = await app.inject({ method: 'GET', url: `/reviews/${reviewId}` });
    expect(response.statusCode).toBe(200);
    expect((JSON.parse(response.payload) as ApiEnvelope<ReviewResponse>).data.rating).toBe(9);
  });

  it('lists public game reviews for guests', async () => {
    const response = await app.inject({ method: 'GET', url: '/games/game-1/reviews' });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<ReviewResponse[]>;
    expect(body.data).toHaveLength(1);
  });
});

describe('PATCH /reviews/:id · DELETE /reviews/:id', () => {
  let reviewId: string;

  beforeEach(async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/reviews',
      headers: authHeaders(),
      payload: { gameId: 'game-1', rating: 5 },
    });
    reviewId = (JSON.parse(created.payload) as ApiEnvelope<ReviewResponse>).data.id;
  });

  it('patches own review fields', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/reviews/${reviewId}`,
      headers: authHeaders(),
      payload: { rating: 10, containsSpoilers: true, visibility: 'private' },
    });
    expect(response.statusCode).toBe(200);
    expect((JSON.parse(response.payload) as ApiEnvelope<ReviewResponse>).data).toMatchObject({
      rating: 10,
      containsSpoilers: true,
      visibility: 'private',
    });
  });

  it('forbids another player from patching', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/reviews/${reviewId}`,
      headers: authHeaders(otherToken),
      payload: { rating: 1 },
    });
    expect(response.statusCode).toBe(403);
    expect((JSON.parse(response.payload) as ApiErrorEnvelope).error.category).toBe('authz');
  });

  it('soft-deletes with 204 and hides the review', async () => {
    const deleted = await app.inject({
      method: 'DELETE',
      url: `/reviews/${reviewId}`,
      headers: authHeaders(),
    });
    expect(deleted.statusCode).toBe(204);

    const missing = await app.inject({ method: 'GET', url: `/reviews/${reviewId}` });
    expect(missing.statusCode).toBe(404);
  });
});
