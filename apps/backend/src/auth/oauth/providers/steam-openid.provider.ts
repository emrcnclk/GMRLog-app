const STEAM_OPENID_ENDPOINT = 'https://steamcommunity.com/openid/login';
const OPENID_NS = 'http://specs.openid.net/auth/2.0';
const IDENTIFIER_SELECT = 'http://specs.openid.net/auth/2.0/identifier_select';
/** Same SteamID64 shape the D3.23 manual-entry parser accepts (`steam-id.parser.ts`). */
const CLAIMED_ID_PATTERN = /^https:\/\/steamcommunity\.com\/openid\/id\/(7656119\d{10})$/;

export interface SteamOpenIdProviderOptions {
  /** OpenID trust root — the origin `openid.realm` asserts this app owns. */
  realm: string;
  /** Injectable for tests — defaults to the platform's global `fetch`. */
  fetchImpl?: typeof fetch;
}

export type SteamOpenIdErrorCode =
  | 'invalid_mode'
  | 'return_to_mismatch'
  | 'op_endpoint_mismatch'
  | 'malformed_claimed_id'
  | 'verification_request_failed'
  | 'verification_failed';

export class SteamOpenIdError extends Error {
  constructor(readonly code: SteamOpenIdErrorCode) {
    super(code);
    this.name = 'SteamOpenIdError';
  }
}

/**
 * Steam OpenID 2.0 connect (OAUTH.md's Steam row, task 4.5). No client
 * secret and no code exchange — the entire trust boundary is the
 * `check_authentication` round-trip in `verifyAssertion`. Every field on the
 * return querystring, including `openid.claimed_id`, is chosen by the user's
 * browser and is forgeable; it is only trusted once Steam itself confirms
 * the assertion via a fresh server-to-server POST. Skipping that call, or
 * trusting a well-formed `claimed_id` on its own, is exactly the
 * account-takeover path this class exists to close.
 */
export class SteamOpenIdProvider {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: SteamOpenIdProviderOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  isEnabled(): boolean {
    return this.options.realm.length > 0;
  }

  buildAuthorizeUrl(params: { returnTo: string }): string {
    const url = new URL(STEAM_OPENID_ENDPOINT);
    url.searchParams.set('openid.ns', OPENID_NS);
    url.searchParams.set('openid.mode', 'checkid_setup');
    url.searchParams.set('openid.return_to', params.returnTo);
    url.searchParams.set('openid.realm', this.options.realm);
    url.searchParams.set('openid.identity', IDENTIFIER_SELECT);
    url.searchParams.set('openid.claimed_id', IDENTIFIER_SELECT);
    return url.toString();
  }

  /**
   * Verifies a Steam OpenID `id_res` return. `params` is the full
   * querystring the client received on its `return_to` page, forwarded
   * verbatim. `expected.returnTo` must be the exact `openid.return_to` value
   * this app sent at `checkid_setup` time (built the same way, from the same
   * allowlisted base URI + `state`), not merely a prefix or a parsed match.
   */
  async verifyAssertion(
    params: Record<string, string>,
    expected: { returnTo: string },
  ): Promise<{ steamId64: string }> {
    if (params['openid.mode'] !== 'id_res') {
      throw new SteamOpenIdError('invalid_mode');
    }
    if (params['openid.return_to'] !== expected.returnTo) {
      throw new SteamOpenIdError('return_to_mismatch');
    }
    if (params['openid.op_endpoint'] !== STEAM_OPENID_ENDPOINT) {
      throw new SteamOpenIdError('op_endpoint_mismatch');
    }

    const claimedId = params['openid.claimed_id'] ?? '';
    const match = CLAIMED_ID_PATTERN.exec(claimedId);
    if (match?.[1] === undefined) {
      throw new SteamOpenIdError('malformed_claimed_id');
    }
    const steamId64 = match[1];

    const checkParams = new URLSearchParams(params);
    checkParams.set('openid.mode', 'check_authentication');

    let response: Response;
    try {
      response = await this.fetchImpl(STEAM_OPENID_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: checkParams.toString(),
      });
    } catch {
      throw new SteamOpenIdError('verification_request_failed');
    }
    if (!response.ok) {
      throw new SteamOpenIdError('verification_request_failed');
    }

    const body = await response.text();
    // Steam's response is `key:value` lines, not JSON — match the literal
    // line rather than a substring, so a value like `is_valid:false` (or a
    // forged body containing the text "true" elsewhere) can't pass.
    const isValid = body
      .split('\n')
      .map((line) => line.trim())
      .includes('is_valid:true');
    if (!isValid) {
      throw new SteamOpenIdError('verification_failed');
    }

    return { steamId64 };
  }
}
