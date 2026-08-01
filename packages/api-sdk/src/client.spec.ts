import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiSdkError, createApiClient } from './client.js';

describe('createApiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends request id and optional authorization / idempotency headers', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ data: { ok: true }, meta: { requestId: 'req_test' } }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'x-gmrlog-request-id': 'req_test',
        },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = createApiClient({
      baseUrl: 'http://localhost:4000/api/v1',
      getAccessToken: () => 'token-placeholder',
      createRequestId: () => 'req_test',
    });

    const result = await client.post<{ ok: boolean }>('/health', { ping: true }, 'idem-1');
    expect(result.data.ok).toBe(true);

    expect(fetchMock).toHaveBeenCalled();
    const call = fetchMock.mock.calls[0];
    expect(call).toBeDefined();
    const init = call?.[1] as RequestInit | undefined;
    expect(init).toBeDefined();
    const headers = new Headers(init?.headers);
    expect(headers.get('X-Gmrlog-Request-Id')).toBe('req_test');
    expect(headers.get('Authorization')).toBe('Bearer token-placeholder');
    expect(headers.get('Idempotency-Key')).toBe('idem-1');
  });

  it('throws ApiSdkError for non-OK responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            error: {
              category: 'not_found',
              code: 'NOT_FOUND',
              message: 'Missing',
              requestId: 'r1',
              retryable: false,
            },
          }),
          { status: 404, headers: { 'content-type': 'application/json' } },
        );
      }),
    );

    const client = createApiClient({ baseUrl: 'http://localhost:4000/api/v1' });
    await expect(client.get('/missing')).rejects.toBeInstanceOf(ApiSdkError);
  });

  it('retries exactly once after onUnauthorized recovers a 401', async () => {
    const unauthorized = () =>
      new Response(
        JSON.stringify({
          error: {
            category: 'authn',
            code: 'UNAUTHENTICATED',
            message: 'Expired',
            requestId: 'r1',
            retryable: false,
          },
        }),
        { status: 401, headers: { 'content-type': 'application/json' } },
      );
    const ok = () =>
      new Response(JSON.stringify({ data: { ok: true }, meta: { requestId: 'r2' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });

    const fetchMock = vi.fn(async () => unauthorized());
    fetchMock.mockImplementationOnce(async () => unauthorized());
    fetchMock.mockImplementationOnce(async () => ok());
    vi.stubGlobal('fetch', fetchMock);

    const onUnauthorized = vi.fn(async () => true);
    const client = createApiClient({ baseUrl: 'http://localhost:4000/api/v1', onUnauthorized });

    const result = await client.get<{ ok: boolean }>('/me');
    expect(result.data.ok).toBe(true);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not loop when recovery keeps failing', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            error: {
              category: 'authn',
              code: 'UNAUTHENTICATED',
              message: 'Expired',
              requestId: 'r1',
              retryable: false,
            },
          }),
          { status: 401, headers: { 'content-type': 'application/json' } },
        ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const onUnauthorized = vi.fn(async () => true);
    const client = createApiClient({ baseUrl: 'http://localhost:4000/api/v1', onUnauthorized });

    await expect(client.get('/me')).rejects.toBeInstanceOf(ApiSdkError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
