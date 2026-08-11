import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  createFakeFollowRepository,
  type FakeFollowRepository,
} from '../follows/testing/fake-repositories';
import {
  createFakeUploadRepository,
  makeUpload,
  type FakeUploadRepository,
} from '../uploads/testing/fake-repositories';

import {
  createFakeConnectedAccountRepository,
  createFakeUserRepository,
  createFakeUserSettingsRepository,
  makeConnectedAccount,
  makeUser,
  type FakeConnectedAccountRepository,
  type FakeUserRepository,
  type FakeUserSettingsRepository,
} from './testing/fake-repositories';
import { UsersService } from './users.service';

let userRepo: FakeUserRepository;
let settingsRepo: FakeUserSettingsRepository;
let accountsRepo: FakeConnectedAccountRepository;
let uploadRepo: FakeUploadRepository;
let followRepo: FakeFollowRepository;
let service: UsersService;

beforeEach(() => {
  userRepo = createFakeUserRepository([makeUser()]);
  settingsRepo = createFakeUserSettingsRepository();
  accountsRepo = createFakeConnectedAccountRepository([
    makeConnectedAccount({ id: 'account-steam', provider: 'steam', status: 'connected' }),
    makeConnectedAccount({
      id: 'account-discord',
      provider: 'discord',
      status: 'disconnected',
      linkedAt: null,
      scopes: [],
    }),
  ]);
  uploadRepo = createFakeUploadRepository();
  followRepo = createFakeFollowRepository();
  service = new UsersService(userRepo, settingsRepo, accountsRepo, uploadRepo, followRepo);
});

describe('UsersService.getMe', () => {
  it('maps the persisted user to the S1 §15.2 self response', async () => {
    const me = await service.getMe('user-1');
    expect(me).toEqual({
      id: 'user-1',
      handle: 'gamer',
      displayName: 'Gamer',
      bio: null,
      avatarUrl: null,
      bannerUrl: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      connectedProviders: ['steam'],
    });
  });

  it('fails closed as authn for an unknown subject', async () => {
    await expect(service.getMe('ghost')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('fails closed as authn for a soft-deleted subject', async () => {
    userRepo.rows.set('user-1', makeUser({ deletedAt: new Date() }));
    await expect(service.getMe('user-1')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('UsersService.updateMe', () => {
  it('updates displayName and bio through the repository', async () => {
    const me = await service.updateMe('user-1', { displayName: 'New Name', bio: 'Hello' });
    expect(me.displayName).toBe('New Name');
    expect(me.bio).toBe('Hello');
  });

  it('clears bio with null (S1 §14.5)', async () => {
    await service.updateMe('user-1', { bio: 'Hello' });
    const me = await service.updateMe('user-1', { bio: null });
    expect(me.bio).toBeNull();
  });

  it('is a no-op for an empty patch', async () => {
    const before = userRepo.rows.get('user-1');
    const me = await service.updateMe('user-1', {});
    expect(me.displayName).toBe('Gamer');
    expect(userRepo.rows.get('user-1')).toBe(before);
  });

  it('links a confirmed avatar upload to avatarKey and projects a public URL', async () => {
    uploadRepo.rows.set(
      'upload-avatar',
      makeUpload({
        id: 'upload-avatar',
        ownerId: 'user-1',
        purpose: 'avatar',
        storageKey: 'uploads/user-1/avatar/key-1',
        status: 'confirmed',
      }),
    );

    const me = await service.updateMe('user-1', { avatarUploadId: 'upload-avatar' });
    expect(userRepo.rows.get('user-1')?.avatarKey).toBe('uploads/user-1/avatar/key-1');
    expect(me.avatarUrl).toBe(
      `https://cdn.gmrlog.local/${encodeURIComponent('uploads/user-1/avatar/key-1')}`,
    );
  });

  it('rejects unconfirmed or mismatched-purpose upload references', async () => {
    uploadRepo.rows.set(
      'upload-granted',
      makeUpload({
        id: 'upload-granted',
        ownerId: 'user-1',
        purpose: 'avatar',
        status: 'granted',
      }),
    );
    await expect(
      service.updateMe('user-1', { avatarUploadId: 'upload-granted' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    uploadRepo.rows.set(
      'upload-banner',
      makeUpload({
        id: 'upload-banner',
        ownerId: 'user-1',
        purpose: 'banner',
        status: 'confirmed',
      }),
    );
    await expect(
      service.updateMe('user-1', { avatarUploadId: 'upload-banner' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('UsersService settings', () => {
  it('returns constitutional defaults when no settings row exists', async () => {
    expect(await service.getSettings('user-1')).toEqual({
      appearance: { theme: 'system', locale: null },
      accessibility: { reduceMotion: false },
    });
  });

  it('upserts appearance and preserves untouched sections', async () => {
    const afterAppearance = await service.updateAppearance('user-1', {
      theme: 'dark',
      locale: 'tr',
    });
    expect(afterAppearance.appearance).toEqual({ theme: 'dark', locale: 'tr' });
    expect(afterAppearance.accessibility.reduceMotion).toBe(false);

    const afterAccessibility = await service.updateAccessibility('user-1', { reduceMotion: true });
    expect(afterAccessibility.accessibility.reduceMotion).toBe(true);
    expect(afterAccessibility.appearance).toEqual({ theme: 'dark', locale: 'tr' });
  });

  it('clears theme back to the system default with null', async () => {
    await service.updateAppearance('user-1', { theme: 'dark' });
    const cleared = await service.updateAppearance('user-1', { theme: null });
    expect(cleared.appearance.theme).toBe('system');
  });
});

describe('UsersService.listConnectedAccounts', () => {
  it('returns honest link state for every provider row — no secrets', async () => {
    const accounts = await service.listConnectedAccounts('user-1');
    expect(accounts).toEqual([
      {
        provider: 'steam',
        status: 'connected',
        linkedAt: '2026-02-01T00:00:00.000Z',
        scopes: ['profile'],
      },
      { provider: 'discord', status: 'disconnected', linkedAt: null, scopes: [] },
    ]);
  });
});
