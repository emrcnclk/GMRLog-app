import { describe, expect, it, vi } from 'vitest';

import { createAuthClient } from './auth-client.js';
import type { ApiClient, ApiRequestOptions } from './client.js';

function createApiClientStub(): { api: ApiClient; calls: ApiRequestOptions[] } {
  const calls: ApiRequestOptions[] = [];
  const request = vi.fn(async (options: ApiRequestOptions) => {
    calls.push(options);
    return { data: null, meta: { requestId: 'req_test' } };
  });
  const api = {
    request,
    get: (path: string) => request({ method: 'GET', path }),
    post: (path: string, body?: unknown, idempotencyKey?: string) =>
      request({ method: 'POST', path, body, idempotencyKey }),
    delete: (path: string) => request({ method: 'DELETE', path }),
  } as unknown as ApiClient;
  return { api, calls };
}

describe('createAuthClient', () => {
  it('targets the S1 §13.1 / §13.3 session paths', async () => {
    const { api, calls } = createApiClientStub();
    const auth = createAuthClient(api);

    await auth.login({ email: 'player@example.test', password: 'secret' }, 'idem-1');
    await auth.refresh('refresh-token');
    await auth.logout();
    await auth.me();

    expect(calls).toEqual([
      expect.objectContaining({ method: 'POST', path: '/sessions', idempotencyKey: 'idem-1' }),
      expect.objectContaining({
        method: 'POST',
        path: '/sessions/refresh',
        body: { refreshToken: 'refresh-token' },
      }),
      expect.objectContaining({ method: 'DELETE', path: '/sessions/current' }),
      expect.objectContaining({ method: 'GET', path: '/me' }),
    ]);
  });
});
