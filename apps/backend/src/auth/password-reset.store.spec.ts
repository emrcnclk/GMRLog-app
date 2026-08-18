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
    // Real GETDEL: returns the value and removes the key in one command.
    getdel: vi.fn(async (key: string) => {
      const value = rows.get(key) ?? null;
      rows.delete(key);
      return value;
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

  // Bug 7 — the token has to be spent by the read, not by a later delete.
  it('consume returns the user once and nothing afterwards', async () => {
    await store.put('token-c', 'user-c', 3600);
    expect(await store.consume('token-c')).toBe('user-c');
    expect(await store.consume('token-c')).toBeNull();
    expect(await store.getUserId('token-c')).toBeNull();
  });

  it('consume yields exactly one winner across concurrent callers', async () => {
    await store.put('token-race', 'user-race', 3600);
    const results = await Promise.all([
      store.consume('token-race'),
      store.consume('token-race'),
      store.consume('token-race'),
    ]);
    expect(results.filter((r) => r === 'user-race')).toHaveLength(1);
    expect(results.filter((r) => r === null)).toHaveLength(2);
  });

  it('consume rejects an expired token and still clears it', async () => {
    await store.put('token-exp', 'user-exp', 0);
    expect(await store.consume('token-exp')).toBeNull();
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

  // Bug 7 — one Redis command, so nothing can interleave between the read and
  // the delete the way it could between a GET and a later DEL.
  it('consume issues a single GETDEL and spends the token', async () => {
    const redis = createFakeRedis();
    const env = parseBackendEnv({});
    const store = new PasswordResetStore(redis as never, env);

    await store.put('token-4', 'user-4');
    expect(await store.consume('token-4')).toBe('user-4');
    expect(redis.getdel).toHaveBeenCalledWith('gmrlog:password-reset:token-4');
    expect(redis.get).not.toHaveBeenCalled();
    expect(await store.consume('token-4')).toBeNull();
  });
});
