import { createContext, createElement, useContext, useMemo, type ReactNode } from 'react';

import { loadFrontendEnv } from '../../lib/env';
import { useAuth } from '../auth/auth-provider';
import { clearAuthAfterInterceptorFailure, useAuthStore } from '../state/auth-store';
import { useConnectivityStore } from '../state/stores';

import { AxiosApiClient, createAxiosApiClient } from './axios-client';

export interface ApiProviderProps {
  children: ReactNode;
}

const ApiClientContext = createContext<AxiosApiClient | null>(null);

/**
 * Axios API provider — JWT · refresh · request id · idempotency · offline fail-fast (D3.15).
 */
export function ApiProvider({ children }: ApiProviderProps) {
  const { manager } = useAuth();

  const client = useMemo(() => {
    const env = loadFrontendEnv();
    return createAxiosApiClient({
      baseUrl: env.EXPO_PUBLIC_API_URL,
      getAccessToken: () => manager.getAccessToken(),
      getRefreshToken: () => manager.getRefreshToken(),
      onSessionRefreshed: async (tokens) => {
        await manager.applyRefreshedTokens(tokens);
        useAuthStore.setState({ accessToken: tokens.accessToken });
      },
      onSessionCleared: async (error) => {
        await clearAuthAfterInterceptorFailure(manager, error);
      },
      isOnline: () => useConnectivityStore.getState().isOnline,
    });
  }, [manager]);

  return createElement(ApiClientContext.Provider, { value: client }, children);
}

export function useApiClient(): AxiosApiClient {
  const client = useContext(ApiClientContext);
  if (!client) {
    throw new Error('useApiClient must be used within ApiProvider');
  }
  return client;
}
