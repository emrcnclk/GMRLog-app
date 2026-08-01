import { UnauthorizedException } from '@nestjs/common';

import { isAuthenticatedIdentity, type RequestIdentity } from './interfaces/identity';

/**
 * Narrows the guard-attached identity to a player id. `JwtAuthGuard` already
 * rejects guests; this keeps the type honest without trusting call order
 * (F6.7 — absence of identity never becomes implicit privilege).
 */
export function playerIdOf(identity: RequestIdentity): string {
  if (!isAuthenticatedIdentity(identity)) {
    throw new UnauthorizedException('Authentication required');
  }
  return identity.userId;
}
