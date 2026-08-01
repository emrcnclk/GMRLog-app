import type { SessionState } from '@gmrlog/types';
import { createContext } from 'react';

import type { SessionManager } from './session-manager';

export interface AuthContextValue {
  state: SessionState;
  manager: SessionManager;
  isAuthenticated: boolean;
  isGuest: boolean;
  isBootstrapping: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
