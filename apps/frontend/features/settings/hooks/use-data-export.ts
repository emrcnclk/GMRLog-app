import { useCallback, useState } from 'react';

import { useApiClient } from '../../../src/api/api-provider';
import { mapAuthError } from '../../../src/auth/map-auth-error';
import { useConnectivityStore } from '../../../src/state/stores';
import { saveDataExport } from '../model/save-data-export';

export function useDataExportAction() {
  const api = useApiClient();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ title: string; description: string } | null>(null);
  const [done, setDone] = useState(false);

  const run = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const envelope = await api.requestDataExport();
      await saveDataExport(envelope.data);
      setDone(true);
    } catch (err) {
      const mapped = mapAuthError(err, isOnline);
      setError({ title: mapped.title, description: mapped.description });
    } finally {
      setBusy(false);
    }
  }, [api, isOnline]);

  return {
    run,
    busy,
    error,
    done,
    clearError: () => {
      setError(null);
    },
  };
}
