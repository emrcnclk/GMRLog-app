import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = new Map<string, string>();

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string) => storage.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: async (key: string) => {
      storage.delete(key);
    },
  },
}));

import {
  clearOfflineMutationQueue,
  enqueueOfflineMutation,
  loadOfflineMutationQueue,
  parseOfflineQueue,
} from './mutation-queue';
import { QUERY_CACHE_BUSTER, QUERY_CACHE_STORAGE_KEY } from './cache-version';
import { isValidPersistedClient, safeReadPersistedClient } from './query-persister';

describe('AsyncStorage offline persistence', () => {
  beforeEach(async () => {
    storage.clear();
    await clearOfflineMutationQueue();
  });

  it('enqueues and loads allowlisted mutations', async () => {
    await enqueueOfflineMutation('community.join', { communityId: 'c_1' });
    const snapshot = await loadOfflineMutationQueue();
    expect(snapshot.items).toHaveLength(1);
    expect(snapshot.items[0]?.kind).toBe('community.join');
  });

  it('never restores corrupt query cache', async () => {
    storage.set(QUERY_CACHE_STORAGE_KEY, '{corrupt');
    const restored = await safeReadPersistedClient(QUERY_CACHE_STORAGE_KEY);
    expect(restored).toBeUndefined();
    expect(storage.has(QUERY_CACHE_STORAGE_KEY)).toBe(false);
  });

  it('restores valid cache with matching buster', async () => {
    const client = {
      timestamp: Date.now(),
      buster: QUERY_CACHE_BUSTER,
      clientState: { queries: [], mutations: [] },
    };
    expect(isValidPersistedClient(client)).toBe(true);
    storage.set(QUERY_CACHE_STORAGE_KEY, JSON.stringify(client));
    const restored = await safeReadPersistedClient(QUERY_CACHE_STORAGE_KEY);
    expect(restored?.buster).toBe(QUERY_CACHE_BUSTER);
  });

  it('parseOfflineQueue remains pure without storage', () => {
    expect(parseOfflineQueue('').items).toEqual([]);
  });
});
