import { beforeEach, describe, expect, it, vi } from 'vitest';

import { parseBackendEnv } from '../infrastructure/config/env.schema';

import { SteamConnectService } from './steam-connect.service';
import { MockSteamWebApiClient } from './steam/steam-web-api.client';

describe('SteamConnectService extras', () => {
  const prisma = {
    userIntegration: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    externalProfile: { upsert: vi.fn(), findUnique: vi.fn() },
    connectedAccount: { upsert: vi.fn(), updateMany: vi.fn() },
    activityItem: { create: vi.fn() },
    externalGame: { count: vi.fn().mockResolvedValue(0) },
    externalAchievement: { count: vi.fn().mockResolvedValue(0) },
  };

  let service: SteamConnectService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.externalGame.count.mockResolvedValue(0);
    prisma.externalAchievement.count.mockResolvedValue(0);
    service = new SteamConnectService(
      prisma as never,
      new MockSteamWebApiClient(),
      parseBackendEnv({ NODE_ENV: 'development', APP_ENV: 'development' }),
    );
  });

  it('rejects steam already linked to another user', async () => {
    prisma.userIntegration.findFirst.mockResolvedValue({ id: 'other', userId: 'u2' });
    await expect(service.connect('user-1', { steamIdOrUrl: '76561198000000001' })).rejects.toThrow(
      /already linked/,
    );
  });

  it('rejects invalid steam identity input', async () => {
    await expect(service.connect('user-1', { steamIdOrUrl: '   ' })).rejects.toThrow();
  });

  it('status returns connected integration', async () => {
    prisma.userIntegration.findUnique.mockResolvedValue({
      id: 'int-1',
      provider: 'steam',
      externalRef: '76561198000000001',
      displayName: 'GMRLOG Tester',
      status: 'connected',
      syncType: 'manual',
      lastSyncAt: null,
      connectedAt: new Date(),
    });
    const status = await service.status('user-1');
    expect(status.connected).toBe(true);
    expect(status.integration?.id).toBe('int-1');
  });

  it('profile returns external profile fields', async () => {
    prisma.userIntegration.findUnique.mockResolvedValue({
      id: 'int-1',
      status: 'connected',
    });
    prisma.externalProfile.findUnique.mockResolvedValue({
      externalId: '76561198000000001',
      vanityUrl: null,
      displayName: 'Tester',
      avatarUrl: null,
      profileUrl: 'https://steamcommunity.com/profiles/76561198000000001',
    });
    const profile = await service.profile('user-1');
    expect(profile.steamId).toBe('76561198000000001');
  });

  it('disconnect throws when already disconnected', async () => {
    prisma.userIntegration.findUnique.mockResolvedValue({
      id: 'int-1',
      status: 'disconnected',
    });
    await expect(service.disconnect('user-1')).rejects.toThrow(/not connected/);
  });

  it('profile throws when external profile missing', async () => {
    prisma.userIntegration.findUnique.mockResolvedValue({
      id: 'int-1',
      status: 'connected',
    });
    prisma.externalProfile.findUnique.mockResolvedValue(null);
    await expect(service.profile('user-1')).rejects.toThrow(/profile not found/);
  });
});
