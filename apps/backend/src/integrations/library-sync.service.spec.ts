import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LibrarySyncService } from './library-sync.service';
import { MockSteamWebApiClient } from './steam/steam-web-api.client';

/**
 * Mirrors `ExternalGame`'s `@@unique([integrationId, provider, externalId])`.
 * The integration id is part of the key on purpose: keying on
 * `provider:externalId` alone is exactly the bug this mock has to be able to
 * reproduce, since it would hand one player's row to the next player who syncs
 * the same appid.
 */
interface ExternalGameWhere {
  integrationId_provider_externalId: {
    integrationId: string;
    provider: string;
    externalId: string;
  };
}

function externalGameKey(where: ExternalGameWhere): string {
  const { integrationId, provider, externalId } = where.integrationId_provider_externalId;
  return `${integrationId}:${provider}:${externalId}`;
}

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
  const integrations = new Map<
    string,
    { id: string; userId: string; provider: string; externalRef: string; status: string }
  >([
    [
      'int-steam',
      {
        id: 'int-steam',
        userId: 'user-1',
        provider: 'steam',
        externalRef: '76561198000000001',
        status: 'connected',
      },
    ],
  ]);
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
    integrations,
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
          return integrations.get(where.id) ?? null;
        }),
        update: vi.fn(async () => ({})),
      },
      externalGame: {
        findUnique: vi.fn(async ({ where }: { where: ExternalGameWhere }) => {
          return externalGames.get(externalGameKey(where)) ?? null;
        }),
        upsert: vi.fn(
          async ({
            where,
            create,
            update,
          }: {
            where: ExternalGameWhere;
            create: Record<string, unknown>;
            update: Record<string, unknown>;
          }) => {
            const key = externalGameKey(where);
            const existing = externalGames.get(key);
            if (existing !== undefined) {
              Object.assign(existing, update);
              return existing;
            }
            const compound = where.integrationId_provider_externalId;
            const row = {
              id: nextId('eg'),
              provider: compound.provider,
              externalId: compound.externalId,
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

  // Bug 1 regression. A Steam appid is a global string — "620" is Portal 2 for
  // every player alive — so when `ExternalGame` was unique on
  // `(provider, externalId)` the second player to sync a shared game did not get
  // a row of their own: the upsert matched the FIRST player's row, reassigned
  // its `integrationId`, and overwrote their playtime. The first player lost
  // their record entirely. The key now includes the integration, so each player
  // owns their own row.
  it('gives each player their own row for the same appid', async () => {
    mock.integrations.set('int-steam-b', {
      id: 'int-steam-b',
      userId: 'user-2',
      provider: 'steam',
      externalRef: '76561198000000002',
      status: 'connected',
    });
    mock.syncJobs.set('job-b', {
      id: 'job-b',
      userId: 'user-2',
      integrationId: 'int-steam-b',
      provider: 'steam',
      syncType: 'manual',
      status: 'pending',
      attemptCount: 0,
      startedAt: null,
      finishedAt: null,
      errorCode: null,
    });

    // Same appid, deliberately different playtimes, so a shared row would be
    // detectable as one value clobbering the other rather than as a mere count.
    const playtimeBySteamId: Record<string, number> = {
      '76561198000000001': 6000, // player A — 100 h
      '76561198000000002': 1200, // player B — 20 h
    };
    vi.spyOn(steam, 'getOwnedGames').mockImplementation((steamId64: string) =>
      Promise.resolve([
        {
          appId: '620',
          name: 'Portal 2',
          playtimeForeverMin: playtimeBySteamId[steamId64] ?? 0,
          playtime2WeeksMin: 0,
          lastPlayedAt: null,
        },
      ]),
    );

    await service.runImport('job-1');
    await service.runImport('job-b');

    const portalRows = [...mock.externalGames.values()].filter((row) => row.externalId === '620');
    expect(portalRows).toHaveLength(2);

    const byIntegration = new Map(portalRows.map((row) => [row.integrationId, row]));
    expect(byIntegration.get('int-steam')?.playtimeForeverMin).toBe(6000);
    expect(byIntegration.get('int-steam-b')?.playtimeForeverMin).toBe(1200);
  });

  // The integration id is half the new unique key, so a job without one has no
  // row it could legally write. Fail the job rather than fall back to a global
  // write that would reintroduce the cross-player collision above.
  it('fails a sync job that carries no integration', async () => {
    mock.syncJobs.set('job-orphan', {
      id: 'job-orphan',
      userId: 'user-1',
      integrationId: null,
      provider: 'steam',
      syncType: 'manual',
      status: 'pending',
      attemptCount: 0,
      startedAt: null,
      finishedAt: null,
      errorCode: null,
    });

    await expect(service.runImport('job-orphan')).rejects.toThrow(/no integration/);
    expect(mock.syncJobs.get('job-orphan')?.status).toBe('failed');
    expect([...mock.externalGames.values()]).toHaveLength(0);
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
