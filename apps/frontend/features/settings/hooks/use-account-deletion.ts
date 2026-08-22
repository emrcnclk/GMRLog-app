import type { AccountDeletionStatusResponse } from '@gmrlog/types';
import { useCallback, useEffect, useState } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { mapAuthError } from '../../../src/auth/map-auth-error';
import { useConnectivityStore } from '../../../src/state/stores';

type DeletionStatus = 'loading' | 'ready' | 'error';

/**
 * 12.6 — the delete-account screen's read model and its two actions.
 *
 * A hand-rolled hook rather than react-query, following `useDataExportAction`'s
 * own precedent (`use-data-export.ts`): this is a rare, deliberate action a
 * player takes at most a few times ever, not cached list state two screens
 * might disagree about.
 */
export function useAccountDeletion() {
  const api = useApiClient();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const [status, setStatus] = useState<DeletionStatus>('loading');
  const [deletion, setDeletion] = useState<AccountDeletionStatusResponse | null>(null);
  const [error, setError] = useState<{ title: string; description: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const envelope = await api.getAccountDeletionStatus();
      setDeletion(envelope.data);
      setStatus('ready');
    } catch (err) {
      const mapped = mapAuthError(err, isOnline);
      setError({ title: mapped.title, description: mapped.description });
      setStatus('error');
    }
  }, [api, isOnline]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const requestDeletion = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const envelope = await api.requestAccountDeletion();
      setDeletion(envelope.data);
    } catch (err) {
      const mapped = mapAuthError(err, isOnline);
      setError({ title: mapped.title, description: mapped.description });
    } finally {
      setBusy(false);
    }
  }, [api, isOnline]);

  const cancelDeletion = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const envelope = await api.cancelAccountDeletion();
      setDeletion(envelope.data);
    } catch (err) {
      const mapped = mapAuthError(err, isOnline);
      setError({ title: mapped.title, description: mapped.description });
    } finally {
      setBusy(false);
    }
  }, [api, isOnline]);

  return { status, deletion, error, busy, refresh, requestDeletion, cancelDeletion };
}
