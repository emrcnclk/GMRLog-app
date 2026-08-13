import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';

import { useApiClient } from '../../../src/api/api-provider';

import { runOAuthConnect, type OAuthConnectResult } from './oauth-connect-model';

export type { OAuthConnectResult } from './oauth-connect-model';

WebBrowser.maybeCompleteAuthSession();

/**
 * Drives one Settings "Connect" attempt end to end (task 4.7). Real
 * `expo-auth-session` / `expo-web-browser` calls bound to `runOAuthConnect`
 * — mirrors `useOAuthSignIn` (`features/auth/hooks/use-oauth-sign-in.ts`)
 * exactly, swapping the auth-store's `oauthStart`/`completeOAuth` for the
 * authenticated `/connect/start` / `/connect/callback` pair.
 */
export function useOAuthConnect() {
  const api = useApiClient();
  const [pending, setPending] = useState(false);

  const connect = useCallback(
    async (provider: 'google' | 'discord'): Promise<OAuthConnectResult> => {
      setPending(true);
      try {
        return await runOAuthConnect(provider, {
          connectStart: async (p, redirectUri) => {
            const envelope = await api.oauthConnectStart(p, { redirectUri });
            return envelope.data;
          },
          connectCallback: async ({ provider: p, state, code }) => {
            await api.oauthConnectCallback(p, { state, code });
          },
          openAuthSession: (authorizeUrl, redirectUri) =>
            WebBrowser.openAuthSessionAsync(authorizeUrl, redirectUri),
          makeRedirectUri: () => AuthSession.makeRedirectUri({ path: 'oauth/callback' }),
        });
      } finally {
        setPending(false);
      }
    },
    [api],
  );

  return { connect, pending };
}
