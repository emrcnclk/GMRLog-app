import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

import { getLogger } from '../logging/logger';

import {
  QUERY_CACHE_BUSTER,
  QUERY_CACHE_MAX_AGE_MS,
  QUERY_CACHE_STORAGE_KEY,
} from './cache-version';

/**
 * Validate dehydrated client shape before restore.
 * Corrupt / foreign payloads are rejected so hydration never restores garbage.
 */
export function isValidPersistedClient(value: unknown): value is PersistedClient {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.timestamp !== 'number' || !Number.isFinite(record.timestamp)) {
    return false;
  }
  if (typeof record.buster !== 'string') {
    return false;
  }
  if (record.clientState === null || typeof record.clientState !== 'object') {
    return false;
  }
  const state = record.clientState as Record<string, unknown>;
  if (!Array.isArray(state.queries) || !Array.isArray(state.mutations)) {
    return false;
  }
  return true;
}

/** Safe AsyncStorage get — clears key on corrupt JSON. */
export async function safeReadPersistedClient(key: string): Promise<PersistedClient | undefined> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) {
      return undefined;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isValidPersistedClient(parsed)) {
      getLogger().warn('query cache corrupt — cleared');
      await AsyncStorage.removeItem(key);
      return undefined;
    }
    if (parsed.buster !== QUERY_CACHE_BUSTER) {
      getLogger().info('query cache buster mismatch — cleared');
      await AsyncStorage.removeItem(key);
      return undefined;
    }
    if (Date.now() - parsed.timestamp > QUERY_CACHE_MAX_AGE_MS) {
      getLogger().info('query cache expired — cleared');
      await AsyncStorage.removeItem(key);
      return undefined;
    }
    return parsed;
  } catch {
    getLogger().warn('query cache read failed — cleared');
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // ignore secondary failure
    }
    return undefined;
  }
}

export function createQueryPersister(): Persister {
  const inner = createAsyncStoragePersister({
    storage: AsyncStorage,
    key: QUERY_CACHE_STORAGE_KEY,
    throttleTime: 1_000,
  });

  return {
    persistClient: async (client) => {
      if (!isValidPersistedClient(client)) {
        getLogger().warn('refusing to persist invalid query client');
        return;
      }
      await inner.persistClient(client);
    },
    restoreClient: async () => {
      const safe = await safeReadPersistedClient(QUERY_CACHE_STORAGE_KEY);
      return safe;
    },
    removeClient: async () => {
      await inner.removeClient();
    },
  };
}

export { QUERY_CACHE_BUSTER, QUERY_CACHE_MAX_AGE_MS, QUERY_CACHE_STORAGE_KEY };
