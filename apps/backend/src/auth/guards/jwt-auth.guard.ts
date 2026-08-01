import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';

import { AuthService } from '../auth.service';
import {
  isAuthenticatedIdentity,
  REQUEST_IDENTITY_KEY,
  type IdentityCarrier,
} from '../interfaces/identity';

/**
 * Guard shell for player-only surfaces (S1 §9.3 "P"). Attaches the resolved
 * identity and rejects guests with the canonical authn outcome. Authorization
 * (permissions) is a separate concern and never lives here (F6.7 Part B).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<IdentityCarrier>();
    const header = normalizeAuthorizationHeader(request.headers?.authorization);
    const identity = await this.auth.resolveIdentity(header);
    request[REQUEST_IDENTITY_KEY] = identity;

    if (!isAuthenticatedIdentity(identity)) {
      throw new UnauthorizedException('Authentication required');
    }
    return true;
  }
}

export function normalizeAuthorizationHeader(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
