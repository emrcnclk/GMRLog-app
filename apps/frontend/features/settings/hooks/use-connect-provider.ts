import type { OAuthProviderKind } from '@gmrlog/types';
import { useCallback, useState } from 'react';

import { mapAuthError, type AuthUiError } from '../../../src/auth/map-auth-error';
import { useConnectivityStore } from '../../../src/state/stores';

import { useOAuthConnect } from './use-oauth-connect';
import { useSignInMethods } from './use-sign-in-methods';

/** Task 4.7 — connect a Google/Discord login method from Settings. */
export function useConnectProvider() {
  const { connect: runConnect, pending } = useOAuthConnect();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const { refresh } = useSignInMethods();
  const [error, setError] = useState<AuthUiError | null>(null);

  const connect = useCallback(
    async (provider: OAuthProviderKind) => {
      setError(null);
      const result = await runConnect(provider);
      switch (result.status) {
        case 'success':
          await refresh();
          return;
        case 'cancelled':
          return;
        case 'unavailable':
          setError({
            kind: 'unavailable',
            title: 'Provider unavailable',
            description: 'That sign-in provider is not responding. Try again, or use email.',
          });
          return;
        case 'error':
          setError(mapAuthError(result.error, isOnline));
      }
    },
    [runConnect, isOnline, refresh],
  );

  return {
    connect,
    pending,
    error,
    clearError: () => {
      setError(null);
    },
  };
}
