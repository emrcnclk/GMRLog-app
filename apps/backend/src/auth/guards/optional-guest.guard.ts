import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';

import { AuthService } from '../auth.service';
import { REQUEST_IDENTITY_KEY, type IdentityCarrier } from '../interfaces/identity';

import { normalizeAuthorizationHeader } from './jwt-auth.guard';

/**
 * Guard shell for guest-readable surfaces (S1 §9.3 "P|G" / soft-gate reads).
 * Always allows the request; attaches the authenticated identity when a valid
 * credential is present, otherwise attaches guest. Never rejects — soft-gate
 * denial is a domain policy decision, not an edge concern.
 */
@Injectable()
export class OptionalGuestGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<IdentityCarrier>();
    const header = normalizeAuthorizationHeader(request.headers?.authorization);
    request[REQUEST_IDENTITY_KEY] = await this.auth.resolveIdentity(header);
    return true;
  }
}
