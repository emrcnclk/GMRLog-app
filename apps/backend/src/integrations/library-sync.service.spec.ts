import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LibrarySyncService } from './library-sync.service';
import { MockSteamWebApiClient } from './steam/steam-web-api.client';

function createLibraryPrismaMock() {
  const games = new Map<string, { id: string; title: string; slug: string }>();
  const library = new Map<
    string,
    {
      id: string;
      userId: string;
      gameId: string;
      status: string;
      source: string;
      updatedAt: Date;
      version: number;
    }
  >();
  const externalGames = new Map<
    string,
    {
      id: string;
      provider: string;
      externalId: string;
      title: string | null;
      integrationId: string | null;
      internalGameId: string | null;
      playtimeForeverMin: number | null;
      playtime2WeeksMin: number | null;
      lastPlayedAt: Date | null;
      mappingConfidence: number;
    }
  >();
  const syncJobs = new Map<
    string,
    {
      id: string;
      userId: string;
      integrationId: string | null;
      provider: 'steam' | 'csv';
      syncType: 'manual';
      status: string;
      attemptCount: number;
      startedAt: Date | null;
      finishedAt: Date | null;
      errorCode: string | null;
    }
  >();
  const histories = new Map<string, Record<string, unknown>>();
  const activities: unknown[] = [];
  const notifications: unknown[] = [];
  const logs: unknown[] = [];
  let seq = 0;

  const nextId = (prefix: string): string => {
    seq += 1;
    return `${prefix}-${String(seq)}`;
  };

  return {
    games,
    library,
    externalGames,
    syncJobs,
    histories,
    activities,
    notifications,
    logs,
    prisma: {
      syncJob: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          return syncJobs.get(where.id) ?? null;
        }),
        update: vi.fn(
          async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
            const job = syncJobs.get(where.id);
            if (job === undefined) {
              throw new Error('missing job');
            }
            if (data['attemptCount'] !== undefined && typeof data['attemptCount'] === 'object') {
              job.attemptCount += 1;
            } else if (typeof data['attemptCount'] === 'number') {
              job.attemptCount = data['attemptCount'];
            }
            if (data['status'] !== undefined) job.status = String(data['status']);
            if (data['startedAt'] !== undefined) job.startedAt = data['startedAt'] as Date;
            if (data['finishedAt'] !== undefined) {
              job.finishedAt = data['finishedAt'] as Date | null;
            }
            if (Object.prototype.hasOwnProperty.call(data, 'errorCode')) {
              job.errorCode = data['errorCode'] as string | null;
            }
            return job;
          },
        ),
      },
      userIntegration: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          if (where.id === 'int-steam') {
            return {
              id: 'int-steam',
              userId: 'user-1',
              provider: 'steam',
              externalRef: '76561198000000001',
              status: 'connected',
            };
          }
          return null;
        }),
        update: vi.fn(async () => ({})),
      },
      externalGame: {
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
            const row = {
              id: nextId('eg'),
              provider: where.provider_externalId.provider,
              externalId: where.provider_externalId.externalId,
              title: (create['title'] as string | null) ?? null,
              integrationId: (create['integrationId'] as string | null) ?? null,
              internalGameId: null,
              playtimeForeverMin: (create['playtimeForeverMin'] as number | null) ?? null,
              playtime2WeeksMin: (create['playtime2WeeksMin'] as number | null) ?? null,
              lastPlayedAt: (create['lastPlayedAt'] as Date | null) ?? null,
              mappingConfidence: 0,
            };
            externalGames.set(key, row);
            return row;
          },
        ),
        update: vi.fn(
          async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
            for (const row of externalGames.values()) {
              if (row.id === where.id) {
                Object.assign(row, data);
                return row;
              }
            }
            return null;
          },
        ),
      },
      game: {
        findUnique: vi.fn(async ({ where }: { where: { slug?: string; id?: string } }) => {
          if (where.slug !== undefined) {
            return [...games.values()].find((g) => g.slug === where.slug) ?? null;
          }
          return where.id !== undefined ? (games.get(where.id) ?? null) : null;
        }),
        findFirst: vi.fn(async ({ where }: { where: { title: { equals: string } } }) => {
          const title = where.title.equals.toLowerCase();
          return [...games.values()].find((g) => g.title.toLowerCase() === title) ?? null;
        }),
        create: vi.fn(async ({ data }: { data: { title: string; slug: string } }) => {
          const row = { id: nextId('game'), title: data.title, slug: data.slug };
          games.set(row.id, row);
          return row;
        }),
      },
      libraryEntry: {
        findUnique: vi.fn(
          async ({ where }: { where: { userId_gameId: { userId: string; gameId: string } } }) => {
            const key = `${where.userId_gameId.userId}:${where.userId_gameId.gameId}`;
            return library.get(key) ?? null;
          },
        ),
        create: vi.fn(
          async ({
            data,
          }: {
            data: { userId: string; gameId: string; status: string; source: string };
          }) => {
            const row = {
              id: nextId('lib'),
              userId: data.userId,
              gameId: data.gameId,
              status: data.status,
              source: data.source,
              updatedAt: new Date('2026-01-01T00:00:00.000Z'),
              version: 0,
            };
            library.set(`${data.userId}:${data.gameId}`, row);
            return row;
          },
        ),
        update: vi.fn(
          async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
            for (const [key, row] of library.entries()) {
              if (row.id === where.id) {
                if (data['status'] !== undefined) row.status = String(data['status']);
                row.version += 1;
                row.updatedAt = new Date();
                library.set(key, row);
                return row;
              }
            }
            return null;
          },
        ),
      },
      gameLog: {
        create: vi.fn(async (args: unknown) => {
          logs.push(args);
          return {};
        }),
      },
      syncHistory: {
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
            const existing = histories.get(where.syncJobId);
            const row = {
              id: existing?.['id'] ?? nextId('hist'),
              ...(existing ?? {}),
              ...create,
              ...update,
              syncJobId: where.syncJobId,
            };
            histories.set(where.syncJobId, row);
            return row;
          },
        ),
      },
      syncConflict: {
        create: vi.fn(async () => ({})),
      },
      activityItem: {
        create: vi.fn(async (args: unknown) => {
          activities.push(args);
          return {};
        }),
      },
      notification: {
        create: vi.fn(async (args: unknown) => {
          notifications.push(args);
          return {};
        }),
      },
    },
  };
}

describe('LibrarySyncService', () => {
  let steam: MockSteamWebApiClient;
  let mock: ReturnType<typeof createLibraryPrismaMock>;
  let service: LibrarySyncService;

  beforeEach(() => {
    steam = new MockSteamWebApiClient();
    mock = createLibraryPrismaMock();
    mock.syncJobs.set('job-1', {
      id: 'job-1',
      userId: 'user-1',
      integrationId: 'int-steam',
      provider: 'steam',
      syncType: 'manual',
      status: 'pending',
      attemptCount: 0,
      startedAt: null,
      finishedAt: null,
      errorCode: null,
    });
    service = new LibrarySyncService(mock.prisma as never, steam);
  });

  it('imports owned steam games into library stubs', async () => {
    const history = await service.runImport('job-1');
    expect(history.status).toBe('completed');
    expect(history.importedCount).toBe(steam.fixtures.ownedGames.length);
    expect(mock.library.size).toBe(steam.fixtures.ownedGames.length);
    expect(mock.games.size).toBe(steam.fixtures.ownedGames.length);
  });

  it('runSync completes and emits notifications', async () => {
    const history = await service.runSync('job-1');
    expect(history.status).toBe('completed');
    expect(mock.notifications.length).toBeGreaterThan(0);
    expect(mock.activities.length).toBeGreaterThan(0);
  });

  it('maps existing game by slug on second import', async () => {
    await service.runImport('job-1');
    mock.syncJobs.set('job-2', {
      id: 'job-2',
      userId: 'user-1',
      integrationId: 'int-steam',
      provider: 'steam',
      syncType: 'manual',
      status: 'pending',
      attemptCount: 0,
      startedAt: null,
      finishedAt: null,
      errorCode: null,
    });
    const history = await service.runSync('job-2');
    expect(history.importedCount).toBe(0);
    expect(history.skippedCount + history.updatedCount).toBeGreaterThan(0);
  });

  it('imports csv rows when provider is csv', async () => {
    mock.syncJobs.set('job-csv', {
      id: 'job-csv',
      userId: 'user-1',
      integrationId: 'int-csv',
      provider: 'csv',
      syncType: 'manual',
      status: 'pending',
      attemptCount: 0,
      startedAt: null,
      finishedAt: null,
      errorCode: null,
    });
    const history = await service.runImport('job-csv', {
      csvRows: [
        { title: 'Hades', status: 'completed', playtimeMin: 120 },
        { title: 'Celeste', status: 'playing' },
      ],
    });
    expect(history.importedCount).toBe(2);
  });

  it('parks conflicts when ask_user is requested', async () => {
    await service.runImport('job-1');
    mock.syncJobs.set('job-ask', {
      id: 'job-ask',
      userId: 'user-1',
      integrationId: 'int-steam',
      provider: 'steam',
      syncType: 'manual',
      status: 'pending',
      attemptCount: 0,
      startedAt: null,
      finishedAt: null,
      errorCode: null,
    });
    // Force status divergence by mutating library statuses
    for (const entry of mock.library.values()) {
      entry.status = 'wishlist';
    }
    const history = await service.runImport('job-ask', { conflictResolution: 'ask_user' });
    expect(history.skippedCount).toBeGreaterThan(0);
    expect(mock.prisma.syncConflict.create).toHaveBeenCalled();
  });

  it('throws when sync job is missing', async () => {
    await expect(service.runSync('missing')).rejects.toThrow('Sync job not found');
  });

  it('optionally calls discovery recompute when provided', async () => {
    const recompute = vi.fn(async () => ({ discoveryScore: 1 }));
    service = new LibrarySyncService(mock.prisma as never, steam, {
      recomputeForGame: recompute,
    } as never);
    await service.runImport('job-1');
    expect(recompute).toHaveBeenCalled();
  });

  it('optionally recalculates achievements when provided', async () => {
    const recalculate = vi.fn(async () => []);
    service = new LibrarySyncService(mock.prisma as never, steam, undefined, {
      recalculate,
    } as never);
    await service.runImport('job-1');
    expect(recalculate).toHaveBeenCalledWith('user-1');
  });
});
