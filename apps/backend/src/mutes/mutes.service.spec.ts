import type { MuteRepository, UserRepository } from '@gmrlog/database';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MutesService } from './mutes.service';

describe('MutesService', () => {
  let mutes: MuteRepository;
  let users: UserRepository;
  let service: MutesService;

  beforeEach(() => {
    mutes = {
      create: vi.fn(async () => ({
        id: 'mute-1',
        muterId: 'u1',
        mutedId: 'u2',
        createdAt: new Date('2026-07-30T00:00:00.000Z'),
        updatedAt: new Date('2026-07-30T00:00:00.000Z'),
      })),
      findByPair: vi.fn(async () => null),
      exists: vi.fn(async () => false),
      listMutedIds: vi.fn(async () => ['u2']),
      delete: vi.fn(),
      deleteByPair: vi.fn(async () => ({
        id: 'mute-1',
        muterId: 'u1',
        mutedId: 'u2',
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    } as unknown as MuteRepository;

    users = {
      findById: vi.fn(async (id: string) => ({
        id,
        handle: id,
        displayName: id,
        bio: null,
        avatarKey: null,
        bannerKey: null,
        avatarBlurhash: null,
        avatarVariants: null,
        bannerBlurhash: null,
        bannerVariants: null,
        privacyId: null,
        creatorFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })),
    } as unknown as UserRepository;

    service = new MutesService(mutes, users);
  });

  it('mutes a user', async () => {
    const result = await service.muteUser('u1', { userId: 'u2' });
    expect(result.muted.id).toBe('u2');
    expect(mutes.create).toHaveBeenCalled();
  });

  it('rejects self-mute', async () => {
    await expect(service.muteUser('u1', { userId: 'u1' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects duplicate mute', async () => {
    vi.mocked(mutes.exists).mockResolvedValueOnce(true);
    await expect(service.muteUser('u1', { userId: 'u2' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects mute of missing user', async () => {
    vi.mocked(users.findById).mockResolvedValueOnce(null);
    await expect(service.muteUser('u1', { userId: 'gone' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lists muted ids', async () => {
    await expect(service.listMutedIds('u1')).resolves.toEqual(['u2']);
  });

  it('unmutes a user', async () => {
    await service.unmuteUser('u1', 'u2');
    expect(mutes.deleteByPair).toHaveBeenCalledWith('u1', 'u2');
  });

  it('rejects unmute when relationship missing', async () => {
    vi.mocked(mutes.deleteByPair).mockResolvedValueOnce(null);
    await expect(service.unmuteUser('u1', 'u2')).rejects.toBeInstanceOf(NotFoundException);
  });
});
