import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  MemoryUploadGrantMetaStore,
  UploadGrantMetaStore,
  type UploadGrantMeta,
} from './upload-grant-meta.store';

const meta: UploadGrantMeta = {
  contentType: 'image/png',
  byteSize: 2048,
  storageKey: 'uploads/user-1/avatar/key',
  ownerId: 'user-1',
};

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

describe('MemoryUploadGrantMetaStore', () => {
  let store: MemoryUploadGrantMetaStore;

  beforeEach(() => {
    store = new MemoryUploadGrantMetaStore();
  });

  it('round-trips grant meta', async () => {
    await store.put('grant-1', meta);
    expect(await store.get('grant-1')).toEqual(meta);
    await store.delete('grant-1');
    expect(await store.get('grant-1')).toBeNull();
  });
});

describe('UploadGrantMetaStore', () => {
  it('persists grant meta in redis with ttl', async () => {
    const redis = createFakeRedis();
    const store = new UploadGrantMetaStore(redis as never);

    await store.put('grant-1', meta);
    expect(redis.set).toHaveBeenCalledWith(
      'gmrlog:upload-grant:grant-1',
      JSON.stringify(meta),
      'EX',
      expect.any(Number),
    );
    expect(await store.get('grant-1')).toEqual(meta);
    await store.delete('grant-1');
    expect(redis.del).toHaveBeenCalledWith('gmrlog:upload-grant:grant-1');
    expect(await store.get('grant-1')).toBeNull();
  });

  it('returns null for missing grants', async () => {
    const redis = createFakeRedis();
    const store = new UploadGrantMetaStore(redis as never);
    expect(await store.get('missing')).toBeNull();
  });
});
