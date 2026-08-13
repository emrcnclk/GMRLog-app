import type { OAuthProviderKind } from '@gmrlog/types';
import { useCallback, useState } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { mapAuthError, type AuthUiError } from '../../../src/auth/map-auth-error';
import { useConnectivityStore } from '../../../src/state/stores';

import { useSignInMethods } from './use-sign-in-methods';

/** Task 4.7 — disconnect a Google/Discord login method, guarded server-side by the last-method rule. */
export function useDisconnectProvider() {
  const api = useApiClient();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const { refresh } = useSignInMethods();
  const [busyProvider, setBusyProvider] = useState<OAuthProviderKind | null>(null);
  const [error, setError] = useState<AuthUiError | null>(null);

  const disconnect = useCallback(
    async (provider: OAuthProviderKind) => {
      setBusyProvider(provider);
      setError(null);
      try {
        await api.disconnectOauthProvider(provider);
        await refresh();
      } catch (err) {
        setError(mapAuthError(err, isOnline));
      } finally {
        setBusyProvider(null);
      }
    },
    [api, isOnline, refresh],
  );

  return {
    disconnect,
    busyProvider,
    error,
    clearError: () => {
      setError(null);
    },
  };
}
