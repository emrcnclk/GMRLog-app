import { useCallback, useState } from 'react';

import { mapAuthError } from '../../../src/auth/map-auth-error';
import { useAuthStore } from '../../../src/state/auth-store';
import { useConnectivityStore } from '../../../src/state/stores';

export function useLogoutAction() {
  const logout = useAuthStore((s) => s.logout);
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ title: string; description: string } | null>(null);

  const run = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await logout();
    } catch (err) {
      const mapped = mapAuthError(err, isOnline);
      setError({ title: mapped.title, description: mapped.description });
    } finally {
      setBusy(false);
    }
  }, [isOnline, logout]);

  return {
    run,
    busy,
    error,
    clearError: () => {
      setError(null);
    },
  };
}
