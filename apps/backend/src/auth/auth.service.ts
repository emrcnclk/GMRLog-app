import type { SessionRepository } from '@gmrlog/database';
import { Inject, Injectable } from '@nestjs/common';

import { SESSION_REPOSITORY } from './auth.tokens';
import {
  GUEST_IDENTITY,
  type AuthenticatedIdentity,
  type RequestIdentity,
} from './interfaces/identity';
import { TokenService } from './jwt/token.service';

/**
 * Identity attachment abstraction (F6.3 §13 / F6.7 §6). Resolves a request
 * credential into an identity class at the platform edge. No login flow, no
 * user lookup, no business logic — those arrive with the user domain (D2+).
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly tokens: TokenService,
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
  ) {}

  /**
   * Resolves the `Authorization` header into a request identity.
   * Invalid, expired or missing credentials fail closed into guest.
   *
   * Bug 5 — a valid signature is not enough. Logging out revokes the session
   * row, but nothing used to read it on the way in, so an access token stayed
   * usable for the remainder of its 15-minute TTL after the user had signed
   * out; "log out everywhere" on a stolen or shared device did not actually end
   * the attacker's access. Every authenticated request now costs one indexed
   * lookup by primary key, which is the price of logout meaning something.
   */
  async resolveIdentity(authorizationHeader: string | undefined): Promise<RequestIdentity> {
    const token = extractBearerToken(authorizationHeader);
    if (token === null) return GUEST_IDENTITY;

    const payload = await this.tokens.verifyAccessToken(token);
    if (payload === null) return GUEST_IDENTITY;

    // Fail closed on a token with no session claim. Every token this codebase
    // issues carries one (`SessionsService.issueCredentialPair`), so a token
    // without one cannot be revoked and has no business authenticating.
    if (payload.sessionId == null || payload.sessionId.length === 0) {
      return GUEST_IDENTITY;
    }

    const session = await this.sessions.findById(payload.sessionId);
    if (!isUsableSession(session, payload.sub)) {
      return GUEST_IDENTITY;
    }

    const identity: AuthenticatedIdentity = {
      class: 'player',
      userId: payload.sub,
      sessionId: payload.sessionId,
    };
    return identity;
  }
}

/**
 * A session backs a credential only while it is unrevoked, unexpired, and still
 * belongs to the subject the token claims. The ownership check matters because
 * the session id travels in the token: without it, a token could name someone
 * else's live session and outlive the revocation of its own.
 */
function isUsableSession(
  session: { userId: string; revokedAt: Date | null; expiresAt: Date } | null,
  subjectUserId: string,
): boolean {
  if (session === null) return false;
  if (session.userId !== subjectUserId) return false;
  if (session.revokedAt !== null) return false;
  return session.expiresAt.getTime() > Date.now();
}

/** Extracts the bearer token from an `Authorization` header, or `null`. */
export function extractBearerToken(header: string | undefined): string | null {
  if (typeof header !== 'string') return null;
  const [scheme, token, ...rest] = header.trim().split(/\s+/);
  if (rest.length > 0 || !scheme || !token) return null;
  return scheme.toLowerCase() === 'bearer' ? token : null;
}
