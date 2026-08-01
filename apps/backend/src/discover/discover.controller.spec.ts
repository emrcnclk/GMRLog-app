import type {
  ApiEnvelope,
  CommunityResponse,
  DiscoverHubResponse,
  EventResponse,
} from '@gmrlog/types';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AuthModule } from '../auth/auth.module';
import { TokenService } from '../auth/jwt/token.service';
import {
  createFakeCommunityMemberRepository,
  makeCommunity,
  makeCommunityMember,
} from '../communities/testing/fake-repositories';
import { AppConfigModule } from '../infrastructure/config/config.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { HttpInfrastructureModule } from '../infrastructure/http/http.module';
import { LoggerModule } from '../infrastructure/logging/logger.module';

import { DiscoverModule } from './discover.module';
import { DISCOVER_COMMUNITY_MEMBER_REPOSITORY, DISCOVER_REPOSITORY } from './discover.tokens';
import { createFakeDiscoverRepository } from './testing/fake-repositories';
import { GAME_CATALOG_DEFAULTS } from '../games/game-catalog.defaults';

const discover = createFakeDiscoverRepository({
  communities: [
    makeCommunity({
      id: 'community-1',
      name: 'Culture Room',
      slug: 'culture-room',
      visibility: 'public',
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    }),
  ],
  events: [
    {
      id: 'event-1',
      title: 'Launch Night',
      kind: 'community',
      description: null,
      startsAt: new Date('2026-01-02T00:00:00.000Z'),
      endsAt: null,
      gameId: null,
      communityId: 'community-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      deletedAt: null,
    },
  ],
});
const members = createFakeCommunityMemberRepository([
  makeCommunityMember({
    id: 'member-1',
    communityId: 'community-1',
    userId: 'user-1',
    role: 'owner',
  }),
]);

let app: NestFastifyApplication;
let accessToken: string;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppConfigModule, LoggerModule, HttpInfrastructureModule, AuthModule, DiscoverModule],
  })
    .overrideProvider(PrismaService)
    .useValue({
      user: { findMany: async () => [], findUnique: async () => null },
      collection: { findMany: async () => [] },
      game: { findMany: async () => [], findUnique: async () => null },
      libraryEntry: {
        groupBy: async () => [],
        count: async () => 0,
        findMany: async () => [],
      },
      review: {
        groupBy: async () => [],
        count: async () => 0,
        aggregate: async () => ({ _avg: { rating: null }, _count: { rating: 0 } }),
        findMany: async () => [],
      },
      discoveryScore: { findMany: async () => [], upsert: async () => ({}) },
      gameSimilarity: { findMany: async () => [], upsert: async () => ({}) },
      userSimilarity: { findMany: async () => [], upsert: async () => ({}) },
      recommendationRule: { findMany: async () => [] },
      friendRequest: { findMany: async () => [] },
      follow: { groupBy: async () => [], findMany: async () => [] },
      block: { findMany: async () => [] },
      gameGenre: { findMany: async () => [] },
      gamePlatform: { findMany: async () => [] },
      collectionFollower: { groupBy: async () => [] },
      communityMember: { groupBy: async () => [] },
    })
    .overrideProvider(DISCOVER_REPOSITORY)
    .useValue(discover)
    .overrideProvider(DISCOVER_COMMUNITY_MEMBER_REPOSITORY)
    .useValue(members)
    .compile();

  app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  const tokens = moduleRef.get(TokenService);
  accessToken = await tokens.signAccessToken('user-1');
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  discover.communities = [
    makeCommunity({
      id: 'community-1',
      name: 'Culture Room',
      slug: 'culture-room',
      visibility: 'public',
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    }),
  ];
  discover.events = [
    {
      id: 'event-1',
      title: 'Launch Night',
      kind: 'community',
      description: null,
      startsAt: new Date('2026-01-02T00:00:00.000Z'),
      endsAt: null,
      gameId: null,
      communityId: 'community-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      deletedAt: null,
    },
  ];
});

describe('GET /discover', () => {
  it('returns hub modules for guests with envelope', async () => {
    const response = await app.inject({ method: 'GET', url: '/discover' });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<DiscoverHubResponse>;
    expect(body.meta.requestId).toEqual(expect.any(String));
    expect(body.data.modules).toEqual([
      { id: 'games', href: '/discover/games' },
      { id: 'trending', href: '/discover/trending' },
      { id: 'popular', href: '/discover/popular' },
      { id: 'hidden-gems', href: '/discover/hidden-gems' },
      { id: 'recommended', href: '/discover/recommended' },
      { id: 'collections', href: '/discover/collections' },
      { id: 'communities', href: '/discover/communities' },
      { id: 'events', href: '/discover/events' },
      { id: 'because-you-played', href: '/discover/because-you-played' },
    ]);
  });
});

describe('GET /discover/popular', () => {
  it('lists popular games for guests', async () => {
    const response = await app.inject({ method: 'GET', url: '/discover/popular' });
    expect(response.statusCode).toBe(200);
  });
});

describe('GET /discover/trending', () => {
  it('lists trending games for guests', async () => {
    const response = await app.inject({ method: 'GET', url: '/discover/trending?window=7d' });
    expect(response.statusCode).toBe(200);
  });
});

describe('GET /discover/hidden-gems', () => {
  it('lists hidden gems for guests', async () => {
    const response = await app.inject({ method: 'GET', url: '/discover/hidden-gems' });
    expect(response.statusCode).toBe(200);
  });
});

describe('GET /discover/recommended', () => {
  it('lists recommendations for guests', async () => {
    const response = await app.inject({ method: 'GET', url: '/discover/recommended' });
    expect(response.statusCode).toBe(200);
  });
});

describe('GET /discover/collections', () => {
  it('lists public collections for guests', async () => {
    const response = await app.inject({ method: 'GET', url: '/discover/collections' });
    expect(response.statusCode).toBe(200);
  });
});

describe('GET /discover/games', () => {
  it('lists game cards for guests with envelope', async () => {
    discover.games = [
      {
        game: {
          id: 'game-1',
          title: 'Culture Quest',
          slug: 'culture-quest',
          coverKey: null,
          releaseDate: new Date('2026-01-02T00:00:00.000Z'),
          featured: true,
          popularity: 5,
          franchiseId: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          ...GAME_CATALOG_DEFAULTS,
        },
        genres: [],
        platforms: [],
        ratingAverage: null,
        ratingCount: 0,
        libraryCount: 0,
      },
    ];
    const response = await app.inject({ method: 'GET', url: '/discover/games' });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<
      Array<{ id: string; title: string; slug: string }>
    >;
    expect(body.data[0]).toMatchObject({
      id: 'game-1',
      title: 'Culture Quest',
      slug: 'culture-quest',
    });
  });
});

describe('GET /discover/communities', () => {
  it('lists public communities with cursor meta for guests', async () => {
    const response = await app.inject({ method: 'GET', url: '/discover/communities' });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<CommunityResponse[]>;
    expect(body.data[0]).toMatchObject({ id: 'community-1', name: 'Culture Room' });
    expect(body.meta.cursor?.next).toBeNull();
  });

  it('includes viewerMembership for authenticated members', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/discover/communities',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<CommunityResponse[]>;
    expect(body.data[0]?.viewerMembership?.role).toBe('owner');
  });

  it('returns 400 for invalid cursor', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/discover/communities?cursor=invalid',
    });
    expect(response.statusCode).toBe(400);
  });
});

describe('GET /discover/events', () => {
  it('lists events for guests with envelope', async () => {
    const response = await app.inject({ method: 'GET', url: '/discover/events' });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<EventResponse[]>;
    expect(body.data[0]).toMatchObject({
      id: 'event-1',
      title: 'Launch Night',
      viewerParticipation: null,
      communityId: 'community-1',
    });
  });
});

describe('GET /discover/similar-games/:id', () => {
  it('returns 404 when game is missing', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/discover/similar-games/missing-game',
    });
    expect(response.statusCode).toBe(404);
  });
});

describe('GET /discover/similar-users/:id', () => {
  it('returns 404 when user is missing', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/discover/similar-users/missing-user',
    });
    expect(response.statusCode).toBe(404);
  });
});
