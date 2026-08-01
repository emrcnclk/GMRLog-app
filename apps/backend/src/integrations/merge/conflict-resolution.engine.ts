/**
 * Pure library merge conflict resolution (D3.23 / CONFLICT_RESOLUTION.md).
 * Deterministic — no AI.
 */

import type { SyncConflictResolutionValue } from '@gmrlog/types';

export type ConflictField = 'status' | 'playtime';

export type ConflictWinner = 'local' | 'remote' | 'ask_user';

export interface ConflictLocalSnapshot {
  status: string;
  updatedAt: Date;
  playtimeMin?: number | null;
}

export interface ConflictRemoteSnapshot {
  status?: string | null;
  lastPlayedAt?: Date | null;
  updatedAt?: Date | null;
  playtimeMin?: number | null;
}

export interface ConflictResolutionResult {
  winner: ConflictWinner;
  resolution: SyncConflictResolutionValue;
  field: ConflictField;
  chosenStatus?: string;
  chosenPlaytimeMin?: number | null;
}

/**
 * Unattended defaults: newest_wins for playtime, keep_local for shelf status.
 */
export function defaultResolutionForField(field: ConflictField): SyncConflictResolutionValue {
  return field === 'playtime' ? 'newest_wins' : 'keep_local';
}

export function hasStatusConflict(
  local: ConflictLocalSnapshot,
  remote: ConflictRemoteSnapshot,
): boolean {
  if (remote.status == null || remote.status === '') {
    return false;
  }
  return local.status !== remote.status;
}

export function hasPlaytimeConflict(
  local: ConflictLocalSnapshot,
  remote: ConflictRemoteSnapshot,
): boolean {
  const localMin = local.playtimeMin ?? null;
  const remoteMin = remote.playtimeMin ?? null;
  if (remoteMin === null) {
    return false;
  }
  if (localMin === null) {
    return true;
  }
  return localMin !== remoteMin;
}

function remoteTimestamp(remote: ConflictRemoteSnapshot): Date | null {
  return remote.lastPlayedAt ?? remote.updatedAt ?? null;
}

function newestWinsWinner(
  local: ConflictLocalSnapshot,
  remote: ConflictRemoteSnapshot,
): Exclude<ConflictWinner, 'ask_user'> {
  const remoteAt = remoteTimestamp(remote);
  if (remoteAt === null) {
    return 'local';
  }
  return remoteAt.getTime() >= local.updatedAt.getTime() ? 'remote' : 'local';
}

/**
 * Resolve a single field conflict under the given strategy.
 */
export function resolveConflictField(
  resolution: SyncConflictResolutionValue,
  local: ConflictLocalSnapshot,
  remote: ConflictRemoteSnapshot,
  field: ConflictField,
): ConflictResolutionResult {
  if (resolution === 'ask_user') {
    return { winner: 'ask_user', resolution, field };
  }

  if (resolution === 'keep_local') {
    return buildResult('local', resolution, field, local, remote);
  }

  if (resolution === 'keep_steam') {
    return buildResult('remote', resolution, field, local, remote);
  }

  // newest_wins
  const winner = newestWinsWinner(local, remote);
  return buildResult(winner, resolution, field, local, remote);
}

function buildResult(
  winner: Exclude<ConflictWinner, 'ask_user'>,
  resolution: SyncConflictResolutionValue,
  field: ConflictField,
  local: ConflictLocalSnapshot,
  remote: ConflictRemoteSnapshot,
): ConflictResolutionResult {
  if (field === 'status') {
    const chosenStatus = winner === 'local' ? local.status : (remote.status ?? local.status);
    return { winner, resolution, field, chosenStatus };
  }

  const chosenPlaytimeMin =
    winner === 'local' ? (local.playtimeMin ?? null) : (remote.playtimeMin ?? null);
  return { winner, resolution, field, chosenPlaytimeMin };
}

/**
 * Apply unattended defaults across status + playtime when both diverge.
 */
export function resolveUnattendedMerge(
  local: ConflictLocalSnapshot,
  remote: ConflictRemoteSnapshot,
  overrides: Partial<Record<ConflictField, SyncConflictResolutionValue>> = {},
): {
  status: ConflictResolutionResult;
  playtime: ConflictResolutionResult;
} {
  const statusResolution = overrides.status ?? defaultResolutionForField('status');
  const playtimeResolution = overrides.playtime ?? defaultResolutionForField('playtime');

  return {
    status: resolveConflictField(statusResolution, local, remote, 'status'),
    playtime: resolveConflictField(playtimeResolution, local, remote, 'playtime'),
  };
}

/** Map S1 ImportItemResolution → D3.23 SyncConflictResolution. */
export function mapImportItemResolution(
  value: 'keep_manual' | 'accept_import' | 'skip',
): SyncConflictResolutionValue | null {
  if (value === 'keep_manual') {
    return 'keep_local';
  }
  if (value === 'accept_import') {
    return 'keep_steam';
  }
  return null;
}
