import { describe, expect, it, vi } from 'vitest';

import { runSteamConnectOpenId, type SteamConnectOpenIdDeps } from './steam-connect-openid-model';

const INTEGRATION = {
  id: 'int-1',
  userId: 'user-1',
  provider: 'steam' as const,
  externalRef: '76561198000000001',
  displayName: 'GMRLOG Tester',
  status: 'connected' as const,
  syncType: 'manual' as const,
  lastSyncAt: null,
  connectedAt: '2026-08-13T00:00:00.000Z',
  disconnectedAt: null,
  gamesImported: 0,
  achievementsSynced: 0,
};

function makeDeps(overrides: Partial<SteamConnectOpenIdDeps> = {}): SteamConnectOpenIdDeps {
  return {
    steamConnectStart: vi.fn(async () => ({
      authorizeUrl: 'https://steamcommunity.com/openid/login?openid.mode=checkid_setup',
      state: 'state-1',
    })),
    steamConnectCallback: vi.fn(async () => INTEGRATION),
    openAuthSession: vi.fn(async () => ({
      type: 'success' as const,
      url: 'https://app.gmrlog.test/oauth/steam/callback?state=state-1&openid.mode=id_res&openid.claimed_id=https%3A%2F%2Fsteamcommunity.com%2Fopenid%2Fid%2F76561198000000001',
    })),
    makeRedirectUri: vi.fn(() => 'https://app.gmrlog.test/oauth/steam/callback'),
    ...overrides,
  };
}

describe('runSteamConnectOpenId', () => {
  it('completes a successful Steam connect round-trip end to end', async () => {
    const deps = makeDeps();

    const result = await runSteamConnectOpenId(deps);

    expect(result).toEqual({ status: 'success', integration: INTEGRATION });
    expect(deps.steamConnectStart).toHaveBeenCalledWith(
      'https://app.gmrlog.test/oauth/steam/callback',
    );
    expect(deps.steamConnectCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        state: 'state-1',
        'openid.mode': 'id_res',
      }),
    );
  });

  it('forwards the full querystring, not just state — verification needs every openid.* field', async () => {
    const deps = makeDeps();
    await runSteamConnectOpenId(deps);

    const [query] = (deps.steamConnectCallback as ReturnType<typeof vi.fn>).mock.calls[0] as [
      Record<string, string>,
    ];
    expect(query['openid.claimed_id']).toBe(
      'https://steamcommunity.com/openid/id/76561198000000001',
    );
  });

  it('treats a cancelled Steam sheet as no error at all, same as OAuth2', async () => {
    const deps = makeDeps({
      openAuthSession: vi.fn(async () => ({ type: 'cancel' as const })),
    });

    const result = await runSteamConnectOpenId(deps);

    expect(result).toEqual({ status: 'cancelled' });
    expect(deps.steamConnectCallback).not.toHaveBeenCalled();
  });

  it('treats a redirect with no state as cancelled rather than throwing', async () => {
    const deps = makeDeps({
      openAuthSession: vi.fn(async () => ({
        type: 'success' as const,
        url: 'https://app.gmrlog.test/oauth/steam/callback?openid.mode=id_res',
      })),
    });

    const result = await runSteamConnectOpenId(deps);

    expect(result).toEqual({ status: 'cancelled' });
    expect(deps.steamConnectCallback).not.toHaveBeenCalled();
  });

  it('surfaces a failed /start or /callback call as an error result, not a throw', async () => {
    const failure = new Error('network down');
    const deps = makeDeps({
      steamConnectStart: vi.fn(async () => {
        throw failure;
      }),
    });

    const result = await runSteamConnectOpenId(deps);

    expect(result).toEqual({ status: 'error', error: failure });
  });

  it('surfaces a backend rejection (e.g. STEAM_CONNECT_ALREADY_LINKED) as an error result', async () => {
    const failure = new Error('Steam account already linked to another player');
    const deps = makeDeps({
      steamConnectCallback: vi.fn(async () => {
        throw failure;
      }),
    });

    const result = await runSteamConnectOpenId(deps);

    expect(result).toEqual({ status: 'error', error: failure });
  });
});
