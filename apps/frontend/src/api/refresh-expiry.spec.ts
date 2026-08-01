import { describe, expect, it, vi } from 'vitest';

import { createAxiosApiClient, type AxiosApiClient } from './axios-client';

type RefreshableClient = AxiosApiClient & {
  refreshSessionInterceptor: () => Promise<boolean>;
};

function asRefreshable(client: AxiosApiClient): RefreshableClient {
  return client as RefreshableClient;
}

describe('D3.16 refresh token expiry handling', () => {
  it('returns false when refresh token is missing', async () => {
    const onSessionCleared = vi.fn(async () => undefined);
    const onSessionRefreshed = vi.fn(async () => undefined);

    const client = createAxiosApiClient({
      baseUrl: 'http://localhost:4000/api/v1',
      getAccessToken: () => 'access',
      getRefreshToken: () => null,
      onSessionRefreshed,
      onSessionCleared,
    });

    await expect(asRefreshable(client).refreshSessionInterceptor()).resolves.toBe(false);
    expect(onSessionRefreshed).not.toHaveBeenCalled();
  });

  it('returns false when refresh request fails', async () => {
    const onSessionCleared = vi.fn(async () => undefined);
    const onSessionRefreshed = vi.fn(async () => undefined);

    const client = createAxiosApiClient({
      baseUrl: 'http://127.0.0.1:1/api/v1',
      getAccessToken: () => 'access',
      getRefreshToken: () => 'stale_refresh',
      onSessionRefreshed,
      onSessionCleared,
      maxRetries: 0,
    });

    await expect(asRefreshable(client).refreshSessionInterceptor()).resolves.toBe(false);
    expect(onSessionRefreshed).not.toHaveBeenCalled();
  });
});
