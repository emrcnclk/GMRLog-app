import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useEffect, useState, type ReactNode } from 'react';

import {
  createPersistDehydrateOptions,
  createQueryPersister,
  QUERY_CACHE_BUSTER,
  QUERY_CACHE_MAX_AGE_MS,
} from '../offline';
import { bindQueryOnlineManager } from '../offline/bind-online-manager';

import { createAppQueryClient } from './query-client';

export interface AppQueryProviderProps {
  children: ReactNode;
}

/**
 * PersistQueryClient + AsyncStorage (D3.15).
 * Safe hydration · cache buster · durable paused mutations only when meta.durable.
 */
export function AppQueryProvider({ children }: AppQueryProviderProps) {
  const [client] = useState(() => createAppQueryClient());
  const [persister] = useState(() => createQueryPersister());

  useEffect(() => {
    const unbind = bindQueryOnlineManager();
    return unbind;
  }, []);

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister,
        maxAge: QUERY_CACHE_MAX_AGE_MS,
        buster: QUERY_CACHE_BUSTER,
        dehydrateOptions: createPersistDehydrateOptions(),
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
