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

/**
 * 12.4 — the documents a new account must accept, read from the running server.
 *
 * Not hardcoded: a pinned version would turn the next legal revision into a
 * spurious e2e failure, and would mask the behaviour that matters — the server
 * refusing a stale acceptance is correct, not broken.
 */
export async function currentLegalDocuments(): Promise<
  { documentId: string; version: string; locale: string }[]
> {
  const documents = await request<
    { id: string; version: string; locale: string; requiresAcceptance: boolean }[]
  >('/legal', { method: 'GET' });

  // 12.4a — everything displayed, not only what is accepted: a notice that was
  // not shown has not been given.
  return documents.map((document) => ({
    documentId: document.id,
    version: document.version,
    locale: document.locale,
  }));
}

/** POST /sessions/register — idempotency-keyed like the smoke fixtures. */
export async function registerUser(input: {
  email: string;
  password: string;
  displayName: string;
  handle: string;
}): Promise<SessionCredentials> {
  const shownLegalDocuments = await currentLegalDocuments();
  // 12.4c — registration now requires a birth date past the 13-year floor and a
  // real country code. Fixed values: a fixture wants a deterministic account,
  // and neither field is what any e2e test is asserting on.
  const profile = { birthDate: '1995-06-15', countryCode: 'TR', locale: 'en' };
  return request<SessionCredentials>('/sessions/register', {
    method: 'POST',
    // Unique per call, not per handle: a deterministic key replayed a
    // long-stale cached success (and its long-expired access token) from an
    // earlier local run once idempotency caching kicked in — found the hard
    // way, a 401 on the very next `/me` call using that "successful" token.
    headers: { 'idempotency-key': `e2e-reg-${input.handle}-${String(Date.now())}` },
    body: JSON.stringify({ ...input, ...profile, shownLegalDocuments, termsAccepted: true }),
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
 * Idempotent fixture account: register it if it doesn't exist yet, log in if
 * it does. Keeps the suite from creating a fresh account (which nothing in
 * this backend can ever delete — no `DELETE /users/:id` exists) on every run.
 *
 * Register-first, not login-first: CI's Postgres service container is
 * recreated empty on every single run, so on CI this account genuinely does
 * not exist yet on every run, every time — a login-first order would cost
 * two auth-rate-limited requests per account on every CI run (a guaranteed
 * 401 before the register that actually succeeds), for a limiter capped at 5
 * requests/60s (`RateLimitClass('auth')`). Register-first costs one request
 * on CI (every run) and pays the two-request cost only on the rarer path — a
 * human rerunning locally against a Postgres that already has the account.
 * Found the hard way: global-setup's four calls (2 accounts × login-then-
 * register) alone burned 4 of the 5-request budget on this job's first
 * green-except-one run, leaving signup.spec's own register to trip 429.
 *
 * Falls back to login only on 409 (Conflict — "Email/Handle is already
 * registered", exactly the "already exists" case this exists to handle). Any
 * other failure is rethrown rather than swallowed into a second, likely-
 * doomed request.
 */
export async function ensureFixtureAccount(input: {
  email: string;
  password: string;
  displayName: string;
  handle: string;
}): Promise<SessionCredentials> {
  try {
    return await registerUser(input);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      return login(input.email, input.password);
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
