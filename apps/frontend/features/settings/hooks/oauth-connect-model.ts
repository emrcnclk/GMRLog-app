export type OAuthConnectResult =
  | { status: 'success' }
  /** Player closed the provider sheet or backed out — same "no error" reasoning as sign-in (OAUTH.md §4). */
  | { status: 'cancelled' }
  | { status: 'unavailable' }
  | { status: 'error'; error: unknown };

/** Structural subset of `expo-web-browser`'s `WebBrowserAuthSessionResult` this model needs. */
export interface AuthSessionResult {
  type: string;
  url?: string;
}

export interface OAuthConnectDeps {
  connectStart: (
    provider: 'google' | 'discord',
    redirectUri: string,
  ) => Promise<{ authorizeUrl: string; state: string }>;
  connectCallback: (params: {
    provider: 'google' | 'discord';
    state: string;
    code: string;
  }) => Promise<void>;
  openAuthSession: (authorizeUrl: string, redirectUri: string) => Promise<AuthSessionResult>;
  makeRedirectUri: () => string;
}

/**
 * Task 4.7's Settings "Connect" attempt — the same shape as `runOAuthSignIn`
 * (`features/auth/hooks/oauth-sign-in-model.ts`), reusing the identical
 * `expo-auth-session` / PKCE / single-use-state mechanics OAUTH.md §5 asks
 * for ("Connect actions route through the verified flows Phase 4 built. No
 * new unverified paths."). The only difference is which pair of endpoints
 * `deps` calls — `/connect/start` and `/connect/callback` instead of
 * `/start` and `/callback` — because this attempt attaches the identity to
 * the *already-signed-in* caller rather than resolving who to sign in as.
 */
export async function runOAuthConnect(
  provider: 'google' | 'discord',
  deps: OAuthConnectDeps,
): Promise<OAuthConnectResult> {
  try {
    const redirectUri = deps.makeRedirectUri();
    const { authorizeUrl, state } = await deps.connectStart(provider, redirectUri);

    const result = await deps.openAuthSession(authorizeUrl, redirectUri);
    if (result.type !== 'success' || result.url === undefined) {
      return { status: 'cancelled' };
    }

    const code = new URL(result.url).searchParams.get('code');
    if (code === null) {
      return { status: 'cancelled' };
    }

    await deps.connectCallback({ provider, state, code });
    return { status: 'success' };
  } catch (error) {
    return { status: 'error', error };
  }
}
