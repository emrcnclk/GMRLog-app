import type { OAuthIdentity } from '../oauth.types';

const AUTHORIZE_URL = 'https://discord.com/oauth2/authorize';
const TOKEN_URL = 'https://discord.com/api/oauth2/token';
const USERINFO_URL = 'https://discord.com/api/users/@me';
/** Minimum needed for subject + verified email (OAUTH.md §4.4) — no `guilds` or import-shaped scope. */
const SCOPE = 'identify email';

export interface DiscordOAuthProviderOptions {
  clientId: string;
  clientSecret: string;
  /** Injectable for tests — defaults to the platform's global `fetch`. */
  fetchImpl?: typeof fetch;
}

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface DiscordUserInfo {
  id: string;
  username: string;
  global_name?: string | null;
  /** Absent or `null` when the account has no email, or the `email` scope was denied. */
  email?: string | null;
  /** Only meaningful when `email` is present — Discord accounts can be emailless entirely. */
  verified?: boolean;
}

export type DiscordOAuthErrorCode = 'token_exchange_failed' | 'userinfo_failed';

export class DiscordOAuthError extends Error {
  constructor(readonly code: DiscordOAuthErrorCode) {
    super(code);
    this.name = 'DiscordOAuthError';
  }
}

/**
 * Discord OAuth 2.0 (OAUTH.md §1, §2, §6, task 4.4). Same trust boundary as
 * `GoogleOAuthProvider`: identity comes from a direct, TLS-authenticated
 * server-to-server call to Discord's userinfo endpoint using the access
 * token from the code exchange — not from independently verifying a signed
 * token.
 */
export class DiscordOAuthProvider {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: DiscordOAuthProviderOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  isEnabled(): boolean {
    return this.options.clientId.length > 0 && this.options.clientSecret.length > 0;
  }

  buildAuthorizeUrl(params: { state: string; codeChallenge: string; redirectUri: string }): string {
    const url = new URL(AUTHORIZE_URL);
    url.searchParams.set('client_id', this.options.clientId);
    url.searchParams.set('redirect_uri', params.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', SCOPE);
    url.searchParams.set('state', params.state);
    url.searchParams.set('code_challenge', params.codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
    return url.toString();
  }

  /** Server-side code exchange + identity lookup — OAUTH.md §2 step 4. The client never sees a token. */
  async exchangeAndFetchIdentity(params: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
  }): Promise<OAuthIdentity> {
    const tokenResponse = await this.fetchImpl(TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.options.clientId,
        client_secret: this.options.clientSecret,
        code: params.code,
        code_verifier: params.codeVerifier,
        redirect_uri: params.redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });
    if (!tokenResponse.ok) {
      throw new DiscordOAuthError('token_exchange_failed');
    }
    const token = (await tokenResponse.json()) as DiscordTokenResponse;

    const userInfoResponse = await this.fetchImpl(USERINFO_URL, {
      headers: { authorization: `Bearer ${token.access_token}` },
    });
    if (!userInfoResponse.ok) {
      throw new DiscordOAuthError('userinfo_failed');
    }
    const userInfo = (await userInfoResponse.json()) as DiscordUserInfo;
    if (typeof userInfo.id !== 'string' || userInfo.id.length === 0) {
      throw new DiscordOAuthError('userinfo_failed');
    }

    const email = userInfo.email ?? null;
    return {
      provider: 'discord',
      subject: userInfo.id,
      email,
      // Strict `=== true`, and only trusted when an email actually came back —
      // a Discord account can have no email at all (OAUTH.md §4.4), and
      // `verified` is meaningless attached to a `null` email.
      emailVerified: email !== null && userInfo.verified === true,
      displayName: userInfo.global_name ?? userInfo.username,
    };
  }
}
