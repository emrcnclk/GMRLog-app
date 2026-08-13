import {
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { parseBackendEnv } from '../../infrastructure/config/env.schema';
import type { RequestIdentity } from '../interfaces/identity';

import { SteamOpenIdError } from './providers/steam-openid.provider';
import { MemorySteamConnectStateStore } from './steam-connect-state.store';
import { SteamConnectController } from './steam-connect.controller';

const RETURN_TO = 'https://app.gmrlog.test/oauth/steam/callback';
const STEAM_ID_64 = '76561198000000001';

const USER_1: RequestIdentity = { class: 'player', userId: 'user-1' };
const USER_2: RequestIdentity = { class: 'player', userId: 'user-2' };

function createFakeSteamOpenId() {
  return {
    isEnabled: vi.fn(() => true),
    buildAuthorizeUrl: vi.fn(
      ({ returnTo }: { returnTo: string }) =>
        `https://steamcommunity.com/openid/login?openid.return_to=${encodeURIComponent(returnTo)}`,
    ),
    verifyAssertion: vi.fn(async () => ({ steamId64: STEAM_ID_64 })),
  };
}

function createFakeSteamConnect() {
  return {
    connectVerified: vi.fn(async (userId: string) => ({
      id: 'int-1',
      userId,
      provider: 'steam' as const,
      externalRef: STEAM_ID_64,
      displayName: 'GMRLOG Tester',
      status: 'connected' as const,
      syncType: 'manual' as const,
      lastSyncAt: null,
      connectedAt: new Date().toISOString(),
      disconnectedAt: null,
      gamesImported: 0,
      achievementsSynced: 0,
    })),
  };
}

function createEnv(overrides: Record<string, string> = {}) {
  return parseBackendEnv({
    STEAM_OPENID_REALM: 'https://app.gmrlog.test',
    STEAM_OPENID_ALLOWED_RETURN_URIS: RETURN_TO,
    OAUTH_STATE_TTL_SECONDS: '600',
    ...overrides,
  });
}

describe('SteamConnectController', () => {
  let stateStore: MemorySteamConnectStateStore;
  let steamOpenId: ReturnType<typeof createFakeSteamOpenId>;
  let steamConnect: ReturnType<typeof createFakeSteamConnect>;
  let controller: SteamConnectController;

  beforeEach(() => {
    stateStore = new MemorySteamConnectStateStore();
    steamOpenId = createFakeSteamOpenId();
    steamConnect = createFakeSteamConnect();
    controller = new SteamConnectController(
      steamOpenId as never,
      stateStore as never,
      steamConnect as never,
      createEnv(),
    );
  });

  describe('start', () => {
    it('fails closed when Steam connect is not configured', async () => {
      steamOpenId.isEnabled.mockReturnValue(false);
      await expect(controller.start(USER_1, { returnTo: RETURN_TO })).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });

    it('rejects a returnTo outside the configured allowlist', async () => {
      await expect(
        controller.start(USER_1, { returnTo: 'https://evil.example/callback' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('stores a single-use state bound to the current user and the return URI', async () => {
      const result = await controller.start(USER_1, { returnTo: RETURN_TO });

      expect(result.authorizeUrl).toContain(encodeURIComponent(`state=${result.state}`));
      const record = await stateStore.consume(result.state);
      expect(record).toMatchObject({ userId: 'user-1', returnToBase: RETURN_TO });

      // Replay: already consumed once, above.
      expect(await stateStore.consume(result.state)).toBeNull();
    });
  });

  describe('callback', () => {
    it('rejects a query with no state at all', async () => {
      await expect(
        controller.callback(USER_1, { query: { 'openid.mode': 'id_res' } }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a state that was never issued', async () => {
      await expect(
        controller.callback(USER_1, { query: { state: 'unknown-state' } }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a replayed state — the second redemption of a real one', async () => {
      const { state } = await controller.start(USER_1, { returnTo: RETURN_TO });
      const query = { state, 'openid.mode': 'id_res' };

      await controller.callback(USER_1, { query });
      await expect(controller.callback(USER_1, { query })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects an expired state', async () => {
      await stateStore.put(
        'expired-state',
        { userId: 'user-1', returnToBase: RETURN_TO, createdAt: Date.now() },
        -1,
      );

      await expect(
        controller.callback(USER_1, { query: { state: 'expired-state' } }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a state minted for a different user — a stolen callback URL cannot be redeemed by someone else', async () => {
      const { state } = await controller.start(USER_1, { returnTo: RETURN_TO });

      await expect(
        controller.callback(USER_2, { query: { state, 'openid.mode': 'id_res' } }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('passes the reconstructed return_to (base + state) to verifyAssertion', async () => {
      const { state } = await controller.start(USER_1, { returnTo: RETURN_TO });
      const query = { state, 'openid.mode': 'id_res' };

      await controller.callback(USER_1, { query });

      expect(steamOpenId.verifyAssertion).toHaveBeenCalledWith(
        query,
        expect.objectContaining({ returnTo: `${RETURN_TO}?state=${state}` }),
      );
    });

    it('maps a forged/rejected OpenID assertion to 401, never reaching connectVerified', async () => {
      steamOpenId.verifyAssertion.mockRejectedValue(new SteamOpenIdError('verification_failed'));
      const { state } = await controller.start(USER_1, { returnTo: RETURN_TO });

      await expect(
        controller.callback(USER_1, { query: { state, 'openid.mode': 'id_res' } }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(steamConnect.connectVerified).not.toHaveBeenCalled();
    });

    it('maps a SteamID already linked to another user to 409', async () => {
      steamConnect.connectVerified.mockRejectedValue(
        new ConflictException('Steam account already linked to another user'),
      );
      const { state } = await controller.start(USER_1, { returnTo: RETURN_TO });

      await expect(
        controller.callback(USER_1, { query: { state, 'openid.mode': 'id_res' } }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('connects the verified SteamID to the user who opened the attempt', async () => {
      const { state } = await controller.start(USER_1, { returnTo: RETURN_TO });

      const result = await controller.callback(USER_1, {
        query: { state, 'openid.mode': 'id_res' },
      });

      expect(steamConnect.connectVerified).toHaveBeenCalledWith('user-1', STEAM_ID_64);
      expect(result.externalRef).toBe(STEAM_ID_64);
      expect(result.status).toBe('connected');
    });
  });
});
