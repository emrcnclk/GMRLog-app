/**
 * Minimal API client for E2E test setup/teardown — talks straight to the
 * backend, no browser involved. Mirrors the shape `scripts/release/lib/common.mjs`
 * already established for smoke fixtures (unwrap `{ data, meta }`, idempotency
 * keys on mutating auth calls) rather than inventing a second convention.
 */

export const API_BASE_URL = process.env.E2E_API_BASE_URL ?? 'http://localhost:4000/api/v1';

interface Envelope<T> {
  data: T;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: string;
  body?: string;
  token?: string;
  headers?: Record<string, string>;
}

async function request<T>(path: string, init: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = init;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      // Only set content-type when there's a body — the backend's own
      // validation rejects a bodyless DELETE that still claims
      // application/json ("Body cannot be empty when content-type is set to
      // 'application/json'"), hit by this client's own review teardown call.
      ...(rest.body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(token !== undefined ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const text = await response.text();
  const body: unknown = text.length > 0 ? JSON.parse(text) : undefined;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `${init.method ?? 'GET'} ${path} -> ${String(response.status)}: ${JSON.stringify(body)}`,
    );
  }

  // A 204 (e.g. DELETE) has no body at all, not even an empty envelope.
  if (body === undefined) {
    return undefined as T;
  }
  return (body as Envelope<T>).data;
}

export interface SessionCredentials {
  accessToken: string;
  refreshToken: string;
}

export interface Me {
  id: string;
  handle: string;
  displayName: string;
}

/** POST /sessions/register — idempotency-keyed like the smoke fixtures. */
export async function registerUser(input: {
  email: string;
  password: string;
  displayName: string;
  handle: string;
}): Promise<SessionCredentials> {
  return request<SessionCredentials>('/sessions/register', {
    method: 'POST',
    headers: { 'idempotency-key': `e2e-reg-${input.handle}` },
    body: JSON.stringify(input),
  });
}

/** POST /sessions — plain login, not retried: a real failure here is a real test failure. */
export async function login(email: string, password: string): Promise<SessionCredentials> {
  return request<SessionCredentials>('/sessions', {
    method: 'POST',
    headers: { 'idempotency-key': `e2e-login-${email}-${String(Date.now())}` },
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Idempotent fixture account: log in if it already exists, register only if
 * it doesn't. Keeps the suite from creating a fresh account (which nothing in
 * this backend can ever delete — no `DELETE /users/:id` exists) on every run.
 *
 * Only falls back to register on 401 (wrong/no credentials yet — the "does
 * not exist" case this function exists to handle). Any other failure — most
 * importantly 429 from the auth rate limiter, hit repeatedly while developing
 * this suite — is rethrown rather than swallowed into a second, doomed
 * register attempt against an already-rate-limited route.
 */
export async function ensureFixtureAccount(input: {
  email: string;
  password: string;
  displayName: string;
  handle: string;
}): Promise<SessionCredentials> {
  try {
    return await login(input.email, input.password);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return registerUser(input);
    }
    throw error;
  }
}

export async function getMe(token: string): Promise<Me> {
  return request<Me>('/me', { token });
}

export async function deleteReview(reviewId: string, token: string): Promise<void> {
  await request(`/reviews/${reviewId}`, { method: 'DELETE', token });
}

export interface GameCard {
  id: string;
  title: string;
}

/**
 * One real, seeded game to exercise the log/review flow against. List
 * responses unwrap to a bare array in `data` (`buildPaginatedEnvelope`,
 * `apps/backend/src/infrastructure/http/envelope.ts`), not `{ items }`.
 */
export async function firstDiscoverableGame(token: string): Promise<GameCard> {
  const items = await request<GameCard[]>('/discover/games?limit=1', { token });
  const game = items[0];
  if (game === undefined) {
    throw new Error('No games returned by /discover/games — cannot run the log-a-game flow.');
  }
  return game;
}
