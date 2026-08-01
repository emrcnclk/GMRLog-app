import type { ApiEnvelope, ApiErrorEnvelope, PostResponse } from '@gmrlog/types';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AuthModule } from '../auth/auth.module';
import {
  createFakeFeedFanoutPublisher,
  asFeedFanoutPublisher,
} from '../infrastructure/jobs/testing/fake-feed-fanout.publisher';
import { FeedFanoutPublisher } from '../infrastructure/jobs/feed-fanout.publisher';
import {
  asSearchIndexPublisher,
  createFakeSearchIndexPublisher,
} from '../infrastructure/jobs/testing/fake-search-index.publisher';
import { SearchIndexPublisher } from '../infrastructure/jobs/search-index.publisher';
import { JOBS_CONNECTION } from '../infrastructure/jobs/jobs.constants';
import {
  createFakeCommunityMemberRepository,
  createFakeCommunityRepository,
  makeCommunity,
  makeCommunityMember,
} from '../communities/testing/fake-repositories';
import { FOLLOW_REPOSITORY } from '../follows/follows.tokens';
import { createFakeFollowRepository } from '../follows/testing/fake-repositories';
import { TokenService } from '../auth/jwt/token.service';
import { AppConfigModule } from '../infrastructure/config/config.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { HttpInfrastructureModule } from '../infrastructure/http/http.module';
import { LoggerModule } from '../infrastructure/logging/logger.module';
import { createFakeNotificationRepository } from '../notifications/testing/fake-repositories';

import { PostsModule } from './posts.module';
import {
  POST_BOOKMARK_REPOSITORY,
  POST_COMMUNITY_MEMBER_REPOSITORY,
  POST_COMMUNITY_REPOSITORY,
  POST_GAME_REPOSITORY,
  POST_NOTIFICATION_REPOSITORY,
  POST_POLL_REPOSITORY,
  POST_POLL_VOTE_REPOSITORY,
  POST_REPOSITORY,
  POST_REPOST_REPOSITORY,
  POST_USER_REPOSITORY,
} from './posts.tokens';
import {
  createFakeGameRepository,
  createFakePollRepository,
  createFakePollVoteRepository,
  createFakePostBookmarkRepository,
  createFakePostRepository,
  createFakeRepostRepository,
  createFakeUserRepository,
  makeGame,
  makeUser,
} from './testing/fake-repositories';

const posts = createFakePostRepository();
const games = createFakeGameRepository([
  makeGame({ id: 'game-1', title: 'Hollow Knight', slug: 'hollow-knight' }),
]);
const users = createFakeUserRepository([
  makeUser({ id: 'user-1', handle: 'gamer', displayName: 'Gamer' }),
  makeUser({ id: 'user-2', handle: 'other', displayName: 'Other' }),
]);
const follows = createFakeFollowRepository();
const communities = createFakeCommunityRepository([
  makeCommunity({ id: 'community-1', slug: 'culture-room' }),
]);
const communityMembers = createFakeCommunityMemberRepository([
  makeCommunityMember({
    id: 'member-1',
    communityId: 'community-1',
    userId: 'user-1',
    role: 'owner',
  }),
]);
const feedFanout = createFakeFeedFanoutPublisher();
const reposts = createFakeRepostRepository();
const polls = createFakePollRepository();
const pollVotes = createFakePollVoteRepository();
const bookmarks = createFakePostBookmarkRepository();
const notifications = createFakeNotificationRepository();

let app: NestFastifyApplication;
let accessToken: string;
let otherToken: string;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppConfigModule, LoggerModule, HttpInfrastructureModule, AuthModule, PostsModule],
  })
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(POST_REPOSITORY)
    .useValue(posts)
    .overrideProvider(POST_GAME_REPOSITORY)
    .useValue(games)
    .overrideProvider(POST_USER_REPOSITORY)
    .useValue(users)
    .overrideProvider(FOLLOW_REPOSITORY)
    .useValue(follows)
    .overrideProvider(POST_COMMUNITY_REPOSITORY)
    .useValue(communities)
    .overrideProvider(POST_COMMUNITY_MEMBER_REPOSITORY)
    .useValue(communityMembers)
    .overrideProvider(POST_REPOST_REPOSITORY)
    .useValue(reposts)
    .overrideProvider(POST_POLL_REPOSITORY)
    .useValue(polls)
    .overrideProvider(POST_POLL_VOTE_REPOSITORY)
    .useValue(pollVotes)
    .overrideProvider(POST_BOOKMARK_REPOSITORY)
    .useValue(bookmarks)
    .overrideProvider(POST_NOTIFICATION_REPOSITORY)
    .useValue(notifications)
    .overrideProvider(FeedFanoutPublisher)
    .useValue(asFeedFanoutPublisher(feedFanout))
    .overrideProvider(SearchIndexPublisher)
    .useValue(asSearchIndexPublisher(createFakeSearchIndexPublisher()))
    .overrideProvider(JOBS_CONNECTION)
    .useValue({ disconnect: () => undefined })
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
  posts.rows.clear();
  follows.rows.clear();
  reposts.rows.clear();
  polls.rows.clear();
  pollVotes.rows.clear();
  bookmarks.rows.clear();
  notifications.rows.clear();
});

function authHeaders(token = accessToken): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

describe('POST /posts', () => {
  it('rejects guests with the canonical S1 authn error', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/posts',
      payload: { body: 'Hello' },
    });
    expect(response.statusCode).toBe(401);
    expect((JSON.parse(response.payload) as ApiErrorEnvelope).error.category).toBe('authn');
  });

  it('creates a post inside the S1 §4 envelope', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/posts',
      headers: authHeaders(),
      payload: { body: '  Trimmed  ', gameId: 'game-1' },
    });
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload) as ApiEnvelope<PostResponse>;
    expect(body.meta.requestId).toEqual(expect.any(String));
    expect(body.data).toMatchObject({
      body: 'Trimmed',
      visibility: 'public',
      gameId: 'game-1',
      author: { handle: 'gamer' },
    });
  });

  it('rejects empty body, unknown fields, and deferred media', async () => {
    const empty = await app.inject({
      method: 'POST',
      url: '/posts',
      headers: authHeaders(),
      payload: { body: '   ' },
    });
    expect(empty.statusCode).toBe(400);

    const unknown = await app.inject({
      method: 'POST',
      url: '/posts',
      headers: authHeaders(),
      payload: { body: 'Hi', rankingScore: 1 },
    });
    expect(unknown.statusCode).toBe(400);

    const media = await app.inject({
      method: 'POST',
      url: '/posts',
      headers: authHeaders(),
      payload: { body: 'Hi', mediaUploadIds: ['upload-1'] },
    });
    expect(media.statusCode).toBe(400);
  });

  it('creates a community post when the author is a member', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/posts',
      headers: authHeaders(),
      payload: { body: 'Room note', communityId: 'community-1' },
    });
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload) as ApiEnvelope<PostResponse>;
    expect(body.data.communityId).toBe('community-1');
  });

  it('rejects community posts from non-members with 403', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/posts',
      headers: authHeaders(otherToken),
      payload: { body: 'Intruder', communityId: 'community-1' },
    });
    expect(response.statusCode).toBe(403);
  });
});

describe('GET /posts/{id} and /games/{id}/posts', () => {
  it('allows guest public read and game list', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/posts',
      headers: authHeaders(),
      payload: { body: 'Public', gameId: 'game-1' },
    });
    const id = (JSON.parse(created.payload) as ApiEnvelope<PostResponse>).data.id;

    const detail = await app.inject({ method: 'GET', url: `/posts/${id}` });
    expect(detail.statusCode).toBe(200);
    expect((JSON.parse(detail.payload) as ApiEnvelope<PostResponse>).meta.requestId).toEqual(
      expect.any(String),
    );

    const listed = await app.inject({ method: 'GET', url: '/games/game-1/posts' });
    expect(listed.statusCode).toBe(200);
    expect((JSON.parse(listed.payload) as ApiEnvelope<PostResponse[]>).data).toHaveLength(1);
  });
});

describe('PATCH / DELETE /posts/{id}', () => {
  it('allows author patch and forbids others', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/posts',
      headers: authHeaders(),
      payload: { body: 'Draft' },
    });
    const id = (JSON.parse(created.payload) as ApiEnvelope<PostResponse>).data.id;

    const patched = await app.inject({
      method: 'PATCH',
      url: `/posts/${id}`,
      headers: authHeaders(),
      payload: { body: 'Edited' },
    });
    expect(patched.statusCode).toBe(200);
    expect((JSON.parse(patched.payload) as ApiEnvelope<PostResponse>).data.body).toBe('Edited');

    const forbidden = await app.inject({
      method: 'PATCH',
      url: `/posts/${id}`,
      headers: authHeaders(otherToken),
      payload: { body: 'Hack' },
    });
    expect(forbidden.statusCode).toBe(403);
  });

  it('soft-deletes owned posts with 204', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/posts',
      headers: authHeaders(),
      payload: { body: 'Bye', gameId: 'game-1' },
    });
    const id = (JSON.parse(created.payload) as ApiEnvelope<PostResponse>).data.id;

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/posts/${id}`,
      headers: authHeaders(),
    });
    expect(deleted.statusCode).toBe(204);

    const missing = await app.inject({ method: 'GET', url: `/posts/${id}` });
    expect(missing.statusCode).toBe(404);

    const listed = await app.inject({ method: 'GET', url: '/games/game-1/posts' });
    expect((JSON.parse(listed.payload) as ApiEnvelope<PostResponse[]>).data).toHaveLength(0);
  });
});

async function createPost(payload: Record<string, unknown>, token = accessToken): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/posts',
    headers: authHeaders(token),
    payload,
  });
  return (JSON.parse(response.payload) as ApiEnvelope<PostResponse>).data.id;
}

describe('POST/DELETE /posts/{id}/repost', () => {
  it('reposts, is idempotent-conflict on repeat, and undoes', async () => {
    const id = await createPost({ body: 'Original' });

    const reposted = await app.inject({
      method: 'POST',
      url: `/posts/${id}/repost`,
      headers: authHeaders(otherToken),
    });
    expect(reposted.statusCode).toBe(201);

    const again = await app.inject({
      method: 'POST',
      url: `/posts/${id}/repost`,
      headers: authHeaders(otherToken),
    });
    expect(again.statusCode).toBe(409);

    const undone = await app.inject({
      method: 'DELETE',
      url: `/posts/${id}/repost`,
      headers: authHeaders(otherToken),
    });
    expect(undone.statusCode).toBe(204);
  });
});

describe('POST/DELETE /posts/{id}/pin', () => {
  it('pins and unpins the author’s own post', async () => {
    const id = await createPost({ body: 'Mine' });

    const pinned = await app.inject({
      method: 'POST',
      url: `/posts/${id}/pin`,
      headers: authHeaders(),
    });
    expect(pinned.statusCode).toBe(201);
    expect((JSON.parse(pinned.payload) as ApiEnvelope<PostResponse>).data.pinnedAt).not.toBeNull();

    const forbidden = await app.inject({
      method: 'POST',
      url: `/posts/${id}/pin`,
      headers: authHeaders(otherToken),
    });
    expect(forbidden.statusCode).toBe(403);

    const unpinned = await app.inject({
      method: 'DELETE',
      url: `/posts/${id}/pin`,
      headers: authHeaders(),
    });
    expect(unpinned.statusCode).toBe(204);
  });
});

describe('POST/DELETE /posts/{id}/bookmark and GET /bookmarks', () => {
  it('bookmarks, lists, and unbookmarks', async () => {
    const id = await createPost({ body: 'Save me' });

    const bookmarked = await app.inject({
      method: 'POST',
      url: `/posts/${id}/bookmark`,
      headers: authHeaders(otherToken),
    });
    expect(bookmarked.statusCode).toBe(201);

    const listed = await app.inject({
      method: 'GET',
      url: '/bookmarks',
      headers: authHeaders(otherToken),
    });
    expect(listed.statusCode).toBe(200);
    const listedBody = JSON.parse(listed.payload) as ApiEnvelope<Array<{ postId: string }>>;
    expect(listedBody.data.map((b) => b.postId)).toContain(id);

    const removed = await app.inject({
      method: 'DELETE',
      url: `/posts/${id}/bookmark`,
      headers: authHeaders(otherToken),
    });
    expect(removed.statusCode).toBe(204);
  });

  it('rejects guests from bookmark routes', async () => {
    const id = await createPost({ body: 'Save me' });
    const response = await app.inject({ method: 'POST', url: `/posts/${id}/bookmark` });
    expect(response.statusCode).toBe(401);
  });
});

describe('POST /posts/{id}/poll/vote', () => {
  it('creates a poll on compose, votes, and aggregates results on GET', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/posts',
      headers: authHeaders(),
      payload: {
        body: 'Which wins?',
        postKind: 'poll',
        poll: { question: 'Which wins?', options: ['A', 'B'] },
      },
    });
    const id = (JSON.parse(created.payload) as ApiEnvelope<PostResponse>).data.id;

    const voted = await app.inject({
      method: 'POST',
      url: `/posts/${id}/poll/vote`,
      headers: authHeaders(otherToken),
      payload: { optionIndex: 1 },
    });
    expect(voted.statusCode).toBe(201);

    const conflict = await app.inject({
      method: 'POST',
      url: `/posts/${id}/poll/vote`,
      headers: authHeaders(otherToken),
      payload: { optionIndex: 0 },
    });
    expect(conflict.statusCode).toBe(409);

    const fetched = await app.inject({ method: 'GET', url: `/posts/${id}` });
    const fetchedBody = JSON.parse(fetched.payload) as ApiEnvelope<PostResponse>;
    expect(fetchedBody.data.poll).toMatchObject({
      totalVotes: 1,
      options: [
        { index: 0, label: 'A', voteCount: 0 },
        { index: 1, label: 'B', voteCount: 1 },
      ],
    });
  });
});
