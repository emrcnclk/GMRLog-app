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

import { QUERY_CACHE_STORAGE_KEY } from '../offline/cache-version';

import { runCrashRecovery } from './crash-recovery';

describe('crash recovery', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('returns SecureStore-owned auth expectation without throwing', async () => {
    const result = await runCrashRecovery();
    expect(result.authExpectedFromSecureStore).toBe(true);
    expect(typeof result.queryCacheRestored).toBe('boolean');
    expect(typeof result.queryCacheCleared).toBe('boolean');
  });

  it('detects present durable cache', async () => {
    storage.set(
      QUERY_CACHE_STORAGE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        buster: 'd3.15.0',
        clientState: { queries: [], mutations: [] },
      }),
    );
    const result = await runCrashRecovery();
    expect(result.queryCacheRestored).toBe(true);
  });
});
