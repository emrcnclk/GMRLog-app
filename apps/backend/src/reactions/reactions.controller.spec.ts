import type { ApiEnvelope, ApiErrorEnvelope, ReactionResponse } from '@gmrlog/types';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AuthModule } from '../auth/auth.module';
import { TokenService } from '../auth/jwt/token.service';
import {
  createFakeCollectionRepository,
  makeCollection,
} from '../collections/testing/fake-repositories';
import { AppConfigModule } from '../infrastructure/config/config.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { HttpInfrastructureModule } from '../infrastructure/http/http.module';
import { FeedFanoutPublisher } from '../infrastructure/jobs/feed-fanout.publisher';
import {
  asFeedFanoutPublisher,
  createFakeFeedFanoutPublisher,
} from '../infrastructure/jobs/testing/fake-feed-fanout.publisher';
import { LoggerModule } from '../infrastructure/logging/logger.module';
import { createFakeNotificationRepository } from '../notifications/testing/fake-repositories';
import { createFakeTierListRepository, makeTierList } from '../tierlists/testing/fake-repositories';

import { ReactionsModule } from './reactions.module';
import {
  REACTION_COLLECTION_REPOSITORY,
  REACTION_COMMENT_REPOSITORY,
  REACTION_NOTIFICATION_REPOSITORY,
  REACTION_POST_REPOSITORY,
  REACTION_REPOSITORY,
  REACTION_REVIEW_REPOSITORY,
  REACTION_TIER_LIST_REPOSITORY,
  REACTION_USER_REPOSITORY,
} from './reactions.tokens';
import {
  createFakeCommentRepository,
  createFakePostRepository,
  createFakeReactionRepository,
  createFakeReviewRepository,
  createFakeUserRepository,
  makeComment,
  makePost,
  makeReview,
  makeUser,
} from './testing/fake-repositories';

const reactions = createFakeReactionRepository();
const users = createFakeUserRepository([
  makeUser({ id: 'user-1', handle: 'gamer' }),
  makeUser({ id: 'user-2', handle: 'other' }),
]);
const posts = createFakePostRepository([makePost({ id: 'post-1' })]);
const reviews = createFakeReviewRepository([makeReview({ id: 'review-1' })]);
const comments = createFakeCommentRepository([makeComment({ id: 'comment-1' })]);
const collections = createFakeCollectionRepository([
  makeCollection({ id: 'collection-1', ownerId: 'user-1' }),
]);
const tierLists = createFakeTierListRepository([makeTierList({ id: 'tier-1', ownerId: 'user-1' })]);
const notifications = createFakeNotificationRepository();
const feedFanout = createFakeFeedFanoutPublisher();

let app: NestFastifyApplication;
let accessToken: string;
let otherToken: string;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppConfigModule, LoggerModule, HttpInfrastructureModule, AuthModule, ReactionsModule],
  })
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(REACTION_REPOSITORY)
    .useValue(reactions)
    .overrideProvider(REACTION_USER_REPOSITORY)
    .useValue(users)
    .overrideProvider(REACTION_POST_REPOSITORY)
    .useValue(posts)
    .overrideProvider(REACTION_REVIEW_REPOSITORY)
    .useValue(reviews)
    .overrideProvider(REACTION_COMMENT_REPOSITORY)
    .useValue(comments)
    .overrideProvider(REACTION_COLLECTION_REPOSITORY)
    .useValue(collections)
    .overrideProvider(REACTION_TIER_LIST_REPOSITORY)
    .useValue(tierLists)
    .overrideProvider(REACTION_NOTIFICATION_REPOSITORY)
    .useValue(notifications)
    .overrideProvider(FeedFanoutPublisher)
    .useValue(asFeedFanoutPublisher(feedFanout))
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
  reactions.rows.clear();
  notifications.rows.clear();
  feedFanout.calls.length = 0;
});

function authHeaders(token = accessToken): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

describe('POST /reactions', () => {
  it('rejects guests with the canonical S1 authn error', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/reactions',
      payload: { targetType: 'review', targetId: 'review-1', kind: 'like' },
    });
    expect(response.statusCode).toBe(401);
    expect((JSON.parse(response.payload) as ApiErrorEnvelope).error.category).toBe('authn');
  });

  it('creates a reaction inside the S1 §4 envelope', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/reactions',
      headers: authHeaders(),
      payload: { targetType: 'review', targetId: 'review-1', kind: '  like  ' },
    });
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload) as ApiEnvelope<ReactionResponse>;
    expect(body.meta.requestId).toEqual(expect.any(String));
    expect(body.data).toMatchObject({
      targetType: 'review',
      targetId: 'review-1',
      kind: 'like',
      actor: { handle: 'gamer' },
    });
  });

  it('rejects unknown targetType, empty kind, and invalid target id', async () => {
    const unknown = await app.inject({
      method: 'POST',
      url: '/reactions',
      headers: authHeaders(),
      payload: { targetType: 'game', targetId: 'review-1', kind: 'like' },
    });
    expect(unknown.statusCode).toBe(400);

    const emptyKind = await app.inject({
      method: 'POST',
      url: '/reactions',
      headers: authHeaders(),
      payload: { targetType: 'review', targetId: 'review-1', kind: '   ' },
    });
    expect(emptyKind.statusCode).toBe(400);

    const missingTarget = await app.inject({
      method: 'POST',
      url: '/reactions',
      headers: authHeaders(),
      payload: { targetType: 'comment', targetId: 'missing', kind: 'like' },
    });
    expect(missingTarget.statusCode).toBe(404);
  });

  it('returns 409 on duplicate actor/target/kind', async () => {
    const payload = { targetType: 'post', targetId: 'post-1', kind: 'like' };
    const first = await app.inject({
      method: 'POST',
      url: '/reactions',
      headers: authHeaders(),
      payload,
    });
    expect(first.statusCode).toBe(201);

    const second = await app.inject({
      method: 'POST',
      url: '/reactions',
      headers: authHeaders(),
      payload,
    });
    expect(second.statusCode).toBe(409);
    expect((JSON.parse(second.payload) as ApiErrorEnvelope).error.category).toBe('conflict');
  });
});

describe('DELETE /reactions/{id}', () => {
  it('rejects guests and non-owners', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/reactions',
      headers: authHeaders(),
      payload: { targetType: 'comment', targetId: 'comment-1', kind: 'like' },
    });
    const id = (JSON.parse(created.payload) as ApiEnvelope<ReactionResponse>).data.id;

    const guest = await app.inject({ method: 'DELETE', url: `/reactions/${id}` });
    expect(guest.statusCode).toBe(401);

    const forbidden = await app.inject({
      method: 'DELETE',
      url: `/reactions/${id}`,
      headers: authHeaders(otherToken),
    });
    expect(forbidden.statusCode).toBe(403);
  });

  it('hard-deletes an owned reaction with 204', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/reactions',
      headers: authHeaders(),
      payload: { targetType: 'review', targetId: 'review-1', kind: 'like' },
    });
    const id = (JSON.parse(created.payload) as ApiEnvelope<ReactionResponse>).data.id;

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/reactions/${id}`,
      headers: authHeaders(),
    });
    expect(deleted.statusCode).toBe(204);
    expect(reactions.rows.has(id)).toBe(false);
  });
});
