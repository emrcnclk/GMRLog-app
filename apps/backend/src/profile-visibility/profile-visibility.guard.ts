import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';

import { REQUEST_IDENTITY_KEY, type IdentityCarrier } from '../auth/interfaces/identity';

import { ProfileVisibilityService } from './profile-visibility.service';

interface ProfileRequest extends IdentityCarrier {
  params?: Record<string, string | undefined>;
}

/**
 * Applies the profile-visibility rule to any route whose `:id` param names the
 * profile being read. Must run after an identity guard — pair it as
 * `@UseGuards(OptionalGuestGuard, ProfileVisibilityGuard)`, or put it on the
 * method where the class already carries `OptionalGuestGuard`; Nest runs class
 * guards before method guards.
 *
 * A route with no `:id` is left alone, so mounting this on a controller that
 * also serves `me/...` routes is safe.
 */
@Injectable()
export class ProfileVisibilityGuard implements CanActivate {
  constructor(private readonly visibility: ProfileVisibilityService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ProfileRequest>();
    const targetUserId = request.params?.id;
    if (targetUserId === undefined || targetUserId.length === 0) {
      return true;
    }

    const identity = request[REQUEST_IDENTITY_KEY];
    if (identity === undefined) {
      // No identity attached means no identity guard ran ahead of this one,
      // which is a wiring mistake. Fail closed rather than guess the viewer.
      throw new Error('ProfileVisibilityGuard requires an identity guard to run first');
    }

    await this.visibility.assertCanView(targetUserId, identity);
    return true;
  }
}
