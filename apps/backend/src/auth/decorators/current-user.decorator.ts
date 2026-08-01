import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import {
  GUEST_IDENTITY,
  REQUEST_IDENTITY_KEY,
  type IdentityCarrier,
  type RequestIdentity,
} from '../interfaces/identity';

/**
 * Injects the identity attached by the auth guards. Falls back to guest when
 * no guard ran — absence of identity never becomes implicit privilege (F6.7).
 *
 * Usage: `handler(@CurrentUser() identity: RequestIdentity)`.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestIdentity => {
    const request = context.switchToHttp().getRequest<IdentityCarrier>();
    return request[REQUEST_IDENTITY_KEY] ?? GUEST_IDENTITY;
  },
);
