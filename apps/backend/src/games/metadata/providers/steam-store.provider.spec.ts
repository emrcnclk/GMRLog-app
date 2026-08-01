import { describe, expect, it, vi } from 'vitest';

import { SteamStoreMetadataProvider } from './steam-store.provider';

const APP_DATA = {
  steam_appid: 1145360,
  name: 'Hades',
  short_description: 'A rogue-like dungeon crawler.',
  detailed_description: '<p>Hack &amp; slash<br/>out of hell</p>',
  header_image: 'https://cdn.akamai.steamstatic.com/header.jpg',
  background_raw: 'https://cdn.akamai.steamstatic.com/bg.jpg',
  developers: ['Supergiant Games'],
  publishers: ['Supergiant Games'],
  genres: [{ description: 'Action' }, { description: 'Indie' }],
  categories: [{ description: 'Single-player' }],
  platforms: { windows: true, mac: true, linux: false },
  metacritic: { score: 93 },
  release_date: { coming_soon: false, date: '17 Sep, 2020' },
  screenshots: [{ path_full: 'https://cdn.akamai.steamstatic.com/ss1.jpg' }],
  movies: [{ mp4: { max: 'https://cdn.akamai.steamstatic.com/movie.mp4' } }],
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

function createProvider(fetchImpl: typeof fetch, enabled = true): SteamStoreMetadataProvider {
  return new SteamStoreMetadataProvider({ enabled, ratePerSecond: 1000, fetchImpl });
}

describe('SteamStoreMetadataProvider gating', () => {
  it('is disabled unless explicitly enabled — operator opt-in, not a default', () => {
    expect(createProvider(fetchReturning({}), false).isEnabled()).toBe(false);
    expect(createProvider(fetchReturning({}), true).isEnabled()).toBe(true);
  });

  it('returns null without issuing a request when disabled', async () => {
    const fetchImpl = fetchReturning({});
    const provider = createProvider(fetchImpl, false);

    await expect(
      provider.lookup({ title: 'Hades', slug: 'hades', steamAppId: 1145360 }),
    ).resolves.toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns null without a steamAppId — it cannot search by title', async () => {
    const fetchImpl = fetchReturning({});
    const provider = createProvider(fetchImpl);

    await expect(provider.lookup({ title: 'Hades', slug: 'hades' })).resolves.toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('SteamStoreMetadataProvider.lookup', () => {
  const query = { title: 'Hades', slug: 'hades', steamAppId: 1145360 };

  it('normalises the appdetails payload', async () => {
    const provider = createProvider(
      fetchReturning({ '1145360': { success: true, data: APP_DATA } }),
    );
    const result = await provider.lookup(query);

    expect(result?.provider).toBe('steam');
    expect(result?.title).toBe('Hades');
    expect(result?.summary).toBe('A rogue-like dungeon crawler.');
    expect(result?.externalIds).toEqual({ steamAppId: 1145360 });
  });

  it('strips HTML out of the detailed description', async () => {
    const provider = createProvider(
      fetchReturning({ '1145360': { success: true, data: APP_DATA } }),
    );
    const result = await provider.lookup(query);
    expect(result?.description).toBe('Hack & slash\nout of hell');
  });

  it('treats an appid lookup as an exact match', async () => {
    const provider = createProvider(
      fetchReturning({ '1145360': { success: true, data: APP_DATA } }),
    );
    const result = await provider.lookup(query);
    expect(result?.confidence).toBe(1);
  });

  it('maps only supported platforms', async () => {
    const provider = createProvider(
      fetchReturning({ '1145360': { success: true, data: APP_DATA } }),
    );
    const result = await provider.lookup(query);

    expect(result?.platforms.map((platform) => platform.name)).toEqual([
      'PC (Microsoft Windows)',
      'macOS',
    ]);
  });

  it('maps categories to mode tags and companies to roles', async () => {
    const provider = createProvider(
      fetchReturning({ '1145360': { success: true, data: APP_DATA } }),
    );
    const result = await provider.lookup(query);

    expect(result?.tags).toEqual([{ name: 'Single-player', slug: 'single-player', kind: 'mode' }]);
    expect(result?.companies).toEqual([
      { name: 'Supergiant Games', slug: 'supergiant-games', role: 'developer' },
      { name: 'Supergiant Games', slug: 'supergiant-games', role: 'publisher' },
    ]);
  });

  it('uses the metacritic score as the external rating', async () => {
    const provider = createProvider(
      fetchReturning({ '1145360': { success: true, data: APP_DATA } }),
    );
    const result = await provider.lookup(query);
    expect(result?.externalRating).toBe(93);
  });

  it('collects cover, hero and screenshots', async () => {
    const provider = createProvider(
      fetchReturning({ '1145360': { success: true, data: APP_DATA } }),
    );
    const result = await provider.lookup(query);

    expect(result?.media.map((item) => item.kind)).toEqual(['cover', 'hero', 'screenshot']);
    expect(result?.trailerUrl).toBe('https://cdn.akamai.steamstatic.com/movie.mp4');
  });

  it('returns null for an unreleased or unknown appid', async () => {
    const provider = createProvider(fetchReturning({ '1145360': { success: false } }));
    await expect(provider.lookup(query)).resolves.toBeNull();
  });

  it('ignores a coming-soon release date', async () => {
    const provider = createProvider(
      fetchReturning({
        '1145360': {
          success: true,
          data: { ...APP_DATA, release_date: { coming_soon: true, date: 'Q4 2027' } },
        },
      }),
    );
    const result = await provider.lookup(query);
    expect(result?.releaseDate).toBeNull();
  });

  it('throws on transport failure so BullMQ retries', async () => {
    const provider = createProvider(fetchReturning({}, 503));
    await expect(provider.lookup(query)).rejects.toThrow('Steam Store HTTP 503');
  });
});
