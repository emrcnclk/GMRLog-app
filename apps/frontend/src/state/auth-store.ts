import type { SessionCredentialResponse, UserSelfResponse } from '@gmrlog/types';
import type { SessionRegisterInput } from '@gmrlog/validators';
import type { QueryClient } from '@tanstack/react-query';
import { create } from 'zustand';

import { FrontendApiError, type AxiosApiClient } from '../api/axios-client';
import { isAccessTokenExpired } from '../auth/jwt';
import type { SessionManager } from '../auth/session-manager';
import { queryKeys } from '../query/query-client';

export interface AuthRuntime {
  api: AxiosApiClient;
  manager: SessionManager;
  queryClient: QueryClient;
}

export interface AuthStoreState {
  user: UserSelfResponse | null;
  accessToken: string | null;
  authenticated: boolean;
  /**
   * The session itself is being resolved, and no screen owns the outcome — app
   * start (`bootstrap`) and teardown (`logout`). Every route group gates its
   * whole `<Stack>` on this, so anything that sets it **unmounts the screen that
   * called it**.
   *
   * It is deliberately *not* set by `login` or `register`: those are form
   * submissions, the form owns the outcome, and unmounting the form destroys the
   * error banner it is about to set (3.13). Submit state stays local to the
   * screen — see `login-screen.tsx` / `register-screen.tsx`.
   */
  bootstrapping: boolean;
  bindRuntime: (runtime: AuthRuntime) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (input: SessionRegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  bootstrap: () => Promise<void>;
}

let runtime: AuthRuntime | null = null;

function requireRuntime(): AuthRuntime {
  if (!runtime) {
    throw new Error('Auth store runtime is not bound');
  }
  return runtime;
}

function readTokensFromEnvelope(data: unknown): SessionCredentialResponse | null {
  if (data === null || typeof data !== 'object') {
    return null;
  }
  const record = data as Record<string, unknown>;
  const accessToken = record.accessToken;
  const refreshToken = record.refreshToken;
  if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
    return null;
  }
  if (accessToken.length === 0 || refreshToken.length === 0) {
    return null;
  }
  return { accessToken, refreshToken };
}

/**
 * `status === 0` is `AxiosApiClient`'s uniform signal for "no response arrived" —
 * a genuine network failure, a timeout, or its own request-interceptor's fail-fast
 * offline gate (`axios-client.ts`'s `isOnline` check throws exactly this shape).
 * It is never a status a real server response carries, so it is safe to treat as
 * "couldn't reach the server," distinct from an explicit rejection (401, etc.).
 */
function isNetworkError(error: unknown): boolean {
  return error instanceof FrontendApiError && error.status === 0;
}

async function fetchMeAndActivate(
  api: AxiosApiClient,
  manager: SessionManager,
  queryClient: QueryClient,
  set: (partial: Partial<AuthStoreState>) => void,
): Promise<void> {
  const envelope = await api.me();
  queryClient.setQueryData(queryKeys.me, envelope.data);
  manager.markAuthenticated();
  set({
    user: envelope.data,
    accessToken: manager.getAccessToken(),
    authenticated: true,
    bootstrapping: false,
  });
}

async function clearLocalSession(
  manager: SessionManager,
  queryClient: QueryClient,
  set: (partial: Partial<AuthStoreState>) => void,
): Promise<void> {
  await manager.clearSession();
  queryClient.clear();
  set({
    user: null,
    accessToken: null,
    authenticated: false,
    bootstrapping: false,
  });
}

/** Used by Axios 401 recovery when refresh fails. */
export async function clearAuthAfterInterceptorFailure(manager: SessionManager): Promise<void> {
  if (runtime) {
    await clearLocalSession(manager, runtime.queryClient, (partial) => {
      useAuthStore.setState(partial);
    });
    return;
  }
  await manager.clearSession();
  useAuthStore.setState({
    user: null,
    accessToken: null,
    authenticated: false,
    bootstrapping: false,
  });
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  user: null,
  accessToken: null,
  authenticated: false,
  bootstrapping: true,

  bindRuntime: (next) => {
    runtime = next;
  },

  // Neither `login` nor `register` touches `bootstrapping`, on either path: the
  // guest `<Stack>` has to stay mounted for the whole round-trip so the screen
  // survives to render its own error. The caller's `catch` is what reports a
  // failure, and it can only reach a screen that is still there.
  login: async (email, password) => {
    const { api, manager, queryClient } = requireRuntime();
    try {
      const envelope = await api.login({ email, password });
      const tokens = readTokensFromEnvelope(envelope.data);
      if (!tokens) {
        throw new Error('Session response did not include credentials');
      }
      await manager.persistTokens(tokens);
      await fetchMeAndActivate(api, manager, queryClient, set);
    } catch (error) {
      set({ authenticated: false, user: null, accessToken: null });
      throw error;
    }
  },

  register: async (input) => {
    const { api, manager, queryClient } = requireRuntime();
    try {
      const envelope = await api.register(input);
      const tokens = readTokensFromEnvelope(envelope.data);
      if (!tokens) {
        throw new Error('Session response did not include credentials');
      }
      await manager.persistTokens(tokens);
      await fetchMeAndActivate(api, manager, queryClient, set);
    } catch (error) {
      set({ authenticated: false, user: null, accessToken: null });
      throw error;
    }
  },

  logout: async () => {
    const { api, manager, queryClient } = requireRuntime();
    // Teardown *does* take the gate. `queryClient.clear()` under a mounted app
    // shell would have every active query refetch against a session that is
    // being revoked; no screen owns the outcome, and `logout` resolves either
    // way — the local clear is authoritative.
    set({ bootstrapping: true });
    try {
      await api.logoutSession();
    } catch {
      // Local clear is authoritative when network logout fails.
    }
    await clearLocalSession(manager, queryClient, set);
  },

  // A network failure (no response — see `isNetworkError`) is rethrown rather
  // than swallowed to `false`, so `bootstrap` can tell "the refresh token was
  // rejected" from "couldn't reach the server to ask." Nothing outside this
  // store calls `refresh` today, so widening its failure contract is safe.
  refresh: async () => {
    const { api, manager } = requireRuntime();
    const refreshToken = manager.getRefreshToken();
    if (!refreshToken) {
      return false;
    }
    try {
      const envelope = await api.refreshSession(refreshToken);
      const tokens = readTokensFromEnvelope(envelope.data);
      if (!tokens) {
        return false;
      }
      await manager.applyRefreshedTokens(tokens);
      set({ accessToken: tokens.accessToken });
      return true;
    } catch (error) {
      if (isNetworkError(error)) {
        throw error;
      }
      return false;
    }
  },

  /**
   * A network failure here means "couldn't verify right now," not "the
   * session is invalid" (3b.1c). Wiping tokens on every unreachable API would
   * conflate the two and log the viewer out just because the backend was
   * briefly down — so a network failure keeps the hydrated tokens and mounts
   * the app optimistically-authenticated, trusting cached data and each
   * query's own offline/error state to carry the real picture. Only an
   * explicit rejection (a real 401, or `/me`/refresh genuinely saying no)
   * clears the session.
   */
  bootstrap: async () => {
    const { api, manager, queryClient } = requireRuntime();
    set({ bootstrapping: true, authenticated: false, user: null });

    const material = await manager.hydrate();
    if (!material) {
      manager.markGuest();
      set({
        user: null,
        accessToken: null,
        authenticated: false,
        bootstrapping: false,
      });
      return;
    }

    set({ accessToken: material.accessToken });

    const staySignedInOffline = (): void => {
      manager.markAuthenticated();
      set({ authenticated: true, bootstrapping: false });
    };

    try {
      if (isAccessTokenExpired(material.accessToken)) {
        let refreshed: boolean;
        try {
          refreshed = await get().refresh();
        } catch (error) {
          if (isNetworkError(error)) {
            staySignedInOffline();
            return;
          }
          throw error;
        }
        if (!refreshed) {
          await clearLocalSession(manager, queryClient, set);
          return;
        }
      }

      await fetchMeAndActivate(api, manager, queryClient, set);
    } catch (error) {
      if (isNetworkError(error)) {
        staySignedInOffline();
        return;
      }
      let recovered: boolean;
      try {
        recovered = await get().refresh();
      } catch (refreshError) {
        if (isNetworkError(refreshError)) {
          staySignedInOffline();
          return;
        }
        recovered = false;
      }
      if (!recovered) {
        await clearLocalSession(manager, queryClient, set);
        return;
      }
      try {
        await fetchMeAndActivate(api, manager, queryClient, set);
      } catch (innerError) {
        if (isNetworkError(innerError)) {
          staySignedInOffline();
          return;
        }
        await clearLocalSession(manager, queryClient, set);
      }
    }
  },
}));
