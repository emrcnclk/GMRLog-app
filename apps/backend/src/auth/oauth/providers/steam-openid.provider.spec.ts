import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SteamOpenIdError, SteamOpenIdProvider } from './steam-openid.provider';

const REALM = 'https://app.gmrlog.test';
const RETURN_TO = 'https://app.gmrlog.test/oauth/steam/callback?state=abc123';
const VALID_STEAM_ID = '76561198000000001';
const CLAIMED_ID = `https://steamcommunity.com/openid/id/${VALID_STEAM_ID}`;
const OP_ENDPOINT = 'https://steamcommunity.com/openid/login';

function validParams(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'id_res',
    'openid.op_endpoint': OP_ENDPOINT,
    'openid.claimed_id': CLAIMED_ID,
    'openid.identity': CLAIMED_ID,
    'openid.return_to': RETURN_TO,
    'openid.response_nonce': '2026-08-13T00:00:00Zabc',
    'openid.assoc_handle': 'handle-1',
    'openid.signed': 'signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle',
    'openid.sig': 'deadbeef==',
    ...overrides,
  };
}

function fetchReturning(body: string, ok = true) {
  return vi.fn(async () => ({
    ok,
    text: async () => body,
  })) as unknown as typeof fetch;
}

describe('SteamOpenIdProvider', () => {
  let provider: SteamOpenIdProvider;

  beforeEach(() => {
    provider = new SteamOpenIdProvider({
      realm: REALM,
      fetchImpl: fetchReturning('is_valid:true'),
    });
  });

  describe('isEnabled', () => {
    it('is disabled when no realm is configured', () => {
      expect(new SteamOpenIdProvider({ realm: '' }).isEnabled()).toBe(false);
    });

    it('is enabled once a realm is configured', () => {
      expect(provider.isEnabled()).toBe(true);
    });
  });

  describe('buildAuthorizeUrl', () => {
    it('targets Steam with checkid_setup, the configured realm and the given return_to', () => {
      const url = new URL(provider.buildAuthorizeUrl({ returnTo: RETURN_TO }));
      expect(url.origin + url.pathname).toBe(OP_ENDPOINT);
      expect(url.searchParams.get('openid.mode')).toBe('checkid_setup');
      expect(url.searchParams.get('openid.realm')).toBe(REALM);
      expect(url.searchParams.get('openid.return_to')).toBe(RETURN_TO);
    });
  });

  describe('verifyAssertion', () => {
    it('accepts a valid id_res confirmed by check_authentication', async () => {
      const result = await provider.verifyAssertion(validParams(), { returnTo: RETURN_TO });
      expect(result).toEqual({ steamId64: VALID_STEAM_ID });
    });

    it('posts check_authentication back to Steam with every field, mode swapped', async () => {
      const fetchImpl = fetchReturning('is_valid:true');
      provider = new SteamOpenIdProvider({ realm: REALM, fetchImpl });
      await provider.verifyAssertion(validParams(), { returnTo: RETURN_TO });

      expect(fetchImpl).toHaveBeenCalledTimes(1);
      const [url, init] = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0] as [
        string,
        { method: string; body: string },
      ];
      expect(url).toBe(OP_ENDPOINT);
      expect(init.method).toBe('POST');
      const sentParams = new URLSearchParams(init.body);
      expect(sentParams.get('openid.mode')).toBe('check_authentication');
      expect(sentParams.get('openid.sig')).toBe('deadbeef==');
    });

    it('rejects a forged assertion Steam refuses to confirm (is_valid:false)', async () => {
      provider = new SteamOpenIdProvider({
        realm: REALM,
        fetchImpl: fetchReturning('is_valid:false'),
      });
      await expect(
        provider.verifyAssertion(validParams(), { returnTo: RETURN_TO }),
      ).rejects.toMatchObject({ code: 'verification_failed' });
    });

    it('does not pattern-match "true" anywhere in the body — only the literal is_valid:true line', async () => {
      provider = new SteamOpenIdProvider({
        realm: REALM,
        fetchImpl: fetchReturning('ns:http://specs.openid.net/auth/2.0\nis_valid:false\nnote:true'),
      });
      await expect(
        provider.verifyAssertion(validParams(), { returnTo: RETURN_TO }),
      ).rejects.toMatchObject({ code: 'verification_failed' });
    });

    it('rejects when openid.mode is not id_res', async () => {
      await expect(
        provider.verifyAssertion(validParams({ 'openid.mode': 'cancel' }), { returnTo: RETURN_TO }),
      ).rejects.toMatchObject({ code: 'invalid_mode' });
    });

    it('rejects a return_to that does not exactly match what was issued', async () => {
      await expect(
        provider.verifyAssertion(validParams(), {
          returnTo: 'https://app.gmrlog.test/oauth/steam/callback?state=different',
        }),
      ).rejects.toMatchObject({ code: 'return_to_mismatch' });
    });

    it('rejects an op_endpoint that is not Steam’s', async () => {
      await expect(
        provider.verifyAssertion(
          validParams({ 'openid.op_endpoint': 'https://evil.example/openid/login' }),
          { returnTo: RETURN_TO },
        ),
      ).rejects.toMatchObject({ code: 'op_endpoint_mismatch' });
    });

    it('rejects a malformed claimed_id even when it looks Steam-shaped', async () => {
      await expect(
        provider.verifyAssertion(
          validParams({
            'openid.claimed_id': 'https://steamcommunity.com/openid/id/not-a-steamid',
          }),
          { returnTo: RETURN_TO },
        ),
      ).rejects.toMatchObject({ code: 'malformed_claimed_id' });
    });

    it('rejects a claimed_id on a lookalike host', async () => {
      await expect(
        provider.verifyAssertion(
          validParams({
            'openid.claimed_id': `https://steamcommunity.com.evil.example/openid/id/${VALID_STEAM_ID}`,
          }),
          { returnTo: RETURN_TO },
        ),
      ).rejects.toMatchObject({ code: 'malformed_claimed_id' });
    });

    it('never calls check_authentication once shape validation has already failed', async () => {
      const fetchImpl = vi.fn();
      provider = new SteamOpenIdProvider({ realm: REALM, fetchImpl: fetchImpl as never });
      await expect(
        provider.verifyAssertion(validParams({ 'openid.mode': 'cancel' }), { returnTo: RETURN_TO }),
      ).rejects.toBeInstanceOf(SteamOpenIdError);
      expect(fetchImpl).not.toHaveBeenCalled();
    });

    it('surfaces a non-ok check_authentication response as a retryable failure', async () => {
      provider = new SteamOpenIdProvider({
        realm: REALM,
        fetchImpl: fetchReturning('is_valid:true', false),
      });
      await expect(
        provider.verifyAssertion(validParams(), { returnTo: RETURN_TO }),
      ).rejects.toMatchObject({ code: 'verification_request_failed' });
    });

    it('surfaces a network failure as a retryable failure', async () => {
      provider = new SteamOpenIdProvider({
        realm: REALM,
        fetchImpl: vi.fn(async () => {
          throw new Error('network down');
        }) as unknown as typeof fetch,
      });
      await expect(
        provider.verifyAssertion(validParams(), { returnTo: RETURN_TO }),
      ).rejects.toMatchObject({ code: 'verification_request_failed' });
    });
  });
});
