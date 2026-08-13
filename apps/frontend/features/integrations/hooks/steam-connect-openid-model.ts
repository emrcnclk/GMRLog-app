import type { UserIntegrationResponse } from '@gmrlog/types';

export type SteamConnectOpenIdResult =
  | { status: 'success'; integration: UserIntegrationResponse }
  /** Player closed the Steam sheet or backed out — not a failure, same as OAUTH.md §4's OAuth2 case. */
  | { status: 'cancelled' }
  | { status: 'error'; error: unknown };

/** Structural subset of `expo-web-browser`'s `WebBrowserAuthSessionResult` this model needs. */
export interface AuthSessionResult {
  type: string;
  url?: string;
}

export interface SteamConnectOpenIdDeps {
  steamConnectStart: (returnTo: string) => Promise<{ authorizeUrl: string; state: string }>;
  steamConnectCallback: (query: Record<string, string>) => Promise<UserIntegrationResponse>;
  openAuthSession: (authorizeUrl: string, returnTo: string) => Promise<AuthSessionResult>;
  makeRedirectUri: () => string;
}

/**
 * The testable core of one Steam connect attempt (task 4.5). Every I/O
 * boundary is injected, mirroring `runOAuthSignIn`'s split — but this isn't
 * `runOAuthSignIn` with a third provider branch: Steam's OpenID 2.0 return
 * carries no `code`, so there's nothing to extract from the redirect beyond
 * the full querystring, which is forwarded to `/callback` unparsed and
 * unverified — verification happens entirely server-side
 * (`SteamOpenIdProvider.verifyAssertion`). This function never sees whether
 * the assertion was genuine; it only relays bytes between Steam's browser
 * sheet and the two `/auth/connect/steam/*` endpoints.
 */
export async function runSteamConnectOpenId(
  deps: SteamConnectOpenIdDeps,
): Promise<SteamConnectOpenIdResult> {
  try {
    const returnTo = deps.makeRedirectUri();
    const { authorizeUrl } = await deps.steamConnectStart(returnTo);

    const result = await deps.openAuthSession(authorizeUrl, returnTo);
    if (result.type !== 'success' || result.url === undefined) {
      return { status: 'cancelled' };
    }

    const query = Object.fromEntries(new URL(result.url).searchParams.entries());
    const state = query.state;
    if (typeof state !== 'string' || state.length === 0) {
      return { status: 'cancelled' };
    }

    const integration = await deps.steamConnectCallback(query);
    return { status: 'success', integration };
  } catch (error) {
    return { status: 'error', error };
  }
}
