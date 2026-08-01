import type {
  CsvImportPreviewResponse,
  IntegrationProviderInfo,
  IntegrationProviderValue,
  SyncHistoryResponse,
  SyncJobStatusValue,
  UserIntegrationResponse,
} from '@gmrlog/types';

export type IntegrationsListStatus = 'loading' | 'error' | 'empty' | 'ready';

export interface IntegrationsDashboardViewModel {
  status: IntegrationsListStatus;
  integrations: UserIntegrationResponse[];
  providers: IntegrationProviderInfo[];
  error: unknown;
  isRefreshing: boolean;
}

export type SyncHistoryListStatus = 'loading' | 'error' | 'empty' | 'ready';

export interface SyncHistoryViewModel {
  status: SyncHistoryListStatus;
  items: SyncHistoryResponse[];
  error: unknown;
  isRefreshing: boolean;
}

export type CsvImportFormatValue =
  'steamdb' | 'backloggd' | 'backloggery' | 'rawg' | 'ign' | 'generic';

export const CSV_FORMAT_OPTIONS: readonly CsvImportFormatValue[] = [
  'steamdb',
  'backloggd',
  'backloggery',
  'rawg',
  'ign',
  'generic',
] as const;

export function resolveIntegrationsDashboardView(input: {
  integrationsPending: boolean;
  integrationsError: boolean;
  integrationsErrorValue: unknown;
  integrations: UserIntegrationResponse[];
  providersPending: boolean;
  providersError: boolean;
  providersErrorValue: unknown;
  providers: IntegrationProviderInfo[];
  isRefreshing: boolean;
}): IntegrationsDashboardViewModel {
  const pending = input.integrationsPending || input.providersPending;
  const hasIntegrations = input.integrations.length > 0;
  const bothFailed =
    input.integrationsError &&
    input.providersError &&
    input.integrations.length === 0 &&
    input.providers.length === 0;

  if (pending && !hasIntegrations && input.providers.length === 0) {
    return {
      status: 'loading',
      integrations: [],
      providers: [],
      error: null,
      isRefreshing: false,
    };
  }

  if (bothFailed) {
    return {
      status: 'error',
      integrations: [],
      providers: [],
      error: input.integrationsErrorValue ?? input.providersErrorValue,
      isRefreshing: input.isRefreshing,
    };
  }

  if (!hasIntegrations && input.providers.length === 0) {
    return {
      status: 'empty',
      integrations: [],
      providers: [],
      error: null,
      isRefreshing: input.isRefreshing,
    };
  }

  return {
    status: hasIntegrations || input.providers.length > 0 ? 'ready' : 'empty',
    integrations: input.integrations,
    providers: input.providers,
    error: input.integrationsErrorValue ?? input.providersErrorValue,
    isRefreshing: input.isRefreshing,
  };
}

export function resolveSyncHistoryView(input: {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  items: SyncHistoryResponse[];
  isRefreshing: boolean;
}): SyncHistoryViewModel {
  if (input.isPending && input.items.length === 0) {
    return { status: 'loading', items: [], error: null, isRefreshing: false };
  }
  if (input.isError && input.items.length === 0) {
    return {
      status: 'error',
      items: [],
      error: input.error,
      isRefreshing: input.isRefreshing,
    };
  }
  if (input.items.length === 0) {
    return {
      status: 'empty',
      items: [],
      error: null,
      isRefreshing: input.isRefreshing,
    };
  }
  return {
    status: 'ready',
    items: input.items,
    error: input.error,
    isRefreshing: input.isRefreshing,
  };
}

export function integrationProviderLabel(provider: IntegrationProviderValue): string {
  switch (provider) {
    case 'steam':
      return 'Steam';
    case 'xbox':
      return 'Xbox';
    case 'playstation':
      return 'PlayStation';
    case 'epic':
      return 'Epic';
    case 'nintendo':
      return 'Nintendo';
    case 'csv':
      return 'CSV import';
    default: {
      const _exhaustive: never = provider;
      return _exhaustive;
    }
  }
}

export function csvFormatLabel(format: CsvImportFormatValue): string {
  switch (format) {
    case 'steamdb':
      return 'SteamDB';
    case 'backloggd':
      return 'Backloggd';
    case 'backloggery':
      return 'Backloggery';
    case 'rawg':
      return 'RAWG';
    case 'ign':
      return 'IGN';
    case 'generic':
      return 'Generic';
    default: {
      const _exhaustive: never = format;
      return _exhaustive;
    }
  }
}

export function syncJobStatusLabel(status: SyncJobStatusValue): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'processing':
      return 'Processing';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function syncJobStatusTone(
  status: SyncJobStatusValue,
): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'pending':
      return 'neutral';
    case 'processing':
      return 'info';
    case 'completed':
      return 'success';
    case 'failed':
      return 'danger';
    case 'cancelled':
      return 'warning';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function formatLastSyncAt(iso: string | null, nowMs = Date.now()): string {
  if (!iso) {
    return 'Never synced';
  }
  const at = Date.parse(iso);
  if (Number.isNaN(at)) {
    return 'Never synced';
  }
  const deltaSec = Math.max(0, Math.floor((nowMs - at) / 1000));
  if (deltaSec < 60) {
    return 'Synced just now';
  }
  const minutes = Math.floor(deltaSec / 60);
  if (minutes < 60) {
    return `Synced ${String(minutes)}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Synced ${String(hours)}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `Synced ${String(days)}d ago`;
  }
  return `Synced ${new Date(at).toLocaleDateString()}`;
}

export function formatSyncDuration(durationMs: number | null): string {
  if (durationMs === null || durationMs < 0) {
    return '';
  }
  if (durationMs < 1000) {
    return `${String(durationMs)}ms`;
  }
  const seconds = Math.round(durationMs / 1000);
  if (seconds < 60) {
    return `${String(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return `${String(minutes)}m ${String(rem)}s`;
}

export function formatSyncCounts(item: SyncHistoryResponse): string {
  const parts = [`${String(item.importedCount)} imported`, `${String(item.updatedCount)} updated`];
  if (item.skippedCount > 0) {
    parts.push(`${String(item.skippedCount)} skipped`);
  }
  if (item.failedCount > 0) {
    parts.push(`${String(item.failedCount)} failed`);
  }
  if (item.warningCount > 0) {
    parts.push(`${String(item.warningCount)} warnings`);
  }
  return parts.join(' · ');
}

export function isSteamConnected(integrations: readonly UserIntegrationResponse[]): boolean {
  return integrations.some((item) => item.provider === 'steam' && item.status !== 'disconnected');
}

export function findSteamIntegration(
  integrations: readonly UserIntegrationResponse[],
): UserIntegrationResponse | null {
  return integrations.find((item) => item.provider === 'steam') ?? null;
}

export function canSyncIntegration(integration: UserIntegrationResponse): boolean {
  return integration.status !== 'disconnected' && integration.provider !== 'csv';
}

export function isProviderConnectable(
  providers: readonly IntegrationProviderInfo[],
  provider: IntegrationProviderValue,
): boolean {
  const found = providers.find((item) => item.id === provider);
  return found?.connectable ?? false;
}

export function normalizeSteamIdOrUrl(value: string): string {
  return value.trim();
}

export function isSteamIdOrUrlValid(value: string): boolean {
  return normalizeSteamIdOrUrl(value).length > 0;
}

export function isCsvImportReady(csv: string, format: CsvImportFormatValue | null): boolean {
  return csv.trim().length > 0 && format !== null;
}

export type CsvPreviewPanelStatus = 'idle' | 'previewing' | 'preview_ready' | 'preview_error';

export interface CsvPreviewViewModel {
  status: CsvPreviewPanelStatus;
  preview: CsvImportPreviewResponse | null;
  error: unknown;
}

export function resolveCsvPreviewView(input: {
  isPreviewing: boolean;
  previewError: boolean;
  previewErrorValue: unknown;
  preview: CsvImportPreviewResponse | null;
}): CsvPreviewViewModel {
  if (input.isPreviewing) {
    return { status: 'previewing', preview: null, error: null };
  }
  if (input.previewError) {
    return {
      status: 'preview_error',
      preview: null,
      error: input.previewErrorValue,
    };
  }
  if (input.preview) {
    return { status: 'preview_ready', preview: input.preview, error: null };
  }
  return { status: 'idle', preview: null, error: null };
}

export function formatCsvPreviewSummary(preview: CsvImportPreviewResponse): string {
  const formatLabel = isKnownCsvFormat(preview.format)
    ? csvFormatLabel(preview.format)
    : preview.format;
  const columnPart =
    preview.columns.length > 0 ? preview.columns.join(', ') : 'No columns detected';
  return `${String(preview.rowCount)} rows · ${formatLabel} · ${columnPart}`;
}

export function isKnownCsvFormat(format: string): format is CsvImportFormatValue {
  return (CSV_FORMAT_OPTIONS as readonly string[]).includes(format);
}

export function formatCsvPreviewSampleRow(row: Record<string, string>): string {
  const entries = Object.entries(row);
  if (entries.length === 0) {
    return 'Empty row';
  }
  return entries.map(([key, value]) => `${key}: ${value}`).join(' · ');
}

export function sortSyncHistoryNewestFirst(
  items: readonly SyncHistoryResponse[],
): SyncHistoryResponse[] {
  return [...items].sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
}

export function createIdempotencyKey(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}
