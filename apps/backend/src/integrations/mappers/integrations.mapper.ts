import type {
  IntegrationProviderValue,
  IntegrationSyncTypeValue,
  SteamProfileResponse,
  SteamStatusResponse,
  SyncHistoryResponse,
  SyncJobResponse,
  SyncJobStatusValue,
  UserIntegrationResponse,
} from '@gmrlog/types';

import type { CsvImportRow } from '../csv/csv-import.parser';

interface IntegrationRow {
  id: string;
  provider: IntegrationProviderValue;
  externalRef: string;
  displayName: string | null;
  status: string;
  syncType: IntegrationSyncTypeValue;
  lastSyncAt: Date | null;
  connectedAt: Date;
}

interface SyncHistoryRow {
  id: string;
  provider: IntegrationProviderValue;
  syncType: IntegrationSyncTypeValue;
  status: SyncJobStatusValue;
  startedAt: Date;
  finishedAt: Date | null;
  durationMs: number | null;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  warningCount: number;
}

interface SyncJobRow {
  id: string;
  provider: IntegrationProviderValue;
  syncType: IntegrationSyncTypeValue;
  status: SyncJobStatusValue;
  startedAt: Date | null;
  finishedAt: Date | null;
  errorCode: string | null;
}

interface ExternalProfileRow {
  externalId: string;
  vanityUrl: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  profileUrl: string | null;
}

export function toUserIntegrationResponse(
  row: IntegrationRow,
  counts: { gamesImported: number; achievementsSynced: number } = {
    gamesImported: 0,
    achievementsSynced: 0,
  },
): UserIntegrationResponse {
  return {
    id: row.id,
    provider: row.provider,
    externalRef: row.externalRef,
    displayName: row.displayName,
    status: row.status,
    syncType: row.syncType,
    lastSyncAt: row.lastSyncAt?.toISOString() ?? null,
    connectedAt: row.connectedAt.toISOString(),
    gamesImported: counts.gamesImported,
    achievementsSynced: counts.achievementsSynced,
  };
}

export function toSteamStatusResponse(
  integration: UserIntegrationResponse | null,
): SteamStatusResponse {
  return {
    connected: integration !== null && integration.status === 'connected',
    integration,
  };
}

export function toSteamProfileResponse(profile: ExternalProfileRow): SteamProfileResponse {
  return {
    steamId: profile.externalId,
    vanityUrl: profile.vanityUrl,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    profileUrl: profile.profileUrl,
  };
}

export function toSyncHistoryResponse(row: SyncHistoryRow): SyncHistoryResponse {
  return {
    id: row.id,
    provider: row.provider,
    syncType: row.syncType,
    status: row.status,
    startedAt: row.startedAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
    durationMs: row.durationMs,
    importedCount: row.importedCount,
    updatedCount: row.updatedCount,
    skippedCount: row.skippedCount,
    failedCount: row.failedCount,
    warningCount: row.warningCount,
  };
}

export function toSyncJobResponse(row: SyncJobRow): SyncJobResponse {
  return {
    id: row.id,
    provider: row.provider,
    syncType: row.syncType,
    status: row.status,
    startedAt: row.startedAt?.toISOString() ?? null,
    finishedAt: row.finishedAt?.toISOString() ?? null,
    errorCode: row.errorCode,
  };
}

export function slugifyGameTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
  return slug.length > 0 ? slug : 'game';
}

export type IntegrationJobKind = 'sync' | 'import' | 'reconcile' | 'cleanup' | 'retry';

export interface IntegrationJobPayloadData {
  kind: IntegrationJobKind;
  userId: string;
  integrationId: string | null;
  syncJobId: string;
  syncType: IntegrationSyncTypeValue;
  csvRows?: CsvImportRow[];
  conflictResolution?: string;
}
