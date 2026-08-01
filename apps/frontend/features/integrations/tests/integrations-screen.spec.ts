import { describe, expect, it } from 'vitest';

import { queryKeys } from '../../../src/query/query-client';
import { SETTINGS_ROUTES } from '../../settings/navigation/settings-routes';
import {
  CSV_FORMAT_OPTIONS,
  csvFormatLabel,
  resolveCsvPreviewView,
  resolveIntegrationsDashboardView,
  resolveSyncHistoryView,
} from '../hooks/integrations-model';

describe('integrations query keys', () => {
  it('exposes integrations domain keys', () => {
    expect(queryKeys.integrations.all).toEqual(['integrations']);
    expect(queryKeys.integrations.providers()).toEqual(['integrations', 'providers']);
    expect(queryKeys.integrations.list()).toEqual(['integrations', 'list']);
    expect(queryKeys.integrations.history()).toEqual(['integrations', 'history']);
    expect(queryKeys.integrations.steamStatus()).toEqual(['integrations', 'steam', 'status']);
    expect(queryKeys.integrations.steamProfile()).toEqual(['integrations', 'steam', 'profile']);
  });
});

describe('integrations settings route', () => {
  it('registers integrations under settings', () => {
    expect(SETTINGS_ROUTES.integrations).toBe('/(settings)/integrations');
  });
});

describe('integrations screen state resolvers', () => {
  it('keeps dashboard ready when only providers load after partial error', () => {
    const view = resolveIntegrationsDashboardView({
      integrationsPending: false,
      integrationsError: true,
      integrationsErrorValue: new Error('list failed'),
      integrations: [],
      providersPending: false,
      providersError: false,
      providersErrorValue: null,
      providers: [{ id: 'steam', label: 'Steam', connectable: true }],
      isRefreshing: false,
    });
    expect(view.status).toBe('ready');
    expect(view.providers[0]?.id).toBe('steam');
  });

  it('preserves history items while refreshing', () => {
    const view = resolveSyncHistoryView({
      isPending: false,
      isError: false,
      error: null,
      items: [
        {
          id: 'h1',
          provider: 'csv',
          syncType: 'manual',
          status: 'processing',
          startedAt: '2026-07-30T11:00:00.000Z',
          finishedAt: null,
          durationMs: null,
          importedCount: 0,
          updatedCount: 0,
          skippedCount: 0,
          failedCount: 0,
          warningCount: 0,
        },
      ],
      isRefreshing: true,
    });
    expect(view.status).toBe('ready');
    expect(view.isRefreshing).toBe(true);
    expect(view.items[0]?.provider).toBe('csv');
  });

  it('maps all CSV formats for the import wizard entry', () => {
    for (const format of CSV_FORMAT_OPTIONS) {
      expect(csvFormatLabel(format).length).toBeGreaterThan(0);
    }
  });

  it('requires preview before import in wizard flow', () => {
    const idle = resolveCsvPreviewView({
      isPreviewing: false,
      previewError: false,
      previewErrorValue: null,
      preview: null,
    });
    expect(idle.status).toBe('idle');
    const ready = resolveCsvPreviewView({
      isPreviewing: false,
      previewError: false,
      previewErrorValue: null,
      preview: {
        format: 'backloggd',
        rowCount: 10,
        columns: ['title'],
        sample: [{ title: 'Celeste' }],
      },
    });
    expect(ready.status).toBe('preview_ready');
    expect(ready.preview?.format).toBe('backloggd');
  });
});
