/**
 * Steam Web API client (D3.23). Mock for tests; optional live HTTP when
 * STEAM_WEB_API_KEY is set.
 */

export interface SteamPlayerSummary {
  steamId: string;
  personaName: string;
  avatarUrl: string;
  profileUrl: string;
  vanityUrl: string | null;
}

export interface SteamOwnedGame {
  appId: string;
  name: string;
  playtimeForeverMin: number;
  playtime2WeeksMin: number;
  lastPlayedAt: Date | null;
}

export interface SteamWebApiClient {
  resolveVanity(vanity: string): Promise<string | null>;
  getPlayerSummary(steamId64: string): Promise<SteamPlayerSummary | null>;
  getOwnedGames(steamId64: string): Promise<SteamOwnedGame[]>;
}

export const STEAM_WEB_API_CLIENT = Symbol('STEAM_WEB_API_CLIENT');

const MOCK_STEAM_ID = '76561198000000001';
const MOCK_VANITY = 'gmrlog_tester';
/**
 * Stress fixtures stay scoped to a SteamID64 prefix so a single mock process can
 * serve both the 3-game baseline and a large library at the same time.
 */
const MOCK_STRESS_STEAM_ID_PREFIX = '7656119800000999';
const MOCK_LIBRARY_CAP = 10_000;

/** Deterministic fixtures for unit / controller tests. */
export class MockSteamWebApiClient implements SteamWebApiClient {
  readonly fixtures = {
    steamId64: MOCK_STEAM_ID,
    vanity: MOCK_VANITY,
    summary: {
      steamId: MOCK_STEAM_ID,
      personaName: 'GMRLOG Tester',
      avatarUrl: 'https://avatars.steamstatic.com/mock.jpg',
      profileUrl: `https://steamcommunity.com/profiles/${MOCK_STEAM_ID}`,
      vanityUrl: `https://steamcommunity.com/id/${MOCK_VANITY}`,
    } satisfies SteamPlayerSummary,
    ownedGames: [
      {
        appId: '1145360',
        name: 'Hades',
        playtimeForeverMin: 1200,
        playtime2WeeksMin: 60,
        lastPlayedAt: new Date('2026-07-01T00:00:00.000Z'),
      },
      {
        appId: '1245620',
        name: 'ELDEN RING',
        playtimeForeverMin: 4800,
        playtime2WeeksMin: 0,
        lastPlayedAt: new Date('2026-06-01T00:00:00.000Z'),
      },
      {
        appId: '620',
        name: 'Portal 2',
        playtimeForeverMin: 0,
        playtime2WeeksMin: 0,
        lastPlayedAt: null,
      },
    ] satisfies SteamOwnedGame[],
  };

  resolveVanity(vanity: string): Promise<string | null> {
    if (vanity.toLowerCase() === MOCK_VANITY || vanity.toLowerCase() === 'gmrlog') {
      return Promise.resolve(MOCK_STEAM_ID);
    }
    return Promise.resolve(null);
  }

  getPlayerSummary(steamId64: string): Promise<SteamPlayerSummary | null> {
    if (steamId64 !== MOCK_STEAM_ID && !steamId64.startsWith('7656119')) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      ...this.fixtures.summary,
      steamId: steamId64,
      profileUrl: `https://steamcommunity.com/profiles/${steamId64}`,
    });
  }

  getOwnedGames(steamId64: string): Promise<SteamOwnedGame[]> {
    if (!steamId64.startsWith('7656119')) {
      return Promise.resolve([]);
    }
    const largeSize = Number.parseInt(process.env.STEAM_MOCK_LIBRARY_SIZE ?? '', 10);
    const stressPrefix =
      process.env.STEAM_MOCK_LIBRARY_STEAM_ID_PREFIX?.trim() ?? MOCK_STRESS_STEAM_ID_PREFIX;
    if (Number.isFinite(largeSize) && largeSize > 0 && steamId64.startsWith(stressPrefix)) {
      return Promise.resolve(buildLargeMockLibrary(largeSize));
    }
    return Promise.resolve(this.fixtures.ownedGames.map((game) => ({ ...game })));
  }
}

function buildLargeMockLibrary(size: number): SteamOwnedGame[] {
  const capped = Math.min(Math.max(size, 1), MOCK_LIBRARY_CAP);
  const games: SteamOwnedGame[] = [];
  for (let i = 0; i < capped; i += 1) {
    games.push({
      appId: String(10_000_000 + i),
      name: i === 0 ? 'Hades' : `Mock Game ${String(i).padStart(4, '0')}`,
      playtimeForeverMin: (i * 7) % 5000,
      playtime2WeeksMin: i % 11 === 0 ? 30 : 0,
      lastPlayedAt: i % 5 === 0 ? new Date(Date.UTC(2026, i % 12, 1 + (i % 27))) : null,
    });
  }
  return games;
}

interface SteamVanityResponse {
  response?: { success?: number; steamid?: string };
}

interface SteamPlayerSummariesResponse {
  response?: {
    players?: {
      steamid?: string;
      personaname?: string;
      avatarfull?: string;
      profileurl?: string;
    }[];
  };
}

interface SteamOwnedGamesResponse {
  response?: {
    games?: {
      appid?: number;
      name?: string;
      playtime_forever?: number;
      playtime_2weeks?: number;
      rtime_last_played?: number;
    }[];
  };
}

/**
 * Live Steam Web API client. Construct only when STEAM_WEB_API_KEY is present.
 */
export class HttpSteamWebApiClient implements SteamWebApiClient {
  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async resolveVanity(vanity: string): Promise<string | null> {
    const url = new URL('https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/');
    url.searchParams.set('key', this.apiKey);
    url.searchParams.set('vanityurl', vanity);
    const json = (await this.getJson(url)) as SteamVanityResponse;
    if (json.response?.success !== 1 || json.response.steamid == null) {
      return null;
    }
    return json.response.steamid;
  }

  async getPlayerSummary(steamId64: string): Promise<SteamPlayerSummary | null> {
    const url = new URL('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/');
    url.searchParams.set('key', this.apiKey);
    url.searchParams.set('steamids', steamId64);
    const json = (await this.getJson(url)) as SteamPlayerSummariesResponse;
    const player = json.response?.players?.[0];
    if (player?.steamid == null) {
      return null;
    }
    return {
      steamId: player.steamid,
      personaName: player.personaname ?? player.steamid,
      avatarUrl: player.avatarfull ?? '',
      profileUrl: player.profileurl ?? `https://steamcommunity.com/profiles/${player.steamid}`,
      vanityUrl: null,
    };
  }

  async getOwnedGames(steamId64: string): Promise<SteamOwnedGame[]> {
    const url = new URL('https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/');
    url.searchParams.set('key', this.apiKey);
    url.searchParams.set('steamid', steamId64);
    url.searchParams.set('include_appinfo', '1');
    url.searchParams.set('include_played_free_games', '1');
    const json = (await this.getJson(url)) as SteamOwnedGamesResponse;
    const games = json.response?.games ?? [];
    return games
      .filter((game) => game.appid != null)
      .map((game) => ({
        appId: String(game.appid),
        name: game.name ?? `Steam App ${String(game.appid)}`,
        playtimeForeverMin: game.playtime_forever ?? 0,
        playtime2WeeksMin: game.playtime_2weeks ?? 0,
        lastPlayedAt:
          game.rtime_last_played != null && game.rtime_last_played > 0
            ? new Date(game.rtime_last_played * 1000)
            : null,
      }));
  }

  private async getJson(url: URL): Promise<unknown> {
    const response = await this.fetchImpl(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Steam Web API HTTP ${String(response.status)}`);
    }
    return await response.json();
  }
}

/**
 * Bug 3 — the mock is a development convenience, and serving its fixtures to
 * real players is worse than not starting: a production box with no key would
 * report invented libraries, playtimes and achievements as though they were the
 * player's own Steam data, and nothing downstream could tell the difference.
 * So in production a missing key is a boot failure, not a fallback.
 *
 * `STEAM_WEB_API_KEY` is also declared in `PRODUCTION_REQUIRED_ENV_KEYS`, which
 * normally rejects the environment before this is ever reached. This check
 * stays as the second half of the pair: it is the one that knows a mock is
 * about to be handed out, and it still holds if the factory is ever called from
 * a context that skipped env validation.
 */
export function createSteamWebApiClient(env?: {
  STEAM_WEB_API_KEY?: string;
  NODE_ENV?: string;
  APP_ENV?: string;
}): SteamWebApiClient {
  const source = env ?? process.env;
  const key = source.STEAM_WEB_API_KEY?.trim();
  if (key !== undefined && key.length > 0) {
    return new HttpSteamWebApiClient(key);
  }
  if (source.NODE_ENV === 'production' || source.APP_ENV === 'production') {
    throw new Error(
      'STEAM_WEB_API_KEY is required in production — refusing to serve mock Steam data',
    );
  }
  return new MockSteamWebApiClient();
}
