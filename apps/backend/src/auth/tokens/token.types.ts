/**
 * Access / refresh token abstractions (D1.4 foundation).
 * Payload stays minimal on purpose — claims beyond identity kinship are a
 * domain concern and arrive with the auth flow implementation, not here.
 */

export type TokenKind = 'access' | 'refresh';

/** Claims common to both token kinds. Registered claims (iat/exp/iss) are managed by the signer. */
export interface BaseTokenPayload {
  /** Platform user id (canonical identity reference — F6.5 §7.1). */
  sub: string;
  /** Discriminator so one token kind can never be replayed as the other. */
  kind: TokenKind;
}

export interface AccessTokenPayload extends BaseTokenPayload {
  kind: 'access';
  /** Server-side session handle — present once sessions persist (D3.18). */
  sessionId?: string;
}

export interface RefreshTokenPayload extends BaseTokenPayload {
  kind: 'refresh';
  /** Server-side session handle — enables revocation once sessions persist (D2+). */
  sessionId?: string;
}

export function isAccessTokenPayload(payload: unknown): payload is AccessTokenPayload {
  return isTokenPayloadOfKind(payload, 'access');
}

export function isRefreshTokenPayload(payload: unknown): payload is RefreshTokenPayload {
  return isTokenPayloadOfKind(payload, 'refresh');
}

function isTokenPayloadOfKind(payload: unknown, kind: TokenKind): boolean {
  if (typeof payload !== 'object' || payload === null) return false;
  const candidate = payload as { sub?: unknown; kind?: unknown; sessionId?: unknown };
  if (typeof candidate.sub !== 'string' || candidate.sub.length === 0 || candidate.kind !== kind) {
    return false;
  }
  if (candidate.sessionId !== undefined) {
    if (typeof candidate.sessionId !== 'string' || candidate.sessionId.length === 0) {
      return false;
    }
  }
  return true;
}
