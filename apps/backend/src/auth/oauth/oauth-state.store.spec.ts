import { beforeEach, describe, expect, it, vi } from 'vitest';

import { parseBackendEnv } from '../../infrastructure/config/env.schema';

import { MemoryOAuthStateStore, OAuthStateStore, type OAuthStateRecord } from './oauth-state.store';

function createFakeRedis() {
  const rows = new Map<string, string>();
  return {
    rows,
    set: vi.fn(async (key: string, value: string) => {
      rows.set(key, value);
    }),
    getdel: vi.fn(async (key: string) => {
      const value = rows.get(key) ?? null;
      rows.delete(key);
      return value;
    }),
  };
}

function makeRecord(overrides: Partial<OAuthStateRecord> = {}): OAuthStateRecord {
  return {
    provider: 'google',
    codeVerifier: 'verifier-1',
    redirectUri: 'https://app.gmrlog.test/oauth/callback',
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('MemoryOAuthStateStore', () => {
  let store: MemoryOAuthStateStore;

  beforeEach(() => {
    store = new MemoryOAuthStateStore();
  });

  it('consumes a stored record exactly once', async () => {
    await store.put('state-1', makeRecord(), 600);
    expect(await store.consume('state-1')).toEqual(makeRecord());
    // Replay: the same state can never be consumed twice.
    expect(await store.consume('state-1')).toBeNull();
  });

  it('returns null for a state that was never issued', async () => {
    expect(await store.consume('never-issued')).toBeNull();
  });

  it('expires a record after its ttl and still consumes the slot', async () => {
    await store.put('state-2', makeRecord(), 0);
    expect(await store.consume('state-2')).toBeNull();
    // Even the (already-expired) first read was single-use.
    expect(await store.consume('state-2')).toBeNull();
  });
});

describe('OAuthStateStore', () => {
  it('writes with the configured ttl and consumes via getdel (atomic single-use)', async () => {
    const redis = createFakeRedis();
    const env = parseBackendEnv({});
    const store = new OAuthStateStore(redis as never, env);
    const record = makeRecord();

    await store.put('state-3', record, env.OAUTH_STATE_TTL_SECONDS);
    expect(redis.set).toHaveBeenCalledWith(
      'gmrlog:oauth-state:state-3',
      JSON.stringify(record),
      'EX',
      env.OAUTH_STATE_TTL_SECONDS,
    );

    expect(await store.consume('state-3')).toEqual(record);
    // getdel already removed the key server-side — a second consume misses.
    expect(await store.consume('state-3')).toBeNull();
    expect(redis.getdel).toHaveBeenCalledTimes(2);
  });

  it('returns null for malformed stored payloads rather than throwing', async () => {
    const redis = createFakeRedis();
    redis.rows.set('gmrlog:oauth-state:corrupt', 'not-json{');
    const env = parseBackendEnv({});
    const store = new OAuthStateStore(redis as never, env);

    expect(await store.consume('corrupt')).toBeNull();
  });
});
