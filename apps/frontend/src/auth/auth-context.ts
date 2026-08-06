import type { SessionState } from '@gmrlog/types';
import { createContext } from 'react';

import type { SessionManager } from './session-manager';

export interface AuthContextValue {
  state: SessionState;
  manager: SessionManager;
  isAuthenticated: boolean;
  isGuest: boolean;
  /**
   * Session resolution only — app start and logout. Every route group swaps its
   * whole `<Stack>` for a loading screen while this is true, so it must never
   * follow a form submission (`AuthStoreState.bootstrapping`).
   */
  isBootstrapping: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
