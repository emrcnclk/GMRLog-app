import { describe, expect, it } from 'vitest';

import {
  slugifyGameTitle,
  toSteamProfileResponse,
  toSteamStatusResponse,
  toSyncHistoryResponse,
  toSyncJobResponse,
  toUserIntegrationResponse,
} from './integrations.mapper';

describe('integrations.mapper', () => {
  it('maps user integration with counts', () => {
    const mapped = toUserIntegrationResponse(
      {
        id: 'int-1',
        provider: 'steam',
        externalRef: '1',
        displayName: 'Player',
        status: 'connected',
        syncType: 'manual',
        lastSyncAt: new Date('2026-01-01T00:00:00.000Z'),
        connectedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      { gamesImported: 2, achievementsSynced: 3 },
    );
    expect(mapped.gamesImported).toBe(2);
    expect(mapped.achievementsSynced).toBe(3);
    expect(mapped.lastSyncAt).toContain('2026');
  });

  it('maps null lastSyncAt', () => {
    const mapped = toUserIntegrationResponse({
      id: 'int-1',
      provider: 'csv',
      externalRef: 'x',
      displayName: null,
      status: 'connected',
      syncType: 'daily',
      lastSyncAt: null,
      connectedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    expect(mapped.lastSyncAt).toBeNull();
  });

  it('maps steam status connected/disconnected', () => {
    expect(toSteamStatusResponse(null)).toEqual({ connected: false, integration: null });
    const integration = toUserIntegrationResponse({
      id: 'int-1',
      provider: 'steam',
      externalRef: '1',
      displayName: 'P',
      status: 'connected',
      syncType: 'manual',
      lastSyncAt: null,
      connectedAt: new Date(),
    });
    expect(toSteamStatusResponse(integration).connected).toBe(true);
  });

  it('maps steam profile', () => {
    const mapped = toSteamProfileResponse({
      externalId: '76561198000000001',
      vanityUrl: null,
      displayName: 'Tester',
      avatarUrl: null,
      profileUrl: 'https://steamcommunity.com/profiles/76561198000000001',
    });
    expect(mapped.steamId).toBe('76561198000000001');
  });

  it('maps sync history and job', () => {
    const history = toSyncHistoryResponse({
      id: 'h1',
      provider: 'steam',
      syncType: 'weekly',
      status: 'completed',
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
      finishedAt: null,
      durationMs: null,
      importedCount: 1,
      updatedCount: 2,
      skippedCount: 3,
      failedCount: 0,
      warningCount: 1,
    });
    expect(history.updatedCount).toBe(2);
    expect(history.finishedAt).toBeNull();

    const job = toSyncJobResponse({
      id: 'j1',
      provider: 'csv',
      syncType: 'automatic',
      status: 'failed',
      startedAt: null,
      finishedAt: new Date('2026-01-01T00:00:00.000Z'),
      errorCode: 'boom',
    });
    expect(job.errorCode).toBe('boom');
  });

  it('slugifies titles', () => {
    expect(slugifyGameTitle('Portal 2')).toBe('portal-2');
    expect(slugifyGameTitle('!!!')).toBe('game');
  });
});
