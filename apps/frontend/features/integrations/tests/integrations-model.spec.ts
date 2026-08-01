import type {
  CsvImportPreviewResponse,
  IntegrationProviderInfo,
  SyncHistoryResponse,
  UserIntegrationResponse,
} from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import {
  CSV_FORMAT_OPTIONS,
  canSyncIntegration,
  csvFormatLabel,
  findSteamIntegration,
  formatCsvPreviewSampleRow,
  formatCsvPreviewSummary,
  formatLastSyncAt,
  formatSyncCounts,
  formatSyncDuration,
  integrationProviderLabel,
  isCsvImportReady,
  isKnownCsvFormat,
  isProviderConnectable,
  isSteamConnected,
  isSteamIdOrUrlValid,
  normalizeSteamIdOrUrl,
  resolveCsvPreviewView,
  resolveIntegrationsDashboardView,
  resolveSyncHistoryView,
  sortSyncHistoryNewestFirst,
  syncJobStatusLabel,
  syncJobStatusTone,
} from '../hooks/integrations-model';

function integration(partial: Partial<UserIntegrationResponse> = {}): UserIntegrationResponse {
  return {
    id: 'int_1',
    provider: 'steam',
    externalRef: '76561198000000000',
    displayName: 'Player',
    status: 'connected',
    syncType: 'manual',
    lastSyncAt: '2026-07-30T10:00:00.000Z',
    connectedAt: '2026-07-01T00:00:00.000Z',
    gamesImported: 12,
    achievementsSynced: 4,
    ...partial,
  };
}

function provider(partial: Partial<IntegrationProviderInfo> = {}): IntegrationProviderInfo {
  return {
    id: 'steam',
    label: 'Steam',
    connectable: true,
    ...partial,
  };
}

function history(partial: Partial<SyncHistoryResponse> = {}): SyncHistoryResponse {
  return {
    id: 'hist_1',
    provider: 'steam',
    syncType: 'manual',
    status: 'completed',
    startedAt: '2026-07-30T10:00:00.000Z',
    finishedAt: '2026-07-30T10:01:00.000Z',
    durationMs: 60_000,
    importedCount: 3,
    updatedCount: 2,
    skippedCount: 0,
    failedCount: 0,
    warningCount: 0,
    ...partial,
  };
}

describe('resolveIntegrationsDashboardView', () => {
  it('resolves loading when both queries pending with no data', () => {
    expect(
      resolveIntegrationsDashboardView({
        integrationsPending: true,
        integrationsError: false,
        integrationsErrorValue: null,
        integrations: [],
        providersPending: true,
        providersError: false,
        providersErrorValue: null,
        providers: [],
        isRefreshing: false,
      }).status,
    ).toBe('loading');
  });

  it('resolves error when both queries fail empty', () => {
    const view = resolveIntegrationsDashboardView({
      integrationsPending: false,
      integrationsError: true,
      integrationsErrorValue: new Error('integrations'),
      integrations: [],
      providersPending: false,
      providersError: true,
      providersErrorValue: new Error('providers'),
      providers: [],
      isRefreshing: false,
    });
    expect(view.status).toBe('error');
    expect(view.error).toBeInstanceOf(Error);
  });

  it('resolves empty when no integrations and no providers', () => {
    expect(
      resolveIntegrationsDashboardView({
        integrationsPending: false,
        integrationsError: false,
        integrationsErrorValue: null,
        integrations: [],
        providersPending: false,
        providersError: false,
        providersErrorValue: null,
        providers: [],
        isRefreshing: false,
      }).status,
    ).toBe('empty');
  });

  it('resolves ready when providers exist without integrations', () => {
    const view = resolveIntegrationsDashboardView({
      integrationsPending: false,
      integrationsError: false,
      integrationsErrorValue: null,
      integrations: [],
      providersPending: false,
      providersError: false,
      providersErrorValue: null,
      providers: [provider()],
      isRefreshing: true,
    });
    expect(view.status).toBe('ready');
    expect(view.providers).toHaveLength(1);
    expect(view.isRefreshing).toBe(true);
  });

  it('resolves ready with connected integrations', () => {
    const view = resolveIntegrationsDashboardView({
      integrationsPending: false,
      integrationsError: false,
      integrationsErrorValue: null,
      integrations: [integration()],
      providersPending: false,
      providersError: false,
      providersErrorValue: null,
      providers: [provider()],
      isRefreshing: false,
    });
    expect(view.status).toBe('ready');
    expect(view.integrations[0]?.provider).toBe('steam');
  });
});

describe('resolveSyncHistoryView', () => {
  it('resolves loading empty ready and error', () => {
    expect(
      resolveSyncHistoryView({
        isPending: true,
        isError: false,
        error: null,
        items: [],
        isRefreshing: false,
      }).status,
    ).toBe('loading');
    expect(
      resolveSyncHistoryView({
        isPending: false,
        isError: true,
        error: new Error('x'),
        items: [],
        isRefreshing: false,
      }).status,
    ).toBe('error');
    expect(
      resolveSyncHistoryView({
        isPending: false,
        isError: false,
        error: null,
        items: [],
        isRefreshing: true,
      }).status,
    ).toBe('empty');
    const ready = resolveSyncHistoryView({
      isPending: false,
      isError: false,
      error: null,
      items: [history()],
      isRefreshing: false,
    });
    expect(ready.status).toBe('ready');
    expect(ready.items).toHaveLength(1);
  });
});

describe('integration labels and status', () => {
  it('labels every IntegrationProvider', () => {
    expect(integrationProviderLabel('steam')).toBe('Steam');
    expect(integrationProviderLabel('xbox')).toBe('Xbox');
    expect(integrationProviderLabel('playstation')).toBe('PlayStation');
    expect(integrationProviderLabel('epic')).toBe('Epic');
    expect(integrationProviderLabel('nintendo')).toBe('Nintendo');
    expect(integrationProviderLabel('csv')).toBe('CSV import');
  });

  it('labels every CSV format option', () => {
    expect(CSV_FORMAT_OPTIONS).toEqual([
      'steamdb',
      'backloggd',
      'backloggery',
      'rawg',
      'ign',
      'generic',
    ]);
    expect(csvFormatLabel('steamdb')).toBe('SteamDB');
    expect(csvFormatLabel('backloggd')).toBe('Backloggd');
    expect(csvFormatLabel('backloggery')).toBe('Backloggery');
    expect(csvFormatLabel('rawg')).toBe('RAWG');
    expect(csvFormatLabel('ign')).toBe('IGN');
    expect(csvFormatLabel('generic')).toBe('Generic');
  });

  it('labels sync job statuses with tones', () => {
    expect(syncJobStatusLabel('pending')).toBe('Pending');
    expect(syncJobStatusTone('pending')).toBe('neutral');
    expect(syncJobStatusLabel('processing')).toBe('Processing');
    expect(syncJobStatusTone('processing')).toBe('info');
    expect(syncJobStatusLabel('completed')).toBe('Completed');
    expect(syncJobStatusTone('completed')).toBe('success');
    expect(syncJobStatusLabel('failed')).toBe('Failed');
    expect(syncJobStatusTone('failed')).toBe('danger');
    expect(syncJobStatusLabel('cancelled')).toBe('Cancelled');
    expect(syncJobStatusTone('cancelled')).toBe('warning');
  });
});

describe('format helpers', () => {
  it('formats last sync relative buckets', () => {
    const now = Date.parse('2026-07-30T12:00:00.000Z');
    expect(formatLastSyncAt(null, now)).toBe('Never synced');
    expect(formatLastSyncAt('not-a-date', now)).toBe('Never synced');
    expect(formatLastSyncAt('2026-07-30T11:59:30.000Z', now)).toBe('Synced just now');
    expect(formatLastSyncAt('2026-07-30T11:30:00.000Z', now)).toBe('Synced 30m ago');
    expect(formatLastSyncAt('2026-07-30T09:00:00.000Z', now)).toBe('Synced 3h ago');
    expect(formatLastSyncAt('2026-07-28T12:00:00.000Z', now)).toBe('Synced 2d ago');
  });

  it('formats sync duration', () => {
    expect(formatSyncDuration(null)).toBe('');
    expect(formatSyncDuration(-1)).toBe('');
    expect(formatSyncDuration(250)).toBe('250ms');
    expect(formatSyncDuration(4500)).toBe('5s');
    expect(formatSyncDuration(65_000)).toBe('1m 5s');
  });

  it('formats sync counts with optional skips failures warnings', () => {
    expect(formatSyncCounts(history())).toBe('3 imported · 2 updated');
    expect(formatSyncCounts(history({ skippedCount: 1, failedCount: 2, warningCount: 3 }))).toBe(
      '3 imported · 2 updated · 1 skipped · 2 failed · 3 warnings',
    );
  });

  it('sorts sync history newest first', () => {
    const sorted = sortSyncHistoryNewestFirst([
      history({ id: 'old', startedAt: '2026-07-29T10:00:00.000Z' }),
      history({ id: 'new', startedAt: '2026-07-30T10:00:00.000Z' }),
    ]);
    expect(sorted.map((item) => item.id)).toEqual(['new', 'old']);
  });
});

describe('steam and csv readiness', () => {
  it('detects steam connection and finds steam integration', () => {
    expect(isSteamConnected([])).toBe(false);
    expect(isSteamConnected([integration({ status: 'disconnected' })])).toBe(false);
    expect(isSteamConnected([integration()])).toBe(true);
    expect(findSteamIntegration([integration({ provider: 'csv' })])).toBeNull();
    expect(findSteamIntegration([integration()])?.provider).toBe('steam');
  });

  it('gates sync for disconnected and csv providers', () => {
    expect(canSyncIntegration(integration())).toBe(true);
    expect(canSyncIntegration(integration({ status: 'disconnected' }))).toBe(false);
    expect(canSyncIntegration(integration({ provider: 'csv' }))).toBe(false);
  });

  it('reads provider connectable flags', () => {
    expect(isProviderConnectable([provider()], 'steam')).toBe(true);
    expect(isProviderConnectable([provider({ connectable: false })], 'steam')).toBe(false);
    expect(isProviderConnectable([provider()], 'xbox')).toBe(false);
  });

  it('validates steam id or url input', () => {
    expect(normalizeSteamIdOrUrl('  abc  ')).toBe('abc');
    expect(isSteamIdOrUrlValid('')).toBe(false);
    expect(isSteamIdOrUrlValid('   ')).toBe(false);
    expect(isSteamIdOrUrlValid('76561198000000000')).toBe(true);
  });

  it('requires csv content and format for import readiness', () => {
    expect(isCsvImportReady('', 'generic')).toBe(false);
    expect(isCsvImportReady('title,status', null)).toBe(false);
    expect(isCsvImportReady('title,status', 'generic')).toBe(true);
  });
});

describe('csv preview wizard', () => {
  function preview(partial: Partial<CsvImportPreviewResponse> = {}): CsvImportPreviewResponse {
    return {
      format: 'generic',
      rowCount: 2,
      columns: ['title', 'status'],
      sample: [{ title: 'Hades', status: 'completed' }],
      ...partial,
    };
  }

  it('resolves previewing idle ready and error states', () => {
    expect(
      resolveCsvPreviewView({
        isPreviewing: true,
        previewError: false,
        previewErrorValue: null,
        preview: null,
      }).status,
    ).toBe('previewing');
    expect(
      resolveCsvPreviewView({
        isPreviewing: false,
        previewError: false,
        previewErrorValue: null,
        preview: null,
      }).status,
    ).toBe('idle');
    expect(
      resolveCsvPreviewView({
        isPreviewing: false,
        previewError: true,
        previewErrorValue: new Error('parse'),
        preview: null,
      }).status,
    ).toBe('preview_error');
    const ready = resolveCsvPreviewView({
      isPreviewing: false,
      previewError: false,
      previewErrorValue: null,
      preview: preview(),
    });
    expect(ready.status).toBe('preview_ready');
    expect(ready.preview?.rowCount).toBe(2);
  });

  it('formats preview summary with known and unknown formats', () => {
    expect(formatCsvPreviewSummary(preview())).toBe('2 rows · Generic · title, status');
    expect(formatCsvPreviewSummary(preview({ format: 'steamdb', rowCount: 5 }))).toBe(
      '5 rows · SteamDB · title, status',
    );
    expect(formatCsvPreviewSummary(preview({ format: 'custom', columns: [] }))).toBe(
      '2 rows · custom · No columns detected',
    );
  });

  it('formats preview sample rows', () => {
    expect(formatCsvPreviewSampleRow({ title: 'Hades', status: 'done' })).toBe(
      'title: Hades · status: done',
    );
    expect(formatCsvPreviewSampleRow({})).toBe('Empty row');
  });

  it('detects known csv formats', () => {
    expect(isKnownCsvFormat('generic')).toBe(true);
    expect(isKnownCsvFormat('steamdb')).toBe(true);
    expect(isKnownCsvFormat('unknown')).toBe(false);
    for (const format of CSV_FORMAT_OPTIONS) {
      expect(isKnownCsvFormat(format)).toBe(true);
    }
  });
});
