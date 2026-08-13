import type { OAuthIdentity } from '../oauth.types';

const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
const SCOPE = 'openid email profile';

export interface GoogleOAuthProviderOptions {
  clientId: string;
  clientSecret: string;
  /** Injectable for tests — defaults to the platform's global `fetch`. */
  fetchImpl?: typeof fetch;
}

interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface GoogleUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
}

export type GoogleOAuthErrorCode = 'token_exchange_failed' | 'userinfo_failed';

export class GoogleOAuthError extends Error {
  constructor(readonly code: GoogleOAuthErrorCode) {
    super(code);
    this.name = 'GoogleOAuthError';
  }
}

/**
 * Google OAuth 2.0 / OIDC (OAUTH.md §1, §2, §6). Identity is established by
 * calling Google's userinfo endpoint with the access token from a
 * server-to-server, TLS-authenticated token exchange — not by independently
 * verifying an id_token's JWT signature. The trust boundary is the direct
 * HTTPS call to Google, the same boundary the token exchange itself already
 * crosses; adding JWT/JWKS verification on top would check a signature over
 * a channel that is already authenticated, at the cost of a new dependency
 * and its own failure modes (key rotation, clock skew).
 */
export class GoogleOAuthProvider {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: GoogleOAuthProviderOptions) {
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
    url.searchParams.set('access_type', 'online');
    url.searchParams.set('prompt', 'select_account');
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
      throw new GoogleOAuthError('token_exchange_failed');
    }
    const token = (await tokenResponse.json()) as GoogleTokenResponse;

    const userInfoResponse = await this.fetchImpl(USERINFO_URL, {
      headers: { authorization: `Bearer ${token.access_token}` },
    });
    if (!userInfoResponse.ok) {
      throw new GoogleOAuthError('userinfo_failed');
    }
    const userInfo = (await userInfoResponse.json()) as GoogleUserInfo;
    if (typeof userInfo.sub !== 'string' || userInfo.sub.length === 0) {
      throw new GoogleOAuthError('userinfo_failed');
    }

    return {
      provider: 'google',
      subject: userInfo.sub,
      email: userInfo.email ?? null,
      // Strict `=== true`: a missing or non-boolean field fails closed, not open.
      emailVerified: userInfo.email_verified === true,
      displayName: userInfo.name ?? userInfo.email ?? userInfo.sub,
    };
  }
}
