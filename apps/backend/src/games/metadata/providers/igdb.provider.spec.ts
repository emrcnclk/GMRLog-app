import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IgdbMetadataProvider } from './igdb.provider';

/** Recorded-shape IGDB payload. No test performs network I/O. */
const IGDB_GAME = {
  id: 1905,
  name: 'Hades',
  summary: 'A rogue-like dungeon crawler.',
  storyline: 'Defy the god of the dead.',
  first_release_date: 1600300800, // 2020-09-17
  total_rating: 91.5,
  total_rating_count: 1200,
  genres: [
    { id: 1, name: 'Indie' },
    { id: 2, name: 'Role-playing (RPG)' },
  ],
  themes: [{ id: 3, name: 'Action' }],
  game_modes: [{ id: 4, name: 'Single player' }],
  player_perspectives: [{ id: 5, name: 'Isometric' }],
  keywords: [{ id: 6, name: 'roguelike' }],
  platforms: [{ id: 6, name: 'PC (Microsoft Windows)' }],
  involved_companies: [
    { company: { id: 9, name: 'Supergiant Games' }, developer: true, publisher: true },
    { company: { id: 10, name: 'Port Studio' }, porting: true },
  ],
  franchise: { id: 11, name: 'Hades' },
  collection: { id: 12, name: 'Supergiant Collection' },
  similar_games: [
    { id: 7346, name: 'Dead Cells' },
    { id: 11208, name: 'Bastion' },
  ],
  cover: { image_id: 'co2lbd' },
  artworks: [
    { image_id: 'ar8h9', width: 1920, height: 1080 },
    { image_id: 'ar8ha', width: 1920, height: 1080 },
  ],
  screenshots: [{ image_id: 'sc8v1x', width: 1920, height: 1080 }],
  videos: [{ video_id: '91t0ha9x0AE' }],
  external_games: [{ category: 1, uid: '1145360' }],
};

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    headers: new Headers(),
  } as unknown as Response;
}

function createProvider(fetchImpl: typeof fetch): IgdbMetadataProvider {
  return new IgdbMetadataProvider({
    clientId: 'client',
    clientSecret: 'secret',
    ratePerSecond: 1000,
    fetchImpl,
  });
}

let tokenCalls: number;

function fetchWithToken(gamePayload: unknown, gameStatus = 200): typeof fetch {
  tokenCalls = 0;
  return vi.fn(async (input: Parameters<typeof fetch>[0]) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('id.twitch.tv')) {
      tokenCalls += 1;
      return jsonResponse({ access_token: 'tok', expires_in: 3600 });
    }
    return jsonResponse(gamePayload, gameStatus);
  }) as unknown as typeof fetch;
}

describe('IgdbMetadataProvider.isEnabled', () => {
  it('is disabled without credentials — a valid zero-credential deployment', () => {
    const provider = new IgdbMetadataProvider({ clientId: '', clientSecret: '' });
    expect(provider.isEnabled()).toBe(false);
  });

  it('is disabled when only one credential is present', () => {
    expect(new IgdbMetadataProvider({ clientId: 'a', clientSecret: '' }).isEnabled()).toBe(false);
    expect(new IgdbMetadataProvider({ clientId: '', clientSecret: 'b' }).isEnabled()).toBe(false);
  });

  it('returns null from lookup when disabled rather than throwing', async () => {
    const provider = new IgdbMetadataProvider({ clientId: '', clientSecret: '' });
    await expect(provider.lookup({ title: 'Hades', slug: 'hades' })).resolves.toBeNull();
  });
});

describe('IgdbMetadataProvider.lookup', () => {
  let provider: IgdbMetadataProvider;

  beforeEach(() => {
    provider = createProvider(fetchWithToken([IGDB_GAME]));
  });

  it('normalises the full payload', async () => {
    const result = await provider.lookup({ title: 'Hades', slug: 'hades' });

    expect(result).not.toBeNull();
    expect(result?.provider).toBe('igdb');
    expect(result?.title).toBe('Hades');
    expect(result?.summary).toBe('A rogue-like dungeon crawler.');
    expect(result?.description).toBe('Defy the god of the dead.');
    expect(result?.releaseDate?.toISOString()).toBe('2020-09-17T00:00:00.000Z');
    expect(result?.externalRating).toBe(91.5);
    expect(result?.externalRatingCount).toBe(1200);
  });

  it('maps themes, modes, perspectives and keywords into a typed tag set', async () => {
    const result = await provider.lookup({ title: 'Hades', slug: 'hades' });

    expect(result?.tags).toEqual(
      expect.arrayContaining([
        { name: 'Action', slug: 'action', kind: 'theme' },
        { name: 'Single player', slug: 'single-player', kind: 'mode' },
        { name: 'Isometric', slug: 'isometric', kind: 'perspective' },
        { name: 'roguelike', slug: 'roguelike', kind: 'keyword' },
      ]),
    );
  });

  it('emits one company entry per role held', async () => {
    const result = await provider.lookup({ title: 'Hades', slug: 'hades' });

    expect(result?.companies).toEqual([
      { name: 'Supergiant Games', slug: 'supergiant-games', role: 'developer' },
      { name: 'Supergiant Games', slug: 'supergiant-games', role: 'publisher' },
      { name: 'Port Studio', slug: 'port-studio', role: 'porting' },
    ]);
  });

  it('extracts the Steam appid from external_games so Steam can be used as fallback', async () => {
    const result = await provider.lookup({ title: 'Hades', slug: 'hades' });
    expect(result?.externalIds).toEqual({ igdbId: 1905, steamAppId: 1145360 });
  });

  it('rewrites image URLs to https with a per-kind size token', async () => {
    const result = await provider.lookup({ title: 'Hades', slug: 'hades' });

    const cover = result?.media.find((item) => item.kind === 'cover');
    const hero = result?.media.find((item) => item.kind === 'hero');
    const screenshot = result?.media.find((item) => item.kind === 'screenshot');

    expect(cover?.url).toBe('https://images.igdb.com/igdb/image/upload/t_cover_big/co2lbd.jpg');
    expect(hero?.url).toBe('https://images.igdb.com/igdb/image/upload/t_1080p/ar8h9.jpg');
    expect(screenshot?.url).toContain('t_screenshot_huge');
  });

  it('promotes the first artwork to hero and leaves the rest as artwork', async () => {
    const result = await provider.lookup({ title: 'Hades', slug: 'hades' });
    expect(result?.media.filter((item) => item.kind === 'hero')).toHaveLength(1);
    expect(result?.media.filter((item) => item.kind === 'artwork')).toHaveLength(1);
  });

  it('builds a watch URL from the first video', async () => {
    const result = await provider.lookup({ title: 'Hades', slug: 'hades' });
    expect(result?.trailerUrl).toBe('https://www.youtube.com/watch?v=91t0ha9x0AE');
  });

  it('maps franchise, series and similar games', async () => {
    const result = await provider.lookup({ title: 'Hades', slug: 'hades' });

    expect(result?.franchise).toEqual({ name: 'Hades', slug: 'hades' });
    expect(result?.series).toEqual({
      name: 'Supergiant Collection',
      slug: 'supergiant-collection',
    });
    expect(result?.similarGames).toEqual([
      { externalId: '7346', title: 'Dead Cells', kind: 'similar', sortOrder: 0 },
      { externalId: '11208', title: 'Bastion', kind: 'similar', sortOrder: 1 },
    ]);
  });

  it('scores a direct id lookup as an exact match', async () => {
    const result = await provider.lookup({ title: 'Hades', slug: 'hades', igdbId: 1905 });
    expect(result?.confidence).toBe(1);
  });

  it('scores a title search by match quality, below an exact id lookup', async () => {
    const result = await provider.lookup({ title: 'Hades', slug: 'hades' });
    expect(result?.confidence).toBeGreaterThan(0.5);
    expect(result?.confidence).toBeLessThan(1);
  });

  it('returns null when the search yields nothing', async () => {
    const empty = createProvider(fetchWithToken([]));
    await expect(empty.lookup({ title: 'Nonexistent', slug: 'nonexistent' })).resolves.toBeNull();
  });

  it('returns null for a blank title rather than issuing a request', async () => {
    await expect(provider.lookup({ title: '   ', slug: '' })).resolves.toBeNull();
  });

  it('reuses the cached Twitch token across calls', async () => {
    await provider.lookup({ title: 'Hades', slug: 'hades' });
    await provider.lookup({ title: 'Hades', slug: 'hades' });
    expect(tokenCalls).toBe(1);
  });

  it('throws on transport failure so BullMQ retries', async () => {
    const failing = createProvider(fetchWithToken([], 500));
    await expect(failing.lookup({ title: 'Hades', slug: 'hades' })).rejects.toThrow(
      'IGDB HTTP 500',
    );
  });

  it('drops the cached token on 401 so the next attempt re-authenticates', async () => {
    const unauthorized = createProvider(fetchWithToken([], 401));
    await expect(unauthorized.lookup({ title: 'Hades', slug: 'hades' })).rejects.toThrow(
      'IGDB unauthorized',
    );
  });

  it('handles a sparse payload without throwing', async () => {
    const sparse = createProvider(fetchWithToken([{ id: 1, name: 'Bare Game' }]));
    const result = await sparse.lookup({ title: 'Bare Game', slug: 'bare-game' });

    expect(result?.title).toBe('Bare Game');
    expect(result?.genres).toEqual([]);
    expect(result?.media).toEqual([]);
    expect(result?.trailerUrl).toBeNull();
    expect(result?.externalIds.steamAppId).toBeNull();
  });
});

/** D11.1 — bulk catalog listing, distinct from the single-record `lookup` path. */
describe('IgdbMetadataProvider.listCatalogPage', () => {
  it('sends a game_type/release-date/updated_at filtered Apicalypse request', async () => {
    const fetchImpl = fetchWithToken([{ ...IGDB_GAME, game_type: 0, updated_at: 1_700_000_000 }]);
    const provider = createProvider(fetchImpl);

    await provider.listCatalogPage({ limit: 500, offset: 0, updatedAfterUnix: 1_699_000_000 });

    const gamesCall = vi
      .mocked(fetchImpl)
      .mock.calls.find(([input]) => String(input).includes('api.igdb.com'));
    const body = String(gamesCall?.[1]?.body ?? '');

    expect(body).toContain('game_type = (0,8,9,10,11)');
    expect(body).toContain('first_release_date != null');
    expect(body).toContain('updated_at > 1699000000');
    expect(body).toContain('sort updated_at asc;');
    expect(body).toContain('limit 500;');
    expect(body).toContain('offset 0;');
  });

  // D11.3 — the release floor is applied server-side. A client-side filter
  // would still pay IGDB's page budget for rows it throws away, and since the
  // cursor walks by `updated_at`, a discarded page is not a shorter run — it
  // is the same run with holes in it.
  it('adds the release floor to the where clause when one is set', async () => {
    const fetchImpl = fetchWithToken([{ ...IGDB_GAME, game_type: 0, updated_at: 1_700_000_000 }]);
    const provider = createProvider(fetchImpl);

    await provider.listCatalogPage({
      limit: 500,
      offset: 0,
      updatedAfterUnix: 0,
      // 1990-01-01T00:00:00Z
      releasedFromUnix: 631_152_000,
    });

    const body = String(
      vi.mocked(fetchImpl).mock.calls.find(([input]) => String(input).includes('api.igdb.com'))?.[1]
        ?.body ?? '',
    );

    expect(body).toContain('first_release_date >= 631152000');
  });

  it('omits the floor entirely when it is zero, rather than sending >= 0', async () => {
    const fetchImpl = fetchWithToken([{ ...IGDB_GAME, game_type: 0, updated_at: 1_700_000_000 }]);
    const provider = createProvider(fetchImpl);

    await provider.listCatalogPage({
      limit: 500,
      offset: 0,
      updatedAfterUnix: 0,
      releasedFromUnix: 0,
    });

    const body = String(
      vi.mocked(fetchImpl).mock.calls.find(([input]) => String(input).includes('api.igdb.com'))?.[1]
        ?.body ?? '',
    );

    expect(body).not.toContain('first_release_date >=');
  });
  it('maps each row to provider metadata plus its raw updated_at', async () => {
    const provider = createProvider(
      fetchWithToken([{ ...IGDB_GAME, game_type: 0, updated_at: 1_700_000_000 }]),
    );

    const [row] = await provider.listCatalogPage({
      limit: 500,
      offset: 0,
      updatedAfterUnix: 0,
    });

    expect(row?.updatedAtUnix).toBe(1_700_000_000);
    expect(row?.metadata.title).toBe('Hades');
    expect(row?.metadata.externalIds.igdbId).toBe(1905);
    // Matched by id in a catalog listing, same as a direct id lookup.
    expect(row?.metadata.confidence).toBe(1);
  });

  it('returns an empty page rather than requesting anything when disabled', async () => {
    const provider = new IgdbMetadataProvider({ clientId: '', clientSecret: '' });
    await expect(
      provider.listCatalogPage({ limit: 500, offset: 0, updatedAfterUnix: 0 }),
    ).resolves.toEqual([]);
  });

  it('defaults a missing updated_at to 0 rather than throwing', async () => {
    const provider = createProvider(fetchWithToken([{ ...IGDB_GAME, game_type: 0 }]));
    const [row] = await provider.listCatalogPage({ limit: 500, offset: 0, updatedAfterUnix: 0 });
    expect(row?.updatedAtUnix).toBe(0);
  });
});
