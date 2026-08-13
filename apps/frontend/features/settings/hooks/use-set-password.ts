import { useCallback, useState } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { mapAuthError, type AuthUiError } from '../../../src/auth/map-auth-error';
import { useConnectivityStore } from '../../../src/state/stores';

import { useSignInMethods } from './use-sign-in-methods';

/** Task 4.7's escape hatch — sets a password on an oauth-only account. */
export function useSetPassword() {
  const api = useApiClient();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const { refresh } = useSignInMethods();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthUiError | null>(null);

  const submit = useCallback(
    async (input: { email?: string; password: string }): Promise<boolean> => {
      setBusy(true);
      setError(null);
      try {
        await api.setPassword(input);
        await refresh();
        return true;
      } catch (err) {
        setError(mapAuthError(err, isOnline));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [api, isOnline, refresh],
  );

  return {
    submit,
    busy,
    error,
    clearError: () => {
      setError(null);
    },
  };
}
