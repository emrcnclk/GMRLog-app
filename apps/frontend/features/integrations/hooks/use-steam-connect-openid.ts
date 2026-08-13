import { useQueryClient } from '@tanstack/react-query';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { queryKeys } from '../../../src/query/query-client';

import { runSteamConnectOpenId, type SteamConnectOpenIdResult } from './steam-connect-openid-model';

export type { SteamConnectOpenIdResult } from './steam-connect-openid-model';

WebBrowser.maybeCompleteAuthSession();

/**
 * Drives one Steam connect attempt end to end (task 4.5). Real
 * `expo-auth-session` / `expo-web-browser` calls bound to the API client,
 * same split as `useOAuthSignIn` — the branching logic lives in the
 * testable `runSteamConnectOpenId` (`steam-connect-openid-model.ts`).
 */
export function useSteamConnectOpenId() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  const connect = useCallback(async (): Promise<SteamConnectOpenIdResult> => {
    setPending(true);
    try {
      const result = await runSteamConnectOpenId({
        steamConnectStart: async (returnTo) => {
          const envelope = await api.steamConnectStart({ returnTo });
          return envelope.data;
        },
        steamConnectCallback: async (query) => {
          const envelope = await api.steamConnectCallback({ query });
          return envelope.data;
        },
        openAuthSession: (authorizeUrl, returnTo) =>
          WebBrowser.openAuthSessionAsync(authorizeUrl, returnTo),
        makeRedirectUri: () => AuthSession.makeRedirectUri({ path: 'oauth/steam/callback' }),
      });

      if (result.status === 'success') {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.integrations.all }),
          queryClient.invalidateQueries({ queryKey: queryKeys.library.all }),
        ]);
      }

      return result;
    } finally {
      setPending(false);
    }
  }, [api, queryClient]);

  return { connect, pending };
}
