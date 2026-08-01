import AsyncStorage from '@react-native-async-storage/async-storage';

import { getLogger } from '../logging/logger';

import { OFFLINE_MUTATION_QUEUE_KEY } from './cache-version';
import { isOfflineMutationKind, type OfflineMutationKind } from './supported-mutations';

export interface OfflineQueuedMutation {
  id: string;
  kind: OfflineMutationKind;
  /** Opaque JSON-serializable payload for replay (entity ids / patch bodies). */
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
  maxRetries: number;
  idempotencyKey: string;
}

export interface OfflineMutationQueueSnapshot {
  version: 1;
  items: OfflineQueuedMutation[];
}

const EMPTY_SNAPSHOT: OfflineMutationQueueSnapshot = { version: 1, items: [] };

function createId(): string {
  return `omq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createQueuedMutation(
  kind: OfflineMutationKind,
  payload: Record<string, unknown>,
  options?: { maxRetries?: number },
): OfflineQueuedMutation {
  const id = createId();
  return {
    id,
    kind,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    maxRetries: options?.maxRetries ?? 5,
    idempotencyKey: id,
  };
}

/** Parse stored JSON safely — corrupt payloads yield empty queue (never restore corrupt). */
export function parseOfflineQueue(raw: string | null): OfflineMutationQueueSnapshot {
  if (raw === null || raw.trim().length === 0) {
    return EMPTY_SNAPSHOT;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      !('version' in parsed) ||
      !('items' in parsed)
    ) {
      return EMPTY_SNAPSHOT;
    }
    const version = (parsed as { version: unknown }).version;
    const items = (parsed as { items: unknown }).items;
    if (version !== 1 || !Array.isArray(items)) {
      return EMPTY_SNAPSHOT;
    }
    const safeItems: OfflineQueuedMutation[] = [];
    for (const entry of items) {
      if (entry === null || typeof entry !== 'object') {
        continue;
      }
      const record = entry as Record<string, unknown>;
      if (typeof record.id !== 'string' || typeof record.kind !== 'string') {
        continue;
      }
      if (!isOfflineMutationKind(record.kind)) {
        continue;
      }
      if (typeof record.payload !== 'object' || record.payload === null) {
        continue;
      }
      safeItems.push({
        id: record.id,
        kind: record.kind,
        payload: record.payload as Record<string, unknown>,
        createdAt:
          typeof record.createdAt === 'string' ? record.createdAt : new Date().toISOString(),
        retryCount: typeof record.retryCount === 'number' ? record.retryCount : 0,
        maxRetries: typeof record.maxRetries === 'number' ? record.maxRetries : 5,
        idempotencyKey:
          typeof record.idempotencyKey === 'string' ? record.idempotencyKey : record.id,
      });
    }
    return { version: 1, items: safeItems };
  } catch {
    getLogger().warn('offline queue corrupt — cleared');
    return EMPTY_SNAPSHOT;
  }
}

export async function loadOfflineMutationQueue(): Promise<OfflineMutationQueueSnapshot> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_MUTATION_QUEUE_KEY);
    return parseOfflineQueue(raw);
  } catch {
    getLogger().warn('offline queue load failed — empty');
    return EMPTY_SNAPSHOT;
  }
}

export async function saveOfflineMutationQueue(
  snapshot: OfflineMutationQueueSnapshot,
): Promise<void> {
  await AsyncStorage.setItem(OFFLINE_MUTATION_QUEUE_KEY, JSON.stringify(snapshot));
}

export async function enqueueOfflineMutation(
  kind: OfflineMutationKind,
  payload: Record<string, unknown>,
): Promise<OfflineQueuedMutation> {
  const snapshot = await loadOfflineMutationQueue();
  const item = createQueuedMutation(kind, payload);
  const next: OfflineMutationQueueSnapshot = {
    version: 1,
    items: [...snapshot.items, item],
  };
  await saveOfflineMutationQueue(next);
  return item;
}

export async function removeOfflineMutation(id: string): Promise<void> {
  const snapshot = await loadOfflineMutationQueue();
  await saveOfflineMutationQueue({
    version: 1,
    items: snapshot.items.filter((item) => item.id !== id),
  });
}

export async function clearOfflineMutationQueue(): Promise<void> {
  await AsyncStorage.removeItem(OFFLINE_MUTATION_QUEUE_KEY);
}

export async function bumpOfflineMutationRetry(id: string): Promise<OfflineQueuedMutation | null> {
  const snapshot = await loadOfflineMutationQueue();
  const items = snapshot.items.map((item) => {
    if (item.id !== id) {
      return item;
    }
    return { ...item, retryCount: item.retryCount + 1 };
  });
  await saveOfflineMutationQueue({ version: 1, items });
  return items.find((item) => item.id === id) ?? null;
}
