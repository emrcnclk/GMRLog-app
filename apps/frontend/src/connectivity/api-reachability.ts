import { getApiBaseUrl } from '../config/runtime-flags';

const PROBE_TIMEOUT_MS = 5_000;

/**
 * Reachability must be judged against our own API, not the public internet
 * (OFFLINE_MODE.md `GET /api/v1/health`). NetInfo's `isInternetReachable`
 * pings a public endpoint, so it reports false whenever the API lives on
 * localhost or a private network the public probe can't see — true of every
 * local dev environment — even though the API itself answers instantly.
 */
export async function probeApiReachability(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, PROBE_TIMEOUT_MS);

  try {
    const response = await fetch(`${getApiBaseUrl()}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
