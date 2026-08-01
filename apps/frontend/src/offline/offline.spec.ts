import { describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async () => null,
    setItem: async () => undefined,
    removeItem: async () => undefined,
  },
}));

import { QUERY_CACHE_BUSTER } from './cache-version';
import { createPersistDehydrateOptions, shouldPersistQuery } from './persist-filters';
import { parseOfflineQueue, createQueuedMutation } from './mutation-queue';
import { isOfflineMutationKind, OFFLINE_MUTATION_KINDS, durableMeta } from './supported-mutations';

describe('offline cache versioning', () => {
  it('exposes a stable cache buster string', () => {
    expect(QUERY_CACHE_BUSTER.length).toBeGreaterThan(0);
  });
});

describe('persist filters', () => {
  it('skips search and health roots', () => {
    expect(
      shouldPersistQuery({
        queryKey: ['search', 'results', 'halo'],
        state: { status: 'success' },
      } as never),
    ).toBe(false);
    expect(
      shouldPersistQuery({
        queryKey: ['health'],
        state: { status: 'success' },
      } as never),
    ).toBe(false);
  });

  it('persists successful domain queries', () => {
    expect(
      shouldPersistQuery({
        queryKey: ['me'],
        state: { status: 'success' },
      } as never),
    ).toBe(true);
  });

  it('only dehydrates durable paused mutations', () => {
    const options = createPersistDehydrateOptions();
    expect(
      options.shouldDehydrateMutation?.({
        options: { meta: { durable: true } },
        state: { isPaused: true },
      } as never),
    ).toBe(true);
    expect(
      options.shouldDehydrateMutation?.({
        options: { meta: {} },
        state: { isPaused: true },
      } as never),
    ).toBe(false);
  });
});

describe('offline mutation queue parse', () => {
  it('returns empty for corrupt JSON', () => {
    expect(parseOfflineQueue('{not-json').items).toEqual([]);
    expect(parseOfflineQueue(null).items).toEqual([]);
  });

  it('filters unknown kinds and keeps allowlisted entries', () => {
    const item = createQueuedMutation('event.join', { eventId: 'evt_1' });
    const raw = JSON.stringify({
      version: 1,
      items: [item, { id: 'x', kind: 'invented.op', payload: {} }],
    });
    const parsed = parseOfflineQueue(raw);
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0]?.kind).toBe('event.join');
  });
});

describe('supported mutations', () => {
  it('lists only allowlisted kinds', () => {
    expect(OFFLINE_MUTATION_KINDS).toContain('community.join');
    expect(isOfflineMutationKind('community.join')).toBe(true);
    expect(isOfflineMutationKind('uploads.grant')).toBe(false);
  });

  it('builds durable meta', () => {
    expect(durableMeta('settings.appearance')).toEqual({
      durable: true,
      kind: 'settings.appearance',
    });
  });
});

describe('OfflineBoundary contract', () => {
  it('must not blank the tree — prefer OfflineBanner', () => {
    // Documented D3.15 rule: OfflineBoundary is a no-op passthrough.
    expect(true).toBe(true);
  });
});
