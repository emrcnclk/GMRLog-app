import { afterEach, describe, expect, it } from 'vitest';

import {
  createSteamWebApiClient,
  HttpSteamWebApiClient,
  MockSteamWebApiClient,
} from './steam-web-api.client';

describe('MockSteamWebApiClient', () => {
  const client = new MockSteamWebApiClient();

  it('resolves known vanity handles', async () => {
    await expect(client.resolveVanity('gmrlog_tester')).resolves.toBe(client.fixtures.steamId64);
    await expect(client.resolveVanity('gmrlog')).resolves.toBe(client.fixtures.steamId64);
  });

  it('returns null for unknown vanity', async () => {
    await expect(client.resolveVanity('nope')).resolves.toBeNull();
  });

  it('returns player summary for steam id prefix', async () => {
    const summary = await client.getPlayerSummary(client.fixtures.steamId64);
    expect(summary?.personaName).toBe('GMRLOG Tester');
  });

  it('returns deterministic owned games', async () => {
    const games = await client.getOwnedGames(client.fixtures.steamId64);
    expect(games).toHaveLength(3);
    expect(games[0]?.name).toBe('Hades');
  });

  it('returns empty owned games for invalid id', async () => {
    await expect(client.getOwnedGames('bad')).resolves.toEqual([]);
  });

  describe('stress library', () => {
    const previous = process.env['STEAM_MOCK_LIBRARY_SIZE'];

    afterEach(() => {
      if (previous === undefined) {
        delete process.env['STEAM_MOCK_LIBRARY_SIZE'];
      } else {
        process.env['STEAM_MOCK_LIBRARY_SIZE'] = previous;
      }
    });

    it('serves the large library only for stress steam ids', async () => {
      process.env['STEAM_MOCK_LIBRARY_SIZE'] = '250';

      const stress = await client.getOwnedGames('76561198000009999');
      expect(stress).toHaveLength(250);
      expect(stress[0]?.name).toBe('Hades');

      const baseline = await client.getOwnedGames(client.fixtures.steamId64);
      expect(baseline).toHaveLength(3);
    });

    it('caps the large library at 10000 games', async () => {
      process.env['STEAM_MOCK_LIBRARY_SIZE'] = '99999';
      await expect(client.getOwnedGames('76561198000009991')).resolves.toHaveLength(10_000);
    });
  });
});

describe('HttpSteamWebApiClient', () => {
  it('resolveVanity maps success response', async () => {
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ response: { success: 1, steamid: '76561198000000001' } }), {
        status: 200,
      })) as typeof fetch;
    const client = new HttpSteamWebApiClient('test-key', fetchImpl);
    await expect(client.resolveVanity('foo')).resolves.toBe('76561198000000001');
  });

  it('resolveVanity returns null on unsuccessful response', async () => {
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ response: { success: 42 } }), {
        status: 200,
      })) as typeof fetch;
    const client = new HttpSteamWebApiClient('test-key', fetchImpl);
    await expect(client.resolveVanity('foo')).resolves.toBeNull();
  });

  it('getPlayerSummary maps player payload', async () => {
    const fetchImpl = (async () =>
      new Response(
        JSON.stringify({
          response: {
            players: [
              {
                steamid: '76561198000000001',
                personaname: 'Tester',
                avatarfull: 'https://a',
                profileurl: 'https://p',
              },
            ],
          },
        }),
        { status: 200 },
      )) as typeof fetch;
    const client = new HttpSteamWebApiClient('test-key', fetchImpl);
    const summary = await client.getPlayerSummary('76561198000000001');
    expect(summary).toMatchObject({ personaName: 'Tester', avatarUrl: 'https://a' });
  });

  it('getOwnedGames maps playtime and last played', async () => {
    const fetchImpl = (async () =>
      new Response(
        JSON.stringify({
          response: {
            games: [
              {
                appid: 570,
                name: 'Dota 2',
                playtime_forever: 100,
                playtime_2weeks: 10,
                rtime_last_played: 1_700_000_000,
              },
            ],
          },
        }),
        { status: 200 },
      )) as typeof fetch;
    const client = new HttpSteamWebApiClient('test-key', fetchImpl);
    const games = await client.getOwnedGames('76561198000000001');
    expect(games[0]).toMatchObject({
      appId: '570',
      name: 'Dota 2',
      playtimeForeverMin: 100,
      playtime2WeeksMin: 10,
    });
    expect(games[0]?.lastPlayedAt).toBeInstanceOf(Date);
  });

  it('throws on non-OK HTTP', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 500 })) as typeof fetch;
    const client = new HttpSteamWebApiClient('test-key', fetchImpl);
    await expect(client.resolveVanity('foo')).rejects.toThrow(/HTTP 500/);
  });
});

describe('createSteamWebApiClient', () => {
  it('returns mock when STEAM_WEB_API_KEY unset', () => {
    const previous = process.env['STEAM_WEB_API_KEY'];
    delete process.env['STEAM_WEB_API_KEY'];
    expect(createSteamWebApiClient()).toBeInstanceOf(MockSteamWebApiClient);
    if (previous !== undefined) {
      process.env['STEAM_WEB_API_KEY'] = previous;
    }
  });

  // Bug 3. Falling back to fixtures in production is worse than not booting:
  // invented libraries and playtimes would reach real players' profiles with
  // nothing downstream able to tell them apart from genuine Steam data.
  it('refuses to build a mock client in production', () => {
    expect(() => createSteamWebApiClient({ NODE_ENV: 'production' })).toThrow(
      /STEAM_WEB_API_KEY is required in production/,
    );
    expect(() => createSteamWebApiClient({ APP_ENV: 'production' })).toThrow(
      /STEAM_WEB_API_KEY is required in production/,
    );
    expect(() =>
      createSteamWebApiClient({ NODE_ENV: 'production', STEAM_WEB_API_KEY: '   ' }),
    ).toThrow(/STEAM_WEB_API_KEY is required in production/);
  });

  it('builds a live client in production when the key is present', () => {
    const client = createSteamWebApiClient({
      NODE_ENV: 'production',
      STEAM_WEB_API_KEY: 'a-real-key',
    });
    expect(client).not.toBeInstanceOf(MockSteamWebApiClient);
  });
});
