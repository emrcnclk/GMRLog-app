import type { ApiEnvelope, SessionCredentialResponse, UserSelfResponse } from '@gmrlog/types';

import { ApiClient } from './client.js';

/**
 * Authentication client — S1 §13.1 / §13.3 transport only.
 * Session endpoints may be unavailable until auth flow is mounted server-side;
 * DTOs come from `@gmrlog/types` (never duplicated).
 */

/** S1 §14.1 SessionCreateRequest shape (email · password). */
export interface LoginInput {
  email: string;
  password: string;
}

/** Alias for SessionCredentialResponse — kept for existing imports. */
export type SessionTokens = SessionCredentialResponse;

export class AuthClient {
  constructor(private readonly api: ApiClient) {}

  /** `POST /sessions` — login (S1 §13.1). */
  login(
    input: LoginInput,
    idempotencyKey?: string,
  ): Promise<ApiEnvelope<SessionCredentialResponse>> {
    return this.api.post<SessionCredentialResponse>('/sessions', input, idempotencyKey);
  }

  /** `DELETE /sessions/current` — logout (S1 §13.1). */
  logout(): Promise<ApiEnvelope<null>> {
    return this.api.delete<null>('/sessions/current');
  }

  /** `POST /sessions/refresh` — refresh (S1 §13.1). */
  refresh(refreshToken: string): Promise<ApiEnvelope<SessionCredentialResponse>> {
    return this.api.post<SessionCredentialResponse>('/sessions/refresh', { refreshToken });
  }

  /** `GET /me` — self snapshot (S1 §13.3 · UserSelfResponse). */
  me(): Promise<ApiEnvelope<UserSelfResponse>> {
    return this.api.get<UserSelfResponse>('/me');
  }
}

export function createAuthClient(api: ApiClient): AuthClient {
  return new AuthClient(api);
}
