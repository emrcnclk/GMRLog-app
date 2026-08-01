import { describe, expect, it, vi } from 'vitest';

import { RawgMetadataProvider } from './rawg.provider';

/**
 * RAWG is implemented but disabled by default — see
 * docs/18_CATALOG/METADATA_LICENSING.md §4. These tests pin the gating
 * behaviour so it cannot be switched on by accident.
 */

const RAWG_GAME = {
  id: 4200,
  name: 'Portal 2',
  slug: 'portal-2',
  description_raw: 'A first-person puzzle game.',
  released: '2011-04-18',
  rating: 4.6,
  ratings_count: 5000,
  metacritic: 95,
  background_image: 'https://media.rawg.io/bg.jpg',
  background_image_additional: 'https://media.rawg.io/bg2.jpg',
  genres: [{ id: 1, name: 'Puzzle', slug: 'puzzle' }],
  tags: [{ id: 2, name: 'Co-op', slug: 'co-op' }],
  platforms: [{ platform: { id: 4, name: 'PC', slug: 'pc' } }],
  developers: [{ id: 5, name: 'Valve Software', slug: 'valve-software' }],
  publishers: [{ id: 6, name: 'Valve', slug: 'valve' }],
};

function fetchReturning(body: unknown, status = 200): typeof fetch {
  return vi.fn(
    async () =>
      ({
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
        headers: new Headers(),
      }) as unknown as Response,
  ) as unknown as typeof fetch;
}

describe('RawgMetadataProvider gating', () => {
  it('is disabled by default', () => {
    const provider = new RawgMetadataProvider({ enabled: false, apiKey: 'key' });
    expect(provider.isEnabled()).toBe(false);
  });

  it('requires BOTH the flag and the key — one alone is a no-op', () => {
    expect(new RawgMetadataProvider({ enabled: true, apiKey: '' }).isEnabled()).toBe(false);
    expect(new RawgMetadataProvider({ enabled: false, apiKey: 'key' }).isEnabled()).toBe(false);
    expect(new RawgMetadataProvider({ enabled: true, apiKey: 'key' }).isEnabled()).toBe(true);
  });

  it('issues no request while disabled', async () => {
    const fetchImpl = fetchReturning({});
    const provider = new RawgMetadataProvider({ enabled: false, apiKey: 'key', fetchImpl });

    await expect(provider.lookup({ title: 'Portal 2', slug: 'portal-2' })).resolves.toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('sorts last in the chain', () => {
    const provider = new RawgMetadataProvider({ enabled: true, apiKey: 'key' });
    expect(provider.priority).toBe(30);
  });
});

describe('RawgMetadataProvider.lookup when enabled', () => {
  function createProvider(fetchImpl: typeof fetch): RawgMetadataProvider {
    return new RawgMetadataProvider({
      enabled: true,
      apiKey: 'key',
      ratePerSecond: 1000,
      fetchImpl,
    });
  }

  it('normalises a direct id lookup as an exact match', async () => {
    const provider = createProvider(fetchReturning(RAWG_GAME));
    const result = await provider.lookup({ title: 'Portal 2', slug: 'portal-2', rawgId: 4200 });

    expect(result?.provider).toBe('rawg');
    expect(result?.confidence).toBe(1);
    expect(result?.externalIds).toEqual({ rawgId: 4200 });
    expect(result?.title).toBe('Portal 2');
  });

  it('prefers the metacritic score over RAWG’s 0-5 rating', async () => {
    const provider = createProvider(fetchReturning(RAWG_GAME));
    const result = await provider.lookup({ title: 'Portal 2', slug: 'portal-2', rawgId: 4200 });
    expect(result?.externalRating).toBe(95);
  });

  it('rescales the 0-5 rating when metacritic is absent', async () => {
    const provider = createProvider(fetchReturning({ ...RAWG_GAME, metacritic: undefined }));
    const result = await provider.lookup({ title: 'Portal 2', slug: 'portal-2', rawgId: 4200 });
    expect(result?.externalRating).toBe(92);
  });

  it('maps genres, tags, platforms and companies', async () => {
    const provider = createProvider(fetchReturning(RAWG_GAME));
    const result = await provider.lookup({ title: 'Portal 2', slug: 'portal-2', rawgId: 4200 });

    expect(result?.genres).toEqual([{ name: 'Puzzle', slug: 'puzzle' }]);
    expect(result?.tags).toEqual([{ name: 'Co-op', slug: 'co-op', kind: 'keyword' }]);
    expect(result?.platforms).toEqual([{ name: 'PC', slug: 'pc' }]);
    expect(result?.companies).toEqual([
      { name: 'Valve Software', slug: 'valve-software', role: 'developer' },
      { name: 'Valve', slug: 'valve', role: 'publisher' },
    ]);
  });

  it('returns null on 404', async () => {
    const provider = createProvider(fetchReturning(null, 404));
    await expect(
      provider.lookup({ title: 'Portal 2', slug: 'portal-2', rawgId: 4200 }),
    ).resolves.toBeNull();
  });

  it('returns null when a title search finds nothing', async () => {
    const provider = createProvider(fetchReturning({ results: [] }));
    await expect(provider.lookup({ title: 'Nothing', slug: 'nothing' })).resolves.toBeNull();
  });

  it('throws on transport failure so BullMQ retries', async () => {
    const provider = createProvider(fetchReturning({}, 500));
    await expect(
      provider.lookup({ title: 'Portal 2', slug: 'portal-2', rawgId: 4200 }),
    ).rejects.toThrow('RAWG HTTP 500');
  });
});
