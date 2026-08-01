import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IntegrationsService } from './integrations.service';

describe('IntegrationsService extras', () => {
  const prisma = {
    userIntegration: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    externalGame: { count: vi.fn().mockResolvedValue(0) },
    externalAchievement: { count: vi.fn().mockResolvedValue(0) },
    syncJob: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn() },
    syncHistory: { findMany: vi.fn() },
    activityItem: { create: vi.fn() },
    $transaction: vi.fn(),
  };
  const steamConnect = { connect: vi.fn(), disconnect: vi.fn(), status: vi.fn(), profile: vi.fn() };
  const librarySync = { runSync: vi.fn() };
  const jobs = { enqueueSync: vi.fn() };

  let service: IntegrationsService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.externalGame.count.mockResolvedValue(0);
    prisma.externalAchievement.count.mockResolvedValue(0);
    service = new IntegrationsService(
      prisma as never,
      steamConnect as never,
      librarySync as never,
      jobs as never,
    );
  });

  it('create rejects already connected csv', async () => {
    prisma.userIntegration.findUnique.mockResolvedValue({
      id: 'csv-1',
      status: 'connected',
    });
    await expect(
      service.create('user-1', { provider: 'csv', externalRef: 'csv:x' }),
    ).rejects.toThrow(/already connected/);
  });

  it('delete non-steam marks disconnected + activity', async () => {
    prisma.userIntegration.findFirst.mockResolvedValue({
      id: 'csv-1',
      provider: 'csv',
    });
    prisma.userIntegration.update.mockResolvedValue({});
    prisma.activityItem.create.mockResolvedValue({});
    await service.delete('user-1', 'csv-1');
    expect(prisma.userIntegration.update).toHaveBeenCalled();
    expect(prisma.activityItem.create).toHaveBeenCalled();
  });

  it('delete throws when missing', async () => {
    prisma.userIntegration.findFirst.mockResolvedValue(null);
    await expect(service.delete('user-1', 'missing')).rejects.toThrow(/not found/);
  });

  it('triggerSync throws when integration missing', async () => {
    prisma.userIntegration.findFirst.mockResolvedValue(null);
    await expect(service.triggerSync('user-1', 'missing')).rejects.toThrow(/not found/);
  });

  it('triggerSync returns queued job when bull id present', async () => {
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
    jobs.enqueueSync.mockResolvedValue('integration-sync-job-1');
    prisma.syncJob.update.mockResolvedValue({});

    const result = await service.triggerSync('user-1', 'int-1', { syncType: 'daily' });
    expect(result.id).toBe('job-1');
    expect(librarySync.runSync).not.toHaveBeenCalled();
  });

  it('triggerSync rejects when sync already running', async () => {
    prisma.userIntegration.findFirst.mockResolvedValue({
      id: 'int-1',
      provider: 'steam',
      status: 'connected',
    });
    prisma.syncJob.findFirst.mockResolvedValue({ id: 'job-active', status: 'processing' });
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
      fn(prisma),
    );
    await expect(service.triggerSync('user-1', 'int-1')).rejects.toThrow(/already running/);
  });

  it('getSteamStatus and getSteamProfile delegate', async () => {
    steamConnect.status.mockResolvedValue({ connected: false, integration: null });
    steamConnect.profile.mockResolvedValue({ steamId: '1' });
    await service.getSteamStatus('user-1');
    await service.getSteamProfile('user-1');
    expect(steamConnect.status).toHaveBeenCalledWith('user-1');
    expect(steamConnect.profile).toHaveBeenCalledWith('user-1');
  });
});
