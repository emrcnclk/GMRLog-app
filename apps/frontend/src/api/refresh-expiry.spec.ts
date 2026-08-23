import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createAxiosApiClient, FrontendApiError, type AxiosApiClient } from './axios-client';

interface RefreshOutcome {
  recovered: boolean;
  reason: FrontendApiError | null;
}

type RefreshableClient = AxiosApiClient & {
  refreshSessionInterceptor: () => Promise<RefreshOutcome>;
};

function asRefreshable(client: AxiosApiClient): RefreshableClient {
  return client as RefreshableClient;
}

/**
 * A stand-in for `POST /sessions/refresh` refusing with a real envelope. There
 * is no HTTP mock in this workspace and the two tests below already talk to a
 * real socket, so a four-line server is the cheapest way to exercise the path
 * a refused refresh actually takes through the interceptors.
 */
function serveRefusal(status: number, body: unknown): Promise<{ server: Server; baseUrl: string }> {
  return new Promise((resolve) => {
    const server = createServer((_request, response) => {
      response.writeHead(status, { 'content-type': 'application/json' });
      response.end(JSON.stringify(body));
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      resolve({ server, baseUrl: `http://127.0.0.1:${String(port)}/api/v1` });
    });
  });
}

describe('D3.16 refresh token expiry handling', () => {
  let running: Server | null = null;

  afterEach(() => {
    running?.close();
    running = null;
  });

  it('does not recover when refresh token is missing', async () => {
    const onSessionCleared = vi.fn(async () => undefined);
    const onSessionRefreshed = vi.fn(async () => undefined);

    const client = createAxiosApiClient({
      baseUrl: 'http://localhost:4000/api/v1',
      getAccessToken: () => 'access',
      getRefreshToken: () => null,
      onSessionRefreshed,
      onSessionCleared,
    });

    // No request was made, so there is no server refusal to report — this is
    // the ordinary "signed out" case, not one the player needs told why.
    await expect(asRefreshable(client).refreshSessionInterceptor()).resolves.toEqual({
      recovered: false,
      reason: null,
    });
    expect(onSessionRefreshed).not.toHaveBeenCalled();
  });

  it('does not recover when refresh request fails, and reports why', async () => {
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

    const outcome = await asRefreshable(client).refreshSessionInterceptor();

    expect(outcome.recovered).toBe(false);
    // 12.6 — the catch used to swallow this entirely, which is what made
    // `mapAuthError`'s `ACCOUNT_DELETED` branch unreachable from its most
    // likely trigger: `enforceGracePeriod` runs on refresh too, so an account
    // whose 30 days lapsed fails *here*, in the background, and the player was
    // signed out as if by ordinary expiry with nothing to read. Nothing is
    // listening on port 1, so this particular failure is a network error
    // rather than a server refusal — what matters is that the reason survives
    // the catch at all.
    expect(outcome.reason).toBeInstanceOf(FrontendApiError);
    expect(onSessionRefreshed).not.toHaveBeenCalled();
  });

  it('reports a refused refresh with the server code, and does not hang on it', async () => {
    const { server, baseUrl } = await serveRefusal(401, {
      error: {
        category: 'authn',
        code: 'ACCOUNT_DELETED',
        message: 'This account has been permanently deleted.',
        requestId: 'r1',
        retryable: false,
      },
    });
    running = server;

    const client = createAxiosApiClient({
      baseUrl,
      getAccessToken: () => 'access',
      getRefreshToken: () => 'stale_refresh',
      onSessionRefreshed: vi.fn(async () => undefined),
      onSessionCleared: vi.fn(async () => undefined),
      maxRetries: 0,
    });

    // The refresh route's own 401 used to re-enter this method, which returned
    // the promise it was already running inside — so it never settled and the
    // player was never signed out. A 5s ceiling proves it settles at all;
    // `reason` proves the code survives to `mapAuthError`.
    const outcome = await Promise.race([
      asRefreshable(client).refreshSessionInterceptor(),
      new Promise<'timed-out'>((resolve) => setTimeout(() => resolve('timed-out'), 5000)),
    ]);

    expect(outcome).not.toBe('timed-out');
    const settled = outcome as RefreshOutcome;
    expect(settled.recovered).toBe(false);
    expect(settled.reason?.status).toBe(401);
    expect(settled.reason?.envelope?.error.code).toBe('ACCOUNT_DELETED');
  });
});
