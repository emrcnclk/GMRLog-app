import type {
  ApiEnvelope,
  ApiErrorEnvelope,
  CommunityLeaderboardResponse,
  CommunityMemberResponse,
  CommunityResponse,
} from '@gmrlog/types';
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
import { createFakeUserRepository } from '../users/testing/fake-repositories';

import { CommunitiesModule } from './communities.module';
import {
  COMMUNITY_ACTIVITY_REPOSITORY,
  COMMUNITY_BADGE_REPOSITORY,
  COMMUNITY_COMMENT_REPOSITORY,
  COMMUNITY_EVENT_PARTICIPATION_REPOSITORY,
  COMMUNITY_EVENT_REPOSITORY,
  COMMUNITY_MEMBER_REPOSITORY,
  COMMUNITY_NOTIFICATION_REPOSITORY,
  COMMUNITY_PIN_REPOSITORY,
  COMMUNITY_POST_REPOSITORY,
  COMMUNITY_REPOSITORY,
  COMMUNITY_USER_REPOSITORY,
  COMMUNITY_WIKI_REPOSITORY,
} from './communities.tokens';
import {
  createFakeCommunityActivityRepository,
  createFakeCommunityBadgeRepository,
  createFakeCommunityCommentRepository,
  createFakeCommunityEventParticipationRepository,
  createFakeCommunityEventRepository,
  createFakeCommunityMemberRepository,
  createFakeCommunityPinRepository,
  createFakeCommunityPostRepository,
  createFakeCommunityRepository,
  createFakeCommunityWikiRepository,
  makeCommunity,
  makeCommunityMember,
  makeUser,
} from './testing/fake-repositories';
import { SESSION_REPOSITORY } from '../auth/auth.tokens';
import { issueTestAccessToken, MemorySessionRepository } from '../auth/testing/session-fixture';

const follows = createFakeFollowRepository();
const communities = createFakeCommunityRepository([
  makeCommunity({ id: 'community-1', name: 'Culture Room', slug: 'culture-room' }),
]);
const members = createFakeCommunityMemberRepository([
  makeCommunityMember({
    id: 'member-owner',
    communityId: 'community-1',
    userId: 'user-1',
    role: 'owner',
  }),
]);
const users = createFakeUserRepository([
  makeUser({ id: 'user-1', handle: 'gamer', displayName: 'Gamer' }),
  makeUser({ id: 'user-2', handle: 'other', displayName: 'Other' }),
]);
const communityActivities = createFakeCommunityActivityRepository();
const wiki = createFakeCommunityWikiRepository();
const pins = createFakeCommunityPinRepository();
const badges = createFakeCommunityBadgeRepository();
const posts = createFakeCommunityPostRepository();
const comments = createFakeCommunityCommentRepository();
const events = createFakeCommunityEventRepository();
const eventParticipations = createFakeCommunityEventParticipationRepository();

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
      CommunitiesModule,
    ],
  })
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(COMMUNITY_REPOSITORY)
    .useValue(communities)
    .overrideProvider(COMMUNITY_MEMBER_REPOSITORY)
    .useValue(members)
    .overrideProvider(COMMUNITY_USER_REPOSITORY)
    .useValue(users)
    .overrideProvider(FOLLOW_REPOSITORY)
    .useValue(follows)
    .overrideProvider(COMMUNITY_ACTIVITY_REPOSITORY)
    .useValue(communityActivities)
    .overrideProvider(COMMUNITY_WIKI_REPOSITORY)
    .useValue(wiki)
    .overrideProvider(COMMUNITY_PIN_REPOSITORY)
    .useValue(pins)
    .overrideProvider(COMMUNITY_BADGE_REPOSITORY)
    .useValue(badges)
    .overrideProvider(COMMUNITY_POST_REPOSITORY)
    .useValue(posts)
    .overrideProvider(COMMUNITY_NOTIFICATION_REPOSITORY)
    .useValue({
      create: async () => ({ id: 'n1' }),
    })
    .overrideProvider(COMMUNITY_COMMENT_REPOSITORY)
    .useValue(comments)
    .overrideProvider(COMMUNITY_EVENT_REPOSITORY)
    .useValue(events)
    .overrideProvider(COMMUNITY_EVENT_PARTICIPATION_REPOSITORY)
    .useValue(eventParticipations)
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
  communities.rows.clear();
  communities.rows.set(
    'community-1',
    makeCommunity({ id: 'community-1', name: 'Culture Room', slug: 'culture-room' }),
  );
  members.rows.clear();
  members.rows.set(
    'member-owner',
    makeCommunityMember({
      id: 'member-owner',
      communityId: 'community-1',
      userId: 'user-1',
      role: 'owner',
    }),
  );
  wiki.rows.clear();
  pins.rows.clear();
  badges.rows.clear();
  communityActivities.rows.length = 0;
});

function authHeaders(token = accessToken): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

describe('GET /communities', () => {
  it('lists public communities for guests', async () => {
    const response = await app.inject({ method: 'GET', url: '/communities' });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<CommunityResponse[]>;
    expect(body.data.map((row) => row.id)).toEqual(['community-1']);
  });
});

describe('POST /communities', () => {
  it('rejects guests with authn 401', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/communities',
      payload: { name: 'Room', slug: 'room', visibility: 'public' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('creates a community with 201', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/communities',
      headers: authHeaders(),
      payload: { name: 'Guild', slug: 'guild-room', visibility: 'public' },
    });
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload) as ApiEnvelope<CommunityResponse>;
    expect(body.data).toMatchObject({
      name: 'Guild',
      viewerMembership: { role: 'owner' },
      counts: { members: 1 },
    });
  });

  it('returns 409 on duplicate slug', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/communities',
      headers: authHeaders(),
      payload: { name: 'Dup', slug: 'culture-room', visibility: 'public' },
    });
    expect(response.statusCode).toBe(409);
  });
});

describe('PATCH /communities/{id}', () => {
  it('updates for owner', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/communities/community-1',
      headers: authHeaders(),
      payload: { name: 'Renamed' },
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<CommunityResponse>;
    expect(body.data.name).toBe('Renamed');
  });

  it('returns 403 for non-owner', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/communities/community-1',
      headers: authHeaders(otherToken),
      payload: { name: 'Nope' },
    });
    expect(response.statusCode).toBe(403);
  });
});

describe('DELETE /communities/{id}', () => {
  it('soft-deletes for owner with 204', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/communities/community-1',
      headers: authHeaders(),
    });
    expect(response.statusCode).toBe(204);
    const detail = await app.inject({ method: 'GET', url: '/communities/community-1' });
    expect(detail.statusCode).toBe(404);
  });

  it('returns 403 for non-owner', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/communities/community-1',
      headers: authHeaders(otherToken),
    });
    expect(response.statusCode).toBe(403);
  });
});

describe('GET /communities/{id}', () => {
  it('allows guests with envelope and requestId', async () => {
    const response = await app.inject({ method: 'GET', url: '/communities/community-1' });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<CommunityResponse>;
    expect(body.meta.requestId).toEqual(expect.any(String));
    expect(body.data).toMatchObject({
      id: 'community-1',
      name: 'Culture Room',
      counts: { members: 1 },
      viewerMembership: null,
    });
  });

  it('returns 404 for soft-deleted communities', async () => {
    await communities.softDelete('community-1');
    const response = await app.inject({ method: 'GET', url: '/communities/community-1' });
    expect(response.statusCode).toBe(404);
  });
});

describe('GET /communities/{id}/members', () => {
  it('lists members for guests', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/communities/community-1/members',
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<CommunityMemberResponse[]>;
    expect(body.data[0]).toMatchObject({
      role: 'owner',
      user: { id: 'user-1', handle: 'gamer' },
    });
    expect(body.data[0]?.isContributor).toBe(false);
  });
});

describe('GET /communities/{id}/leaderboard (7.1)', () => {
  it('serves a ranked, windowed leaderboard for guests', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/communities/community-1/leaderboard?window=30d',
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<CommunityLeaderboardResponse>;
    expect(body.data.window).toBe('30d');
    expect(Array.isArray(body.data.entries)).toBe(true);
  });

  it('rejects an invalid window value', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/communities/community-1/leaderboard?window=1d',
    });
    expect(response.statusCode).toBe(400);
  });
});

describe('POST /communities/{id}/membership', () => {
  it('rejects guests with authn 401', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/communities/community-1/membership',
    });
    expect(response.statusCode).toBe(401);
    expect((JSON.parse(response.payload) as ApiErrorEnvelope).error.category).toBe('authn');
  });

  it('joins with 204', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/communities/community-1/membership',
      headers: authHeaders(otherToken),
    });
    expect(response.statusCode).toBe(204);
    expect(members.rows.size).toBe(2);
  });

  it('returns 409 on duplicate join', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/communities/community-1/membership',
      headers: authHeaders(),
    });
    expect(response.statusCode).toBe(409);
  });
});

describe('DELETE /communities/{id}/membership', () => {
  it('leaves with 204 and returns 404 when not a member', async () => {
    const community = communities.rows.get('community-1');
    if (community != null) {
      communities.rows.set('community-1', { ...community, deletedAt: null });
    }

    const join = await app.inject({
      method: 'POST',
      url: '/communities/community-1/membership',
      headers: authHeaders(otherToken),
    });
    expect([204, 409]).toContain(join.statusCode);

    const ok = await app.inject({
      method: 'DELETE',
      url: '/communities/community-1/membership',
      headers: authHeaders(otherToken),
    });
    expect(ok.statusCode).toBe(204);

    const missing = await app.inject({
      method: 'DELETE',
      url: '/communities/community-1/membership',
      headers: authHeaders(otherToken),
    });
    expect(missing.statusCode).toBe(404);
  });
});
