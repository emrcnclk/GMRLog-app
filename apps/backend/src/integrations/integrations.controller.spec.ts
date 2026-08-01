import type {
  ApiEnvelope,
  IntegrationProviderInfo,
  SteamStatusResponse,
  SyncJobResponse,
  UserIntegrationResponse,
} from '@gmrlog/types';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthModule } from '../auth/auth.module';
import { TokenService } from '../auth/jwt/token.service';
import { AppConfigModule } from '../infrastructure/config/config.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { HttpInfrastructureModule } from '../infrastructure/http/http.module';
import { LoggerModule } from '../infrastructure/logging/logger.module';

import { IntegrationsModule } from './integrations.module';
import { IntegrationJobsPublisher } from './integration-jobs.publisher';
import { MockSteamWebApiClient, STEAM_WEB_API_CLIENT } from './steam/steam-web-api.client';

const steamClient = new MockSteamWebApiClient();

const integrations = new Map<
  string,
  {
    id: string;
    userId: string;
    provider: 'steam' | 'csv';
    externalRef: string;
    displayName: string | null;
    status: string;
    syncType: 'manual';
    lastSyncAt: Date | null;
    connectedAt: Date;
    disconnectedAt: Date | null;
  }
>();
const profiles = new Map<string, Record<string, unknown>>();
const syncJobs = new Map<string, Record<string, unknown>>();
const histories: Array<Record<string, unknown>> = [];
const library = new Map<string, Record<string, unknown>>();
const games = new Map<string, { id: string; title: string; slug: string }>();
const externalGames = new Map<string, Record<string, unknown>>();
let seq = 0;
const nextId = (p: string): string => {
  seq += 1;
  return `${p}-${String(seq)}`;
};

function resetStore(): void {
  integrations.clear();
  profiles.clear();
  syncJobs.clear();
  histories.length = 0;
  library.clear();
  games.clear();
  externalGames.clear();
  seq = 0;
}

const prismaMock = {
  userIntegration: {
    findFirst: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
      return (
        [...integrations.values()].find((row) => {
          if (where['id'] !== undefined && row.id !== where['id']) return false;
          if (where['userId'] !== undefined && row.userId !== where['userId']) return false;
          if (where['provider'] !== undefined && row.provider !== where['provider']) return false;
          if (where['status'] !== undefined && row.status !== where['status']) return false;
          if (where['externalRef'] !== undefined && row.externalRef !== where['externalRef']) {
            return false;
          }
          const notUser = (where as { NOT?: { userId: string } }).NOT?.userId;
          if (notUser !== undefined && row.userId === notUser) return false;
          return true;
        }) ?? null
      );
    }),
    findUnique: vi.fn(
      async ({
        where,
      }: {
        where: { userId_provider?: { userId: string; provider: string }; id?: string };
      }) => {
        if (where.userId_provider !== undefined) {
          return (
            [...integrations.values()].find(
              (row) =>
                row.userId === where.userId_provider?.userId &&
                row.provider === where.userId_provider.provider,
            ) ?? null
          );
        }
        return where.id !== undefined ? (integrations.get(where.id) ?? null) : null;
      },
    ),
    findMany: vi.fn(async ({ where }: { where: { userId: string } }) => {
      return [...integrations.values()].filter((row) => row.userId === where.userId);
    }),
    upsert: vi.fn(
      async ({
        where,
        create,
        update,
      }: {
        where: { userId_provider: { userId: string; provider: string } };
        create: Record<string, unknown>;
        update: Record<string, unknown>;
      }) => {
        const existing = [...integrations.values()].find(
          (row) =>
            row.userId === where.userId_provider.userId &&
            row.provider === where.userId_provider.provider,
        );
        if (existing !== undefined) {
          Object.assign(existing, update);
          return existing;
        }
        const row = {
          id: nextId('int'),
          userId: where.userId_provider.userId,
          provider: where.userId_provider.provider as 'steam' | 'csv',
          externalRef: String(create['externalRef']),
          displayName: (create['displayName'] as string | null) ?? null,
          status: String(create['status']),
          syncType: 'manual' as const,
          lastSyncAt: null,
          connectedAt: (create['connectedAt'] as Date) ?? new Date(),
          disconnectedAt: null,
        };
        integrations.set(row.id, row);
        return row;
      },
    ),
    update: vi.fn(
      async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = integrations.get(where.id);
        if (row === undefined) throw new Error('missing');
        Object.assign(row, data);
        return row;
      },
    ),
  },
  externalProfile: {
    // Keyed by (provider, externalId) like the real unique constraint.
    upsert: vi.fn(
      async ({
        where,
        create,
        update,
      }: {
        where: { provider_externalId: { provider: string; externalId: string } };
        create: Record<string, unknown>;
        update: Record<string, unknown>;
      }) => {
        const key = `${where.provider_externalId.provider}:${where.provider_externalId.externalId}`;
        const existing = profiles.get(key);
        if (existing !== undefined) {
          for (const [field, value] of Object.entries(update)) {
            if (value !== undefined) {
              existing[field] = value;
            }
          }
          return existing;
        }
        const row = {
          id: nextId('prof'),
          ...create,
          ...where.provider_externalId,
        };
        profiles.set(key, row);
        return row;
      },
    ),
    findUnique: vi.fn(
      async ({
        where,
      }: {
        where: {
          integrationId?: string;
          provider_externalId?: { provider: string; externalId: string };
        };
      }) => {
        if (where.provider_externalId !== undefined) {
          const key = `${where.provider_externalId.provider}:${where.provider_externalId.externalId}`;
          return profiles.get(key) ?? null;
        }
        for (const row of profiles.values()) {
          if (row['integrationId'] === where.integrationId) {
            return row;
          }
        }
        return null;
      },
    ),
  },
  connectedAccount: {
    upsert: vi.fn(async () => ({})),
    updateMany: vi.fn(async () => ({ count: 1 })),
  },
  activityItem: { create: vi.fn(async () => ({})) },
  notification: { create: vi.fn(async () => ({})) },
  externalGame: {
    count: vi.fn(async () => 0),
    findUnique: vi.fn(
      async ({
        where,
      }: {
        where: { provider_externalId: { provider: string; externalId: string } };
      }) => {
        const key = `${where.provider_externalId.provider}:${where.provider_externalId.externalId}`;
        return externalGames.get(key) ?? null;
      },
    ),
    upsert: vi.fn(
      async ({
        where,
        create,
        update,
      }: {
        where: { provider_externalId: { provider: string; externalId: string } };
        create: Record<string, unknown>;
        update: Record<string, unknown>;
      }) => {
        const key = `${where.provider_externalId.provider}:${where.provider_externalId.externalId}`;
        const existing = externalGames.get(key);
        if (existing !== undefined) {
          Object.assign(existing, update);
          return existing;
        }
        const row = { id: nextId('eg'), ...create, ...where.provider_externalId };
        externalGames.set(key, row);
        return row;
      },
    ),
    update: vi.fn(
      async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        for (const row of externalGames.values()) {
          if (row['id'] === where.id) {
            Object.assign(row, data);
            return row;
          }
        }
        return null;
      },
    ),
  },
  externalAchievement: { count: vi.fn(async () => 0) },
  syncJob: {
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      const row = { id: nextId('job'), attemptCount: 0, ...data };
      syncJobs.set(String(row.id), row);
      return row;
    }),
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
      return syncJobs.get(where.id) ?? null;
    }),
    // Concurrency guard: an integration may hold only one unfinished job.
    findFirst: vi.fn(
      async ({ where }: { where: { integrationId?: string; status?: { in: string[] } } }) => {
        const statuses = where.status?.in ?? [];
        return (
          [...syncJobs.values()].find(
            (row) =>
              (where.integrationId === undefined || row['integrationId'] === where.integrationId) &&
              (statuses.length === 0 || statuses.includes(String(row['status']))),
          ) ?? null
        );
      },
    ),
    update: vi.fn(
      async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = syncJobs.get(where.id);
        if (row === undefined) throw new Error('missing job');
        if (typeof data['attemptCount'] === 'object') {
          row['attemptCount'] = Number(row['attemptCount'] ?? 0) + 1;
        }
        Object.assign(row, data, {
          attemptCount: row['attemptCount'],
        });
        return row;
      },
    ),
  },
  syncHistory: {
    findMany: vi.fn(async () => histories),
    upsert: vi.fn(
      async ({
        where,
        create,
        update,
      }: {
        where: { syncJobId: string };
        create: Record<string, unknown>;
        update: Record<string, unknown>;
      }) => {
        const row = {
          id: nextId('hist'),
          syncJobId: where.syncJobId,
          ...create,
          ...update,
        };
        histories.unshift(row);
        return row;
      },
    ),
  },
  syncConflict: { create: vi.fn(async () => ({})) },
  game: {
    findUnique: vi.fn(async ({ where }: { where: { slug?: string } }) => {
      if (where.slug === undefined) return null;
      return [...games.values()].find((g) => g.slug === where.slug) ?? null;
    }),
    findFirst: vi.fn(async () => null),
    create: vi.fn(async ({ data }: { data: { title: string; slug: string } }) => {
      const row = { id: nextId('game'), title: data.title, slug: data.slug };
      games.set(row.id, row);
      return row;
    }),
  },
  libraryEntry: {
    findUnique: vi.fn(
      async ({ where }: { where: { userId_gameId: { userId: string; gameId: string } } }) => {
        return library.get(`${where.userId_gameId.userId}:${where.userId_gameId.gameId}`) ?? null;
      },
    ),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      const row = {
        id: nextId('lib'),
        ...data,
        updatedAt: new Date(),
        version: 0,
      };
      library.set(`${String(data['userId'])}:${String(data['gameId'])}`, row);
      return row;
    }),
    update: vi.fn(async () => ({})),
    count: vi.fn(async () => 0),
  },
  gameLog: { create: vi.fn(async () => ({})) },
  discoveryScore: { upsert: vi.fn(async () => ({})) },
  review: {
    aggregate: vi.fn(async () => ({ _avg: { rating: null }, _count: { rating: 0 } })),
    count: vi.fn(async () => 0),
  },
  achievement: {
    findMany: vi.fn(async () => []),
    upsert: vi.fn(async () => ({})),
  },
  userAchievement: {
    findMany: vi.fn(async () => []),
    upsert: vi.fn(async () => ({})),
  },
  user: {
    findUnique: vi.fn(async () => ({ id: 'user-1', deletedAt: null })),
    findMany: vi.fn(async () => []),
  },
  $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(prismaMock)),
};

let app: NestFastifyApplication;
let accessToken: string;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [
      AppConfigModule,
      LoggerModule,
      HttpInfrastructureModule,
      AuthModule,
      IntegrationsModule,
    ],
  })
    .overrideProvider(PrismaService)
    .useValue(prismaMock)
    .overrideProvider(STEAM_WEB_API_CLIENT)
    .useValue(steamClient)
    .overrideProvider(IntegrationJobsPublisher)
    .useValue({
      enqueueSync: async () => null,
      enqueueImport: async () => null,
      enqueueReconcile: async () => null,
      enqueueCleanup: async () => null,
      enqueueRetry: async () => null,
    })
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
  resetStore();
});

describe('IntegrationsController', () => {
  it('GET /integrations/providers lists closed vocabulary', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/integrations/providers',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<IntegrationProviderInfo[]>;
    expect(body.data.some((p) => p.id === 'steam' && p.connectable)).toBe(true);
    expect(body.data).toHaveLength(6);
  });

  it('POST /integrations/steam/connect links steam', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/integrations/steam/connect',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { steamIdOrUrl: steamClient.fixtures.steamId64 },
    });
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload) as ApiEnvelope<UserIntegrationResponse>;
    expect(body.data.provider).toBe('steam');
    expect(body.data.externalRef).toBe(steamClient.fixtures.steamId64);
  });

  it('GET /integrations/steam/status reflects connection', async () => {
    await app.inject({
      method: 'POST',
      url: '/integrations/steam/connect',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { steamIdOrUrl: steamClient.fixtures.steamId64 },
    });
    const response = await app.inject({
      method: 'GET',
      url: '/integrations/steam/status',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<SteamStatusResponse>;
    expect(body.data.connected).toBe(true);
  });

  it('GET /integrations lists connected integrations', async () => {
    await app.inject({
      method: 'POST',
      url: '/integrations/steam/connect',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { steamIdOrUrl: steamClient.fixtures.steamId64 },
    });
    const response = await app.inject({
      method: 'GET',
      url: '/integrations',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<UserIntegrationResponse[]>;
    expect(body.data).toHaveLength(1);
  });

  it('POST /integrations/:id/sync runs inline without Redis', async () => {
    const connect = await app.inject({
      method: 'POST',
      url: '/integrations/steam/connect',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { steamIdOrUrl: steamClient.fixtures.steamId64 },
    });
    const connected = JSON.parse(connect.payload) as ApiEnvelope<UserIntegrationResponse>;
    const response = await app.inject({
      method: 'POST',
      url: `/integrations/${connected.data.id}/sync`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {},
    });
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload) as ApiEnvelope<SyncJobResponse>;
    expect(body.data.status).toBe('completed');
  });

  it('POST /integrations/import/csv imports generic rows', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/integrations/import/csv',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        format: 'generic',
        csv: 'title,status,playtimeMin\nHades,completed,120\n',
      },
    });
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload) as ApiEnvelope<SyncJobResponse>;
    expect(body.data.provider).toBe('csv');
    expect(body.data.status).toBe('completed');
  });

  it('GET /integrations/history returns sync history rows', async () => {
    await app.inject({
      method: 'POST',
      url: '/integrations/import/csv',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        format: 'generic',
        csv: 'title,status\nCeleste,playing\n',
      },
    });
    const response = await app.inject({
      method: 'GET',
      url: '/integrations/history',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<unknown[]>;
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('GET /integrations/steam/profile returns projection', async () => {
    await app.inject({
      method: 'POST',
      url: '/integrations/steam/connect',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { steamIdOrUrl: steamClient.fixtures.steamId64 },
    });
    const response = await app.inject({
      method: 'GET',
      url: '/integrations/steam/profile',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<{ steamId: string }>;
    expect(body.data.steamId).toBe(steamClient.fixtures.steamId64);
  });

  it('rejects unauthenticated providers request', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/integrations/providers',
    });
    expect(response.statusCode).toBe(401);
  });
});
