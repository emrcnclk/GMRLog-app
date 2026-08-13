import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';

import { useAuthStore } from '../../../src/state/auth-store';
import type { AuthOauthProvider } from '../oauth-provider-buttons';

import { runOAuthSignIn, type OAuthSignInResult } from './oauth-sign-in-model';

export type { OAuthSignInResult } from './oauth-sign-in-model';

WebBrowser.maybeCompleteAuthSession();

/**
 * Drives one OAuth attempt end to end (OAUTH.md §2), provider as an argument
 * per the doc's file layout. `google` and `discord` are wired to a real
 * backend flow (4.5 adds Steam, which is OpenID 2.0 and won't fit this
 * shape); anything else resolves `unavailable` so the screen can fall back
 * to its existing "not available yet" banner. The branching logic itself
 * lives in `runOAuthSignIn` (`oauth-sign-in-model.ts`) — this hook is just
 * real `expo-auth-session` / `expo-web-browser` calls and the auth store,
 * bound to it.
 */
export function useOAuthSignIn() {
  const storeOauthStart = useAuthStore((s) => s.oauthStart);
  const storeCompleteOAuth = useAuthStore((s) => s.completeOAuth);
  const [pending, setPending] = useState(false);

  const signIn = useCallback(
    async (provider: AuthOauthProvider): Promise<OAuthSignInResult> => {
      setPending(true);
      try {
        return await runOAuthSignIn(provider, {
          oauthStart: storeOauthStart,
          completeOAuth: storeCompleteOAuth,
          openAuthSession: (authorizeUrl, redirectUri) =>
            WebBrowser.openAuthSessionAsync(authorizeUrl, redirectUri),
          makeRedirectUri: () => AuthSession.makeRedirectUri({ path: 'oauth/callback' }),
        });
      } finally {
        setPending(false);
      }
    },
    [storeOauthStart, storeCompleteOAuth],
  );

  return { signIn, pending };
}
