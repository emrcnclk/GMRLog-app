import { describe, expect, it, vi } from 'vitest';

import type { ApiClient, ApiRequestOptions } from './client.js';
import { createLegalClient } from './legal-client.js';

function createApiClientStub(): { api: ApiClient; calls: ApiRequestOptions[] } {
  const calls: ApiRequestOptions[] = [];
  const request = vi.fn(async (options: ApiRequestOptions) => {
    calls.push(options);
    return { data: null, meta: { requestId: 'req_test' } };
  });
  const api = {
    request,
    // Unlike the auth stub, this one forwards `query` — the locale is the
    // only thing these routes take, so dropping it would make every
    // assertion below vacuous.
    get: (path: string, query?: ApiRequestOptions['query']) =>
      request({ method: 'GET', path, query }),
  } as unknown as ApiClient;
  return { api, calls };
}

describe('createLegalClient', () => {
  it('targets the 12.2 public legal paths', async () => {
    const { api, calls } = createApiClientStub();
    const legal = createLegalClient(api);

    await legal.listDocuments();
    await legal.getDocument('privacy-policy');

    expect(calls).toEqual([
      expect.objectContaining({ method: 'GET', path: '/legal' }),
      expect.objectContaining({ method: 'GET', path: '/legal/privacy-policy' }),
    ]);
  });

  it('passes the locale through on both routes', async () => {
    const { api, calls } = createApiClientStub();
    const legal = createLegalClient(api);

    await legal.listDocuments('tr');
    await legal.getDocument('disclosure-notice', 'tr');

    expect(calls[0]?.query).toEqual({ locale: 'tr' });
    expect(calls[1]?.query).toEqual({ locale: 'tr' });
  });

  it('leaves the locale undefined when none is given, so the server falls back', () => {
    const { api, calls } = createApiClientStub();
    const legal = createLegalClient(api);

    void legal.listDocuments();

    // `buildUrl` skips undefined values, so this produces `/legal` with no
    // query string rather than `?locale=undefined`.
    expect(calls[0]?.query).toEqual({ locale: undefined });
  });

  it('never sends a token — these routes must work before an account exists', async () => {
    const { api, calls } = createApiClientStub();
    const legal = createLegalClient(api);

    await legal.getDocument('terms-of-service');

    expect(calls[0]?.headers).toBeUndefined();
  });
});
