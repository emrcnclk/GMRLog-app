import type { UserSelfResponse } from '@gmrlog/types';
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AxiosApiClient } from '../api/axios-client';
import { SessionManager } from '../auth/session-manager';
import { createInMemorySecureStorage } from '../../lib/storage/secure-storage';
import { useAuthStore } from './auth-store';

const meUser: UserSelfResponse = {
  id: 'user-1',
  handle: 'playerone',
  displayName: 'Player One',
  bio: null,
  avatarUrl: null,
  bannerUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  connectedProviders: [],
};

function makeJwt(expSecondsFromNow: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expSecondsFromNow }),
  ).toString('base64url');
  return `${header}.${payload}.sig`;
}

function createMockApi(overrides: Partial<AxiosApiClient> = {}): AxiosApiClient {
  return {
    login: vi.fn(),
    register: vi.fn(),
    logoutSession: vi.fn(),
    refreshSession: vi.fn(),
    me: vi.fn(),
    ...overrides,
  } as unknown as AxiosApiClient;
}

describe('useAuthStore', () => {
  let manager: SessionManager;
  let queryClient: QueryClient;

  beforeEach(() => {
    manager = new SessionManager(createInMemorySecureStorage());
    queryClient = new QueryClient();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      authenticated: false,
      bootstrapping: true,
    });
  });

  it('bootstrap marks guest when no tokens exist', async () => {
    const api = createMockApi();
    useAuthStore.getState().bindRuntime({ api, manager, queryClient });
    await useAuthStore.getState().bootstrap();
    expect(useAuthStore.getState().authenticated).toBe(false);
    expect(useAuthStore.getState().bootstrapping).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('bootstrap refreshes expired access then loads /me', async () => {
    const expired = makeJwt(-60);
    const fresh = makeJwt(600);
    await manager.persistTokens({ accessToken: expired, refreshToken: 'refresh-1' });

    const api = createMockApi({
      refreshSession: vi.fn().mockResolvedValue({
        data: { accessToken: fresh, refreshToken: 'refresh-2' },
        meta: { requestId: 'r1' },
      }),
      me: vi.fn().mockResolvedValue({ data: meUser, meta: { requestId: 'm1' } }),
    });

    useAuthStore.getState().bindRuntime({ api, manager, queryClient });
    await useAuthStore.getState().bootstrap();

    expect(api.refreshSession).toHaveBeenCalledWith('refresh-1');
    expect(useAuthStore.getState().authenticated).toBe(true);
    expect(useAuthStore.getState().user).toEqual(meUser);
    expect(useAuthStore.getState().accessToken).toBe(fresh);
  });

  it('bootstrap logs out when refresh fails', async () => {
    const expired = makeJwt(-60);
    await manager.persistTokens({ accessToken: expired, refreshToken: 'refresh-1' });
    const api = createMockApi({
      refreshSession: vi.fn().mockRejectedValue(new Error('refresh failed')),
    });

    useAuthStore.getState().bindRuntime({ api, manager, queryClient });
    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState().authenticated).toBe(false);
    expect(manager.getAccessToken()).toBeNull();
    expect(useAuthStore.getState().bootstrapping).toBe(false);
  });

  it('login stores tokens and UserSelfResponse from /me', async () => {
    const access = makeJwt(600);
    const api = createMockApi({
      login: vi.fn().mockResolvedValue({
        data: { accessToken: access, refreshToken: 'refresh-1' },
        meta: { requestId: 'l1' },
      }),
      me: vi.fn().mockResolvedValue({ data: meUser, meta: { requestId: 'm1' } }),
    });

    useAuthStore.getState().bindRuntime({ api, manager, queryClient });
    await useAuthStore.getState().login('player@example.com', 'password-here');

    expect(useAuthStore.getState().authenticated).toBe(true);
    expect(useAuthStore.getState().user?.handle).toBe('playerone');
    expect(manager.getRefreshToken()).toBe('refresh-1');
  });

  it('register stores tokens and UserSelfResponse from /me', async () => {
    const access = makeJwt(600);
    const api = createMockApi({
      register: vi.fn().mockResolvedValue({
        data: { accessToken: access, refreshToken: 'refresh-reg' },
        meta: { requestId: 'r1' },
      }),
      me: vi.fn().mockResolvedValue({ data: meUser, meta: { requestId: 'm1' } }),
    });

    useAuthStore.getState().bindRuntime({ api, manager, queryClient });
    await useAuthStore.getState().register({
      email: 'player@example.com',
      password: 'secure-password-12',
      displayName: 'Player One',
      handle: 'playerone',
    });

    expect(api.register).toHaveBeenCalledWith({
      email: 'player@example.com',
      password: 'secure-password-12',
      displayName: 'Player One',
      handle: 'playerone',
    });
    expect(useAuthStore.getState().authenticated).toBe(true);
    expect(manager.getRefreshToken()).toBe('refresh-reg');
  });

  it('logout clears store, query cache, and secure material', async () => {
    const access = makeJwt(600);
    await manager.establishSession({ accessToken: access, refreshToken: 'r' });
    queryClient.setQueryData(['me'], meUser);
    useAuthStore.setState({
      user: meUser,
      accessToken: access,
      authenticated: true,
      bootstrapping: false,
    });

    const api = createMockApi({
      logoutSession: vi.fn().mockResolvedValue({ data: null, meta: { requestId: 'o1' } }),
    });
    useAuthStore.getState().bindRuntime({ api, manager, queryClient });
    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().authenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(manager.getAccessToken()).toBeNull();
    expect(queryClient.getQueryData(['me'])).toBeUndefined();
  });

  /**
   * 3.13. Every route group swaps its whole `<Stack>` for the "Starting GMRLOG"
   * screen while `bootstrapping` is true, so a submit that raises it unmounts
   * the form mid-flight and the `catch` sets its banner on a dead screen. The
   * flag must not go up at *any* point during a submit — not just at the end —
   * which is why these subscribe rather than read the final state.
   */
  function recordBootstrapping(): () => boolean[] {
    const seen: boolean[] = [useAuthStore.getState().bootstrapping];
    const unsubscribe = useAuthStore.subscribe((s) => {
      seen.push(s.bootstrapping);
    });
    return () => {
      unsubscribe();
      return seen;
    };
  }

  it('a failed login never raises bootstrapping — the form stays mounted', async () => {
    useAuthStore.setState({ bootstrapping: false });
    const api = createMockApi({
      login: vi.fn().mockRejectedValue(new Error('Invalid credentials')),
    });
    useAuthStore.getState().bindRuntime({ api, manager, queryClient });

    const stop = recordBootstrapping();
    await expect(useAuthStore.getState().login('player@example.com', 'wrong')).rejects.toThrow();

    expect(stop()).not.toContain(true);
    expect(useAuthStore.getState().authenticated).toBe(false);
  });

  it('a failed register never raises bootstrapping — the form stays mounted', async () => {
    useAuthStore.setState({ bootstrapping: false });
    const api = createMockApi({
      register: vi.fn().mockRejectedValue(new Error('Handle already taken')),
    });
    useAuthStore.getState().bindRuntime({ api, manager, queryClient });

    const stop = recordBootstrapping();
    await expect(
      useAuthStore.getState().register({
        email: 'player@example.com',
        password: 'secure-password-12',
        displayName: 'Player One',
        handle: 'playerone',
      }),
    ).rejects.toThrow();

    expect(stop()).not.toContain(true);
    expect(useAuthStore.getState().authenticated).toBe(false);
  });

  it('a successful login never raises bootstrapping either', async () => {
    useAuthStore.setState({ bootstrapping: false });
    const access = makeJwt(600);
    const api = createMockApi({
      login: vi.fn().mockResolvedValue({
        data: { accessToken: access, refreshToken: 'refresh-1' },
        meta: { requestId: 'l1' },
      }),
      me: vi.fn().mockResolvedValue({ data: meUser, meta: { requestId: 'm1' } }),
    });
    useAuthStore.getState().bindRuntime({ api, manager, queryClient });

    const stop = recordBootstrapping();
    await useAuthStore.getState().login('player@example.com', 'password-here');

    expect(stop()).not.toContain(true);
    expect(useAuthStore.getState().authenticated).toBe(true);
  });

  it('logout keeps the gate — no screen owns its outcome', async () => {
    const access = makeJwt(600);
    await manager.establishSession({ accessToken: access, refreshToken: 'r' });
    useAuthStore.setState({ authenticated: true, bootstrapping: false });
    const api = createMockApi({
      logoutSession: vi.fn().mockResolvedValue({ data: null, meta: { requestId: 'o1' } }),
    });
    useAuthStore.getState().bindRuntime({ api, manager, queryClient });

    const stop = recordBootstrapping();
    await useAuthStore.getState().logout();

    expect(stop()).toContain(true);
    expect(useAuthStore.getState().bootstrapping).toBe(false);
  });
});
