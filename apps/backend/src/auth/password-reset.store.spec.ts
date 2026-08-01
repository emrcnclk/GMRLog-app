import { beforeEach, describe, expect, it, vi } from 'vitest';

import { parseBackendEnv } from '../infrastructure/config/env.schema';

import { MemoryPasswordResetStore, PasswordResetStore } from './password-reset.store';

function createFakeRedis() {
  const rows = new Map<string, string>();
  return {
    set: vi.fn(async (key: string, value: string) => {
      rows.set(key, value);
    }),
    get: vi.fn(async (key: string) => rows.get(key) ?? null),
    del: vi.fn(async (key: string) => {
      rows.delete(key);
    }),
  };
}

describe('MemoryPasswordResetStore', () => {
  let store: MemoryPasswordResetStore;

  beforeEach(() => {
    store = new MemoryPasswordResetStore();
  });

  it('returns user id while token is valid', async () => {
    await store.put('token-1', 'user-1', 3600);
    expect(await store.getUserId('token-1')).toBe('user-1');
    await store.delete('token-1');
    expect(await store.getUserId('token-1')).toBeNull();
  });

  it('expires tokens after ttl', async () => {
    await store.put('token-2', 'user-2', 0);
    expect(await store.getUserId('token-2')).toBeNull();
  });
});

describe('PasswordResetStore', () => {
  it('uses redis with configured ttl', async () => {
    const redis = createFakeRedis();
    const env = parseBackendEnv({});
    const store = new PasswordResetStore(redis as never, env);

    await store.put('token-3', 'user-3');
    expect(redis.set).toHaveBeenCalledWith(
      'gmrlog:password-reset:token-3',
      'user-3',
      'EX',
      env.PASSWORD_RESET_TTL_SECONDS,
    );
    expect(await store.getUserId('token-3')).toBe('user-3');
    await store.delete('token-3');
    expect(await store.getUserId('token-3')).toBeNull();
  });
});
