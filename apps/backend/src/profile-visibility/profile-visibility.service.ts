import type { FollowRepository, UserSettingsRepository } from '@gmrlog/database';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { RequestIdentity } from '../auth/interfaces/identity';
import { isAuthenticatedIdentity } from '../auth/interfaces/identity';

import {
  PROFILE_VISIBILITY_FOLLOW_REPOSITORY,
  PROFILE_VISIBILITY_SETTINGS_REPOSITORY,
} from './profile-visibility.tokens';

/**
 * Bug 8 — `profileVisibility` was a stored preference that almost nothing read.
 * `GET /users/{id}/profile-theme` enforced it; `GET /users/{id}`, `/statistics`,
 * `/hero`, `/achievements` and `/archetypes` did not, so setting a profile to
 * private hid its colours and left the playtime, library size, archetypes and
 * achievement history it was meant to hide fully public.
 *
 * The rule itself is the one `canViewerReadProfileTheme` already encoded; this
 * lifts it out of the users domain so every public profile surface shares one
 * implementation instead of each re-deriving it.
 */
@Injectable()
export class ProfileVisibilityService {
  constructor(
    @Inject(PROFILE_VISIBILITY_SETTINGS_REPOSITORY)
    private readonly settings: UserSettingsRepository,
    @Inject(PROFILE_VISIBILITY_FOLLOW_REPOSITORY)
    private readonly follows: FollowRepository,
  ) {}

  async canView(targetUserId: string, identity: RequestIdentity): Promise<boolean> {
    const settings = await this.settings.findByUser(targetUserId);
    const visibility = settings?.profileVisibility ?? 'public';
    if (visibility === 'public') {
      return true;
    }

    const viewerId = isAuthenticatedIdentity(identity) ? identity.userId : null;
    if (viewerId === null) {
      return false;
    }
    // Owners always see their own profile, whatever they set it to.
    if (viewerId === targetUserId) {
      return true;
    }
    if (visibility !== 'followers') {
      return false;
    }
    return this.follows.exists(viewerId, targetUserId);
  }

  /**
   * Throws `NotFoundException` rather than `ForbiddenException`, matching the
   * fail-closed shape the rest of the product already uses for unreadable
   * resources (`getPublicProfileTheme`, collections, tier lists). A 403 would
   * confirm the account exists to anyone who asks, which is most of what a
   * private profile is trying not to do.
   */
  async assertCanView(targetUserId: string, identity: RequestIdentity): Promise<void> {
    if (!(await this.canView(targetUserId, identity))) {
      throw new NotFoundException('User not found');
    }
  }
}
