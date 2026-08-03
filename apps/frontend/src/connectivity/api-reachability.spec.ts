import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../config/runtime-flags', () => ({
  getApiBaseUrl: () => 'http://127.0.0.1:4000/api/v1',
}));

import { probeApiReachability } from './api-reachability';

describe('probeApiReachability', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is true when the API base URL answers ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 200 })),
    );

    await expect(probeApiReachability()).resolves.toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:4000/api/v1/health',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('is false on a non-ok response — reachable host, unhealthy service', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 503 })),
    );

    await expect(probeApiReachability()).resolves.toBe(false);
  });

  it('is false when the request throws — the case NetInfo cannot see', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED');
      }),
    );

    await expect(probeApiReachability()).resolves.toBe(false);
  });
});
