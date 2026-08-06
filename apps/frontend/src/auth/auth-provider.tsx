import type { SessionState } from '@gmrlog/types';
import { useContext, useEffect, useMemo, type ReactNode } from 'react';
import { createElement } from 'react';

import { createExpoSecureStorage } from '../../lib/storage/expo-secure-storage';
import type { SecureStorage } from '../../lib/storage/secure-storage';
import { useAuthStore } from '../state/auth-store';

import { AuthContext, type AuthContextValue } from './auth-context';
import { SessionManager } from './session-manager';

export interface AuthProviderProps {
  children: ReactNode;
  storage?: SecureStorage;
}

/**
 * Auth foundation — SessionManager + Zustand auth store sync.
 * Bootstrap runs after ApiProvider binds runtime (see AuthSessionBootstrap).
 */
export function AuthProvider({ children, storage }: AuthProviderProps) {
  const manager = useMemo(
    () => new SessionManager(storage ?? createExpoSecureStorage()),
    [storage],
  );
  const authenticated = useAuthStore((s) => s.authenticated);
  const bootstrapping = useAuthStore((s) => s.bootstrapping);
  const logout = useAuthStore((s) => s.logout);

  const state: SessionState = bootstrapping ? 'unknown' : authenticated ? 'authenticated' : 'guest';

  useEffect(() => {
    const unsubscribe = manager.subscribe(() => {
      // Manager notifies token lifecycle; store is the auth UI authority.
    });
    return unsubscribe;
  }, [manager]);

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      manager,
      isAuthenticated: authenticated,
      isGuest: !bootstrapping && !authenticated,
      isBootstrapping: bootstrapping,
      logout: async () => {
        await logout();
      },
    }),
    [state, manager, authenticated, bootstrapping, logout],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
