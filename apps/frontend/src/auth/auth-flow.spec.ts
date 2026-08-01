import type { ApiEnvelope } from '@gmrlog/types';
import { describe, expect, it, vi } from 'vitest';

import { FrontendApiError } from '../api/axios-client';
import { SessionManager } from './session-manager';
import { createInMemorySecureStorage } from '../../lib/storage/secure-storage';
import { QueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../state/auth-store';
import type { AxiosApiClient } from '../api/axios-client';
import type { UserSelfResponse } from '@gmrlog/types';

const user: UserSelfResponse = {
  id: 'u1',
  handle: 'gamer',
  displayName: 'Gamer',
  bio: null,
  avatarUrl: null,
  bannerUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  connectedProviders: [],
};

describe('auth flow', () => {
  it('login → /me → authenticated → logout → guest', async () => {
    const manager = new SessionManager(createInMemorySecureStorage());
    const queryClient = new QueryClient();
    const api = {
      login: vi.fn().mockResolvedValue({
        data: { accessToken: 'access', refreshToken: 'refresh' },
        meta: { requestId: '1' },
      } satisfies ApiEnvelope<{ accessToken: string; refreshToken: string }>),
      me: vi.fn().mockResolvedValue({
        data: user,
        meta: { requestId: '2' },
      }),
      logoutSession: vi.fn().mockResolvedValue({ data: null, meta: { requestId: '3' } }),
      refreshSession: vi.fn(),
    } as unknown as AxiosApiClient;

    useAuthStore.setState({
      user: null,
      accessToken: null,
      authenticated: false,
      loading: false,
    });
    useAuthStore.getState().bindRuntime({ api, manager, queryClient });

    await useAuthStore.getState().login('a@b.co', 'password');
    expect(useAuthStore.getState().authenticated).toBe(true);
    expect(useAuthStore.getState().user?.id).toBe('u1');

    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().authenticated).toBe(false);
    expect(manager.getState()).toBe('guest');
  });

  it('failed login leaves guest and surfaces FrontendApiError', async () => {
    const manager = new SessionManager(createInMemorySecureStorage());
    const queryClient = new QueryClient();
    const api = {
      login: vi.fn().mockRejectedValue(new FrontendApiError('Invalid', 401, null, 'req')),
      me: vi.fn(),
      logoutSession: vi.fn(),
      refreshSession: vi.fn(),
    } as unknown as AxiosApiClient;

    useAuthStore.setState({
      user: null,
      accessToken: null,
      authenticated: false,
      loading: false,
    });
    useAuthStore.getState().bindRuntime({ api, manager, queryClient });

    await expect(useAuthStore.getState().login('a@b.co', 'bad')).rejects.toBeInstanceOf(
      FrontendApiError,
    );
    expect(useAuthStore.getState().authenticated).toBe(false);
    expect(manager.getAccessToken()).toBeNull();
  });
});
