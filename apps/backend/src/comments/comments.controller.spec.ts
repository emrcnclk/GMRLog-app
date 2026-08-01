import type { ApiEnvelope, ApiErrorEnvelope, CommentResponse } from '@gmrlog/types';
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
import {
  asFeedFanoutPublisher,
  createFakeFeedFanoutPublisher,
} from '../infrastructure/jobs/testing/fake-feed-fanout.publisher';
import { FeedFanoutPublisher } from '../infrastructure/jobs/feed-fanout.publisher';
import { LoggerModule } from '../infrastructure/logging/logger.module';
import { createFakeNotificationRepository } from '../notifications/testing/fake-repositories';
import { createFakeTierListRepository, makeTierList } from '../tierlists/testing/fake-repositories';

import { CommentsModule } from './comments.module';
import {
  COMMENT_COLLECTION_REPOSITORY,
  COMMENT_NOTIFICATION_REPOSITORY,
  COMMENT_POST_REPOSITORY,
  COMMENT_REPOSITORY,
  COMMENT_REVIEW_REPOSITORY,
  COMMENT_TIER_LIST_REPOSITORY,
  COMMENT_USER_REPOSITORY,
} from './comments.tokens';
import {
  createFakeCommentRepository,
  createFakePostRepository,
  createFakeReviewRepository,
  createFakeUserRepository,
  makePost,
  makeReview,
  makeUser,
} from './testing/fake-repositories';

const comments = createFakeCommentRepository();
const users = createFakeUserRepository([
  makeUser({ id: 'user-1', handle: 'gamer' }),
  makeUser({ id: 'user-2', handle: 'other' }),
]);
const posts = createFakePostRepository([makePost({ id: 'post-1' })]);
const reviews = createFakeReviewRepository([makeReview({ id: 'review-1' })]);
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
    imports: [AppConfigModule, LoggerModule, HttpInfrastructureModule, AuthModule, CommentsModule],
  })
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(COMMENT_REPOSITORY)
    .useValue(comments)
    .overrideProvider(COMMENT_USER_REPOSITORY)
    .useValue(users)
    .overrideProvider(COMMENT_POST_REPOSITORY)
    .useValue(posts)
    .overrideProvider(COMMENT_REVIEW_REPOSITORY)
    .useValue(reviews)
    .overrideProvider(COMMENT_COLLECTION_REPOSITORY)
    .useValue(collections)
    .overrideProvider(COMMENT_TIER_LIST_REPOSITORY)
    .useValue(tierLists)
    .overrideProvider(COMMENT_NOTIFICATION_REPOSITORY)
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
  comments.rows.clear();
  notifications.rows.clear();
  feedFanout.calls.length = 0;
});

function authHeaders(token = accessToken): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

describe('POST /comments', () => {
  it('rejects guests with the canonical S1 authn error', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/comments',
      payload: { hostType: 'review', hostId: 'review-1', body: 'Hi' },
    });
    expect(response.statusCode).toBe(401);
    expect((JSON.parse(response.payload) as ApiErrorEnvelope).error.category).toBe('authn');
  });

  it('creates a comment inside the S1 §4 envelope', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/comments',
      headers: authHeaders(),
      payload: { hostType: 'review', hostId: 'review-1', body: '  Trimmed  ' },
    });
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload) as ApiEnvelope<CommentResponse>;
    expect(body.meta.requestId).toEqual(expect.any(String));
    expect(body.data).toMatchObject({
      body: 'Trimmed',
      hostType: 'review',
      hostId: 'review-1',
      parentCommentId: null,
      author: { handle: 'gamer' },
    });
  });

  it('rejects unknown hostType and empty body', async () => {
    const unknown = await app.inject({
      method: 'POST',
      url: '/comments',
      headers: authHeaders(),
      payload: { hostType: 'game', hostId: 'review-1', body: 'Nope' },
    });
    expect(unknown.statusCode).toBe(400);

    const empty = await app.inject({
      method: 'POST',
      url: '/comments',
      headers: authHeaders(),
      payload: { hostType: 'review', hostId: 'review-1', body: '   ' },
    });
    expect(empty.statusCode).toBe(400);
    expect((JSON.parse(empty.payload) as ApiErrorEnvelope).error.category).toBe('validation');
  });
});

describe('GET /reviews/:id/comments · GET /posts/:id/comments', () => {
  it('lists flat comments for guests on a review host', async () => {
    await app.inject({
      method: 'POST',
      url: '/comments',
      headers: authHeaders(),
      payload: { hostType: 'review', hostId: 'review-1', body: 'Root' },
    });
    const response = await app.inject({ method: 'GET', url: '/reviews/review-1/comments' });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<CommentResponse[]>;
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.body).toBe('Root');
  });

  it('lists flat comments for a post host', async () => {
    await app.inject({
      method: 'POST',
      url: '/comments',
      headers: authHeaders(),
      payload: { hostType: 'post', hostId: 'post-1', body: 'On post' },
    });
    const response = await app.inject({ method: 'GET', url: '/posts/post-1/comments' });
    expect(response.statusCode).toBe(200);
    expect((JSON.parse(response.payload) as ApiEnvelope<CommentResponse[]>).data).toHaveLength(1);
  });
});

describe('PATCH /comments/:id', () => {
  it('edits own comment body', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/comments',
      headers: authHeaders(),
      payload: { hostType: 'review', hostId: 'review-1', body: 'Original' },
    });
    const id = (JSON.parse(created.payload) as ApiEnvelope<CommentResponse>).data.id;
    const response = await app.inject({
      method: 'PATCH',
      url: `/comments/${id}`,
      headers: authHeaders(),
      payload: { body: 'Edited' },
    });
    expect(response.statusCode).toBe(200);
    expect((JSON.parse(response.payload) as ApiEnvelope<CommentResponse>).data.body).toBe('Edited');
  });
});

describe('GET /collections/:id/comments · GET /tier-lists/:id/comments', () => {
  it('lists collection host comments', async () => {
    await app.inject({
      method: 'POST',
      url: '/comments',
      headers: authHeaders(otherToken),
      payload: { hostType: 'collection', hostId: 'collection-1', body: 'On collection' },
    });
    const response = await app.inject({
      method: 'GET',
      url: '/collections/collection-1/comments',
    });
    expect(response.statusCode).toBe(200);
    expect((JSON.parse(response.payload) as ApiEnvelope<CommentResponse[]>).data).toHaveLength(1);
  });
});

describe('DELETE /comments/:id', () => {
  let commentId: string;

  beforeEach(async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/comments',
      headers: authHeaders(),
      payload: { hostType: 'review', hostId: 'review-1', body: 'Delete me' },
    });
    commentId = (JSON.parse(created.payload) as ApiEnvelope<CommentResponse>).data.id;
  });

  it('forbids non-authors', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/comments/${commentId}`,
      headers: authHeaders(otherToken),
    });
    expect(response.statusCode).toBe(403);
    expect((JSON.parse(response.payload) as ApiErrorEnvelope).error.category).toBe('authz');
  });

  it('soft-deletes with 204 and hides from listings', async () => {
    const deleted = await app.inject({
      method: 'DELETE',
      url: `/comments/${commentId}`,
      headers: authHeaders(),
    });
    expect(deleted.statusCode).toBe(204);

    const listed = await app.inject({ method: 'GET', url: '/reviews/review-1/comments' });
    expect((JSON.parse(listed.payload) as ApiEnvelope<CommentResponse[]>).data).toHaveLength(0);
  });
});
