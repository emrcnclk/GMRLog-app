import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IntegrationsService } from './integrations.service';

describe('IntegrationsService', () => {
  const prisma = {
    userIntegration: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    externalGame: { count: vi.fn() },
    externalAchievement: { count: vi.fn() },
    syncJob: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn() },
    syncHistory: { findMany: vi.fn() },
    activityItem: { create: vi.fn() },
    $transaction: vi.fn(),
  };
  const steamConnect = {
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
  const librarySync = {
    runSync: vi.fn(),
  };
  const jobs = {
    enqueueSync: vi.fn(),
  };

  let service: IntegrationsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new IntegrationsService(
      prisma as never,
      steamConnect as never,
      librarySync as never,
      jobs as never,
    );
  });

  it('lists providers including steam and csv', () => {
    const providers = service.listProviders();
    expect(providers.some((p) => p.id === 'steam' && p.connectable)).toBe(true);
    expect(providers.some((p) => p.id === 'csv')).toBe(true);
  });

  it('create steam delegates to steam connect', async () => {
    steamConnect.connect.mockResolvedValue({ id: 'int-1' });
    await service.create('user-1', { provider: 'steam', externalRef: '76561198000000000' });
    expect(steamConnect.connect).toHaveBeenCalled();
  });

  it('create csv upserts integration', async () => {
    prisma.userIntegration.findUnique.mockResolvedValue(null);
    prisma.userIntegration.upsert.mockResolvedValue({
      id: 'csv-1',
      provider: 'csv',
      externalRef: 'csv:user-1',
      displayName: 'CSV Import',
      status: 'connected',
      syncType: 'manual',
      lastSyncAt: null,
      connectedAt: new Date(),
    });
    prisma.externalGame.count.mockResolvedValue(0);
    prisma.externalAchievement.count.mockResolvedValue(0);
    const result = await service.create('user-1', { provider: 'csv', externalRef: 'csv:user-1' });
    expect(result.provider).toBe('csv');
  });

  it('create rejects non-connectable providers', async () => {
    await expect(service.create('user-1', { provider: 'xbox', externalRef: 'x' })).rejects.toThrow(
      /deferred|not connectable/i,
    );
  });

  it('list maps counts', async () => {
    prisma.userIntegration.findMany.mockResolvedValue([
      {
        id: 'int-1',
        provider: 'steam',
        externalRef: '1',
        displayName: 'x',
        status: 'connected',
        syncType: 'manual',
        lastSyncAt: null,
        connectedAt: new Date(),
      },
    ]);
    prisma.externalGame.count.mockResolvedValue(3);
    prisma.externalAchievement.count.mockResolvedValue(4);
    const rows = await service.list('user-1');
    expect(rows[0]?.gamesImported).toBe(3);
    expect(rows[0]?.achievementsSynced).toBe(4);
  });

  it('delete steam disconnects', async () => {
    prisma.userIntegration.findFirst.mockResolvedValue({
      id: 'int-1',
      provider: 'steam',
    });
    steamConnect.disconnect.mockResolvedValue(undefined);
    await service.delete('user-1', 'int-1');
    expect(steamConnect.disconnect).toHaveBeenCalledWith('user-1');
  });

  it('triggerSync runs inline when queue unavailable', async () => {
    prisma.userIntegration.findFirst.mockResolvedValue({
      id: 'int-1',
      provider: 'steam',
      status: 'connected',
    });
    prisma.syncJob.findFirst.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
      fn(prisma),
    );
    prisma.syncJob.create.mockResolvedValue({
      id: 'job-1',
      provider: 'steam',
      syncType: 'manual',
      status: 'pending',
      startedAt: null,
      finishedAt: null,
      errorCode: null,
    });
    jobs.enqueueSync.mockResolvedValue(null);
    librarySync.runSync.mockResolvedValue({});
    prisma.syncJob.findUnique.mockResolvedValue({
      id: 'job-1',
      provider: 'steam',
      syncType: 'manual',
      status: 'completed',
      startedAt: null,
      finishedAt: null,
      errorCode: null,
    });

    const result = await service.triggerSync('user-1', 'int-1', {});
    expect(result.status).toBe('completed');
    expect(librarySync.runSync).toHaveBeenCalledWith('job-1');
  });

  it('triggerSync rejects when sync already running', async () => {
    prisma.userIntegration.findFirst.mockResolvedValue({
      id: 'int-1',
      provider: 'steam',
      status: 'connected',
    });
    prisma.syncJob.findFirst.mockResolvedValue({ id: 'active', status: 'processing' });
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
      fn(prisma),
    );
    await expect(service.triggerSync('user-1', 'int-1')).rejects.toThrow(/already running/);
  });

  it('listHistory maps rows', async () => {
    prisma.syncHistory.findMany.mockResolvedValue([
      {
        id: 'h1',
        provider: 'steam',
        syncType: 'manual',
        status: 'completed',
        startedAt: new Date('2026-01-01T00:00:00.000Z'),
        finishedAt: new Date('2026-01-01T00:01:00.000Z'),
        durationMs: 60000,
        importedCount: 1,
        updatedCount: 0,
        skippedCount: 0,
        failedCount: 0,
        warningCount: 0,
      },
    ]);
    const rows = await service.listHistory('user-1');
    expect(rows[0]?.importedCount).toBe(1);
  });
});
