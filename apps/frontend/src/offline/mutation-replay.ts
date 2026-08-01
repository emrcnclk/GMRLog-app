import type { AxiosApiClient } from '../api/axios-client';
import { getLogger } from '../logging/logger';

import {
  bumpOfflineMutationRetry,
  loadOfflineMutationQueue,
  removeOfflineMutation,
  type OfflineQueuedMutation,
} from './mutation-queue';
import type { OfflineMutationKind } from './supported-mutations';

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/**
 * Replay a single allowlisted offline mutation against existing Axios helpers.
 * Returns true when the entry should be removed from the queue.
 */
export async function replayOfflineMutation(
  api: AxiosApiClient,
  item: OfflineQueuedMutation,
): Promise<'done' | 'retry' | 'drop'> {
  try {
    await executeKind(api, item.kind, item.payload);
    return 'done';
  } catch (error) {
    getLogger().warn('offline mutation replay failed', {
      kind: item.kind,
      id: item.id,
      message: error instanceof Error ? error.message : 'unknown',
    });
    if (item.retryCount + 1 >= item.maxRetries) {
      return 'drop';
    }
    return 'retry';
  }
}

async function executeKind(
  api: AxiosApiClient,
  kind: OfflineMutationKind,
  payload: Record<string, unknown>,
): Promise<void> {
  switch (kind) {
    case 'community.join': {
      const communityId = asString(payload.communityId);
      if (!communityId) {
        throw new Error('missing communityId');
      }
      await api.joinCommunity(communityId);
      return;
    }
    case 'community.leave': {
      const communityId = asString(payload.communityId);
      if (!communityId) {
        throw new Error('missing communityId');
      }
      await api.leaveCommunity(communityId);
      return;
    }
    case 'event.join': {
      const eventId = asString(payload.eventId);
      if (!eventId) {
        throw new Error('missing eventId');
      }
      await api.joinEvent(eventId);
      return;
    }
    case 'event.leave': {
      const eventId = asString(payload.eventId);
      if (!eventId) {
        throw new Error('missing eventId');
      }
      await api.leaveEvent(eventId);
      return;
    }
    case 'notifications.markRead': {
      const ids = Array.isArray(payload.ids)
        ? payload.ids.filter((id): id is string => typeof id === 'string')
        : [];
      if (ids.length === 0) {
        throw new Error('missing notification ids');
      }
      await api.markNotificationsRead({ ids });
      return;
    }
    case 'notifications.markAllRead': {
      await api.markNotificationsRead({ all: true });
      return;
    }
    case 'settings.appearance': {
      await api.patchSettingsAppearance(payload);
      return;
    }
    case 'settings.accessibility': {
      await api.patchSettingsAccessibility(payload);
      return;
    }
    default: {
      const _exhaustive: never = kind;
      throw new Error(`unsupported offline kind: ${String(_exhaustive)}`);
    }
  }
}

/**
 * Drain FIFO allowlisted queue after reconnect.
 * Stops when offline again; drops exhausted entries.
 */
export async function flushOfflineMutationQueue(api: AxiosApiClient): Promise<{
  flushed: number;
  dropped: number;
  remaining: number;
}> {
  const snapshot = await loadOfflineMutationQueue();
  let flushed = 0;
  let dropped = 0;

  for (const item of snapshot.items) {
    const result = await replayOfflineMutation(api, item);
    if (result === 'done') {
      await removeOfflineMutation(item.id);
      flushed += 1;
      continue;
    }
    if (result === 'drop') {
      await removeOfflineMutation(item.id);
      dropped += 1;
      continue;
    }
    await bumpOfflineMutationRetry(item.id);
    break;
  }

  const remaining = (await loadOfflineMutationQueue()).items.length;
  return { flushed, dropped, remaining };
}
