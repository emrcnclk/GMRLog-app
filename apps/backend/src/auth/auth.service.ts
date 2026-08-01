import { Injectable } from '@nestjs/common';

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
  constructor(private readonly tokens: TokenService) {}

  /**
   * Resolves the `Authorization` header into a request identity.
   * Invalid, expired or missing credentials fail closed into guest.
   */
  async resolveIdentity(authorizationHeader: string | undefined): Promise<RequestIdentity> {
    const token = extractBearerToken(authorizationHeader);
    if (token === null) return GUEST_IDENTITY;

    const payload = await this.tokens.verifyAccessToken(token);
    if (payload === null) return GUEST_IDENTITY;

    const identity: AuthenticatedIdentity = {
      class: 'player',
      userId: payload.sub,
      ...(payload.sessionId ? { sessionId: payload.sessionId } : {}),
    };
    return identity;
  }
}

/** Extracts the bearer token from an `Authorization` header, or `null`. */
export function extractBearerToken(header: string | undefined): string | null {
  if (typeof header !== 'string') return null;
  const [scheme, token, ...rest] = header.trim().split(/\s+/);
  if (rest.length > 0 || !scheme || !token) return null;
  return scheme.toLowerCase() === 'bearer' ? token : null;
}
