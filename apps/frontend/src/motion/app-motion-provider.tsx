import { MotionProvider, useMotion } from '@gmrlog/ui';
import { useQuery } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';

import { useApiClient } from '../api/api-provider';
import { useAuth } from '../auth/auth-provider';
import { queryKeys } from '../query/query-client';

/**
 * Wraps children with MotionProvider and syncs settings.reduceMotion → motion context.
 */
export function AppMotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionProvider>
      <SettingsReduceMotionBridge />
      {children}
    </MotionProvider>
  );
}

function SettingsReduceMotionBridge() {
  const api = useApiClient();
  const { isAuthenticated } = useAuth();
  const { setAppReduceMotion } = useMotion();

  const query = useQuery({
    queryKey: queryKeys.settings,
    enabled: isAuthenticated,
    queryFn: async () => {
      const envelope = await api.settings();
      return envelope.data;
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    if (query.data) {
      setAppReduceMotion(query.data.accessibility.reduceMotion);
    }
  }, [query.data, setAppReduceMotion]);

  return null;
}
