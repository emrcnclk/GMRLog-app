import { NotFoundException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import { REQUEST_IDENTITY_KEY, type RequestIdentity } from '../auth/interfaces/identity';

import { ProfileVisibilityGuard } from './profile-visibility.guard';
import { ProfileVisibilityService } from './profile-visibility.service';

type Visibility = 'public' | 'followers' | 'private';

function createRepos() {
  const settings = new Map<string, Visibility>();
  const follows = new Set<string>();
  return {
    settings,
    follows,
    settingsRepo: {
      findByUser: (userId: string) => {
        const profileVisibility = settings.get(userId);
        return Promise.resolve(
          profileVisibility === undefined ? null : { userId, profileVisibility },
        );
      },
    },
    followRepo: {
      exists: (followerId: string, followeeId: string) =>
        Promise.resolve(follows.has(`${followerId}->${followeeId}`)),
    },
  };
}

const GUEST: RequestIdentity = { class: 'guest' };
const viewer = (userId: string): RequestIdentity => ({ class: 'player', userId });

describe('ProfileVisibilityService', () => {
  let repos: ReturnType<typeof createRepos>;
  let service: ProfileVisibilityService;

  beforeEach(() => {
    repos = createRepos();
    service = new ProfileVisibilityService(repos.settingsRepo as never, repos.followRepo as never);
  });

  describe('public (and the unset default)', () => {
    it('is readable by a guest when explicitly public', async () => {
      repos.settings.set('owner', 'public');
      expect(await service.canView('owner', GUEST)).toBe(true);
    });

    it('treats a user with no settings row as public', async () => {
      expect(await service.canView('owner', GUEST)).toBe(true);
    });
  });

  describe('private', () => {
    beforeEach(() => {
      repos.settings.set('owner', 'private');
    });

    it('hides from a guest', async () => {
      expect(await service.canView('owner', GUEST)).toBe(false);
    });

    it('hides from another signed-in player', async () => {
      expect(await service.canView('owner', viewer('someone-else'))).toBe(false);
    });

    it('hides even from a follower — private means private', async () => {
      repos.follows.add('follower->owner');
      expect(await service.canView('owner', viewer('follower'))).toBe(false);
    });

    it('still shows the owner their own profile', async () => {
      expect(await service.canView('owner', viewer('owner'))).toBe(true);
    });
  });

  describe('followers', () => {
    beforeEach(() => {
      repos.settings.set('owner', 'followers');
    });

    it('hides from a guest, who cannot follow anyone', async () => {
      expect(await service.canView('owner', GUEST)).toBe(false);
    });

    it('hides from a signed-in player who does not follow the owner', async () => {
      expect(await service.canView('owner', viewer('stranger'))).toBe(false);
    });

    it('shows a follower', async () => {
      repos.follows.add('follower->owner');
      expect(await service.canView('owner', viewer('follower'))).toBe(true);
    });

    it('does not accept the follow edge in the wrong direction', async () => {
      // The owner following the viewer grants the viewer nothing.
      repos.follows.add('owner->stranger');
      expect(await service.canView('owner', viewer('stranger'))).toBe(false);
    });

    it('shows the owner regardless of following themselves', async () => {
      expect(await service.canView('owner', viewer('owner'))).toBe(true);
    });
  });

  it('assertCanView raises NotFound, not Forbidden, so existence stays hidden', async () => {
    repos.settings.set('owner', 'private');
    await expect(service.assertCanView('owner', GUEST)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.assertCanView('owner', viewer('owner'))).resolves.toBeUndefined();
  });
});

describe('ProfileVisibilityGuard', () => {
  let repos: ReturnType<typeof createRepos>;
  let guard: ProfileVisibilityGuard;

  function contextFor(
    params: Record<string, string>,
    identity?: RequestIdentity,
  ): ExecutionContext {
    const request: Record<string, unknown> = { params };
    if (identity !== undefined) {
      request[REQUEST_IDENTITY_KEY] = identity;
    }
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    repos = createRepos();
    guard = new ProfileVisibilityGuard(
      new ProfileVisibilityService(repos.settingsRepo as never, repos.followRepo as never),
    );
  });

  it('lets a readable profile through', async () => {
    repos.settings.set('owner', 'public');
    expect(await guard.canActivate(contextFor({ id: 'owner' }, GUEST))).toBe(true);
  });

  it('blocks an unreadable profile with NotFound', async () => {
    repos.settings.set('owner', 'private');
    await expect(guard.canActivate(contextFor({ id: 'owner' }, GUEST))).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('ignores a route with no :id, so mounting it beside me/... routes is safe', async () => {
    repos.settings.set('owner', 'private');
    expect(await guard.canActivate(contextFor({}, GUEST))).toBe(true);
  });

  it('fails loudly when no identity guard ran ahead of it', async () => {
    repos.settings.set('owner', 'private');
    await expect(guard.canActivate(contextFor({ id: 'owner' }))).rejects.toThrow(
      /requires an identity guard/,
    );
  });
});
