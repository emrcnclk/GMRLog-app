import { useQueryClient } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';

import { useApiClient } from '../api/api-provider';
import { useAuthStore } from '../state/auth-store';

import { useAuth } from './auth-provider';

/**
 * Binds API + SessionManager + QueryClient, then runs splash bootstrap once.
 */
export function AuthSessionBootstrap({ children }: { children: ReactNode }) {
  const api = useApiClient();
  const { manager } = useAuth();
  const queryClient = useQueryClient();
  const bindRuntime = useAuthStore((s) => s.bindRuntime);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    bindRuntime({ api, manager, queryClient });
    void bootstrap();
  }, [api, manager, queryClient, bindRuntime, bootstrap]);

  return children;
}
