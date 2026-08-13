import type { AuthOauthProvider } from '../oauth-provider-buttons';

export type OAuthSignInResult =
  | { status: 'success' }
  /** Player closed the provider sheet or backed out — OAUTH.md §4: "no error at all." */
  | { status: 'cancelled' }
  | { status: 'unavailable'; provider: AuthOauthProvider }
  | { status: 'error'; error: unknown };

/** Structural subset of `expo-web-browser`'s `WebBrowserAuthSessionResult` this model needs. */
export interface AuthSessionResult {
  type: string;
  url?: string;
}

export interface OAuthSignInDeps {
  oauthStart: (redirectUri: string) => Promise<{ authorizeUrl: string; state: string }>;
  completeOAuth: (params: { state: string; code: string }) => Promise<void>;
  openAuthSession: (authorizeUrl: string, redirectUri: string) => Promise<AuthSessionResult>;
  makeRedirectUri: () => string;
}

/**
 * The testable core of one OAuth attempt (OAUTH.md §2), with every I/O
 * boundary injected so the branching — unavailable provider, cancelled sheet,
 * a redirect with no `code`, a successful exchange — is unit-testable without
 * `expo-auth-session` / `expo-web-browser` (and the React Native module graph
 * they pull in) in the picture at all. `useOAuthSignIn` binds these to the
 * real calls and the auth store.
 *
 * `expo-auth-session` + `expo-web-browser` open one system browser session
 * from a single call site on both native and web — the "Redirect URI is a
 * deep link on native, a route on web" split OAUTH.md §2 describes stays
 * inside `makeRedirectUri`; this function doesn't branch on platform itself.
 * The PKCE verifier and the provider's access/id token never reach this
 * code: `/start` returns only an authorize URL and a `state`, and
 * `/callback` returns only session tokens — everything in between happens
 * server-side (`OAuthController`, `GoogleOAuthProvider`).
 */
export async function runOAuthSignIn(
  provider: AuthOauthProvider,
  deps: OAuthSignInDeps,
): Promise<OAuthSignInResult> {
  if (provider !== 'google') {
    return { status: 'unavailable', provider };
  }

  try {
    const redirectUri = deps.makeRedirectUri();
    const { authorizeUrl, state } = await deps.oauthStart(redirectUri);

    const result = await deps.openAuthSession(authorizeUrl, redirectUri);
    if (result.type !== 'success' || result.url === undefined) {
      return { status: 'cancelled' };
    }

    const code = new URL(result.url).searchParams.get('code');
    if (code === null) {
      return { status: 'cancelled' };
    }

    // `state` is the value this attempt itself requested from `/start`,
    // never re-read from the returned URL — the backend is the one source
    // of truth for whether it's still valid, and there is no reason to
    // trust a state value parsed out of a redirect over the one already
    // held from the request that created it.
    await deps.completeOAuth({ state, code });
    return { status: 'success' };
  } catch (error) {
    return { status: 'error', error };
  }
}
