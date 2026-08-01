import type { ApiEnvelope, SearchHit } from '@gmrlog/types';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AuthModule } from '../auth/auth.module';
import { TokenService } from '../auth/jwt/token.service';
import { AppConfigModule } from '../infrastructure/config/config.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { HttpInfrastructureModule } from '../infrastructure/http/http.module';
import { LoggerModule } from '../infrastructure/logging/logger.module';
import { MeiliClientService } from '../infrastructure/search/meili.client';

import { SearchModule } from './search.module';
import { SEARCH_REPOSITORY } from './search.tokens';
import { createFakeSearchRepository } from './testing/fake-repositories';
import { GAME_CATALOG_DEFAULTS } from '../games/game-catalog.defaults';

const searchRepo = createFakeSearchRepository([
  {
    type: 'game',
    id: 'game-1',
    orderedAt: new Date('2026-01-02T00:00:00.000Z'),
    game: {
      id: 'game-1',
      title: 'Culture Quest',
      slug: 'culture-quest',
      coverKey: null,
      releaseDate: null,
      featured: false,
      popularity: 0,
      franchiseId: null,
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      ...GAME_CATALOG_DEFAULTS,
    },
  },
  {
    type: 'post',
    id: 'post-private',
    orderedAt: new Date('2026-01-01T00:00:00.000Z'),
    post: {
      id: 'post-private',
      authorId: 'user-2',
      gameId: null,
      communityId: null,
      body: 'culture hidden',
      visibility: 'private',
      postKind: 'text' as const,
      containsSpoilers: false,
      pinnedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      deletedAt: null,
    },
  },
]);

let app: NestFastifyApplication;
let accessToken: string;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppConfigModule, LoggerModule, HttpInfrastructureModule, AuthModule, SearchModule],
  })
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(SEARCH_REPOSITORY)
    .useValue(searchRepo)
    .overrideProvider(MeiliClientService)
    .useValue({ isAvailable: () => false, multiSearch: async () => [] })
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
  searchRepo.hits = [
    {
      type: 'game',
      id: 'game-1',
      orderedAt: new Date('2026-01-02T00:00:00.000Z'),
      game: {
        id: 'game-1',
        title: 'Culture Quest',
        slug: 'culture-quest',
        coverKey: null,
        releaseDate: null,
        featured: false,
        popularity: 0,
        franchiseId: null,
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        ...GAME_CATALOG_DEFAULTS,
      },
    },
    {
      type: 'post',
      id: 'post-private',
      orderedAt: new Date('2026-01-01T00:00:00.000Z'),
      post: {
        id: 'post-private',
        authorId: 'user-2',
        gameId: null,
        communityId: null,
        body: 'culture hidden',
        visibility: 'private',
        postKind: 'text' as const,
        containsSpoilers: false,
        pinnedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        deletedAt: null,
      },
    },
  ];
});

describe('GET /search', () => {
  it('returns hits for guests with envelope when q is provided', async () => {
    const response = await app.inject({ method: 'GET', url: '/search?q=culture' });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<SearchHit[]>;
    expect(body.meta.requestId).toEqual(expect.any(String));
    expect(body.data).toEqual([
      {
        type: 'game',
        id: 'game-1',
        // D3.25 — catalog fields default cleanly for an un-enriched game.
        summary: {
          title: 'Culture Quest',
          slug: 'culture-quest',
          coverImageUrl: null,
          summary: null,
          genres: [],
        },
      },
    ]);
    expect(body.meta.cursor?.next).toBeNull();
  });

  it('returns 400 when q is missing', async () => {
    const response = await app.inject({ method: 'GET', url: '/search' });
    expect(response.statusCode).toBe(400);
  });

  it('returns 400 for invalid cursor', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/search?q=culture&cursor=invalid',
    });
    expect(response.statusCode).toBe(400);
  });

  it('allows authenticated search with envelope', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/search?q=culture',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<SearchHit[]>;
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('returns empty data for unmatched queries', async () => {
    const response = await app.inject({ method: 'GET', url: '/search?q=missing-term' });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<SearchHit[]>;
    expect(body.data).toEqual([]);
  });
});
