import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  createFakeUserRepository,
  makeUser,
  type FakeUserRepository,
} from '../users/testing/fake-repositories';

import { BlocksService } from './blocks.service';
import { createFakeBlockRepository, type FakeBlockRepository } from './testing/fake-repositories';

let blocks: FakeBlockRepository;
let users: FakeUserRepository;
let service: BlocksService;

beforeEach(() => {
  users = createFakeUserRepository([
    makeUser({ id: 'user-1', handle: 'gamer', displayName: 'Gamer' }),
    makeUser({ id: 'user-2', handle: 'other', displayName: 'Other' }),
  ]);
  blocks = createFakeBlockRepository();
  service = new BlocksService(blocks, users);
});

describe('BlocksService.blockUser', () => {
  it('creates a directed block edge', async () => {
    const created = await service.blockUser('user-1', { userId: 'user-2' });
    expect(created).toMatchObject({
      blocker: { id: 'user-1', handle: 'gamer' },
      blocked: { id: 'user-2', handle: 'other' },
      createdAt: expect.any(String),
    });
    expect(blocks.rows.size).toBe(1);
  });

  it('rejects self-block', async () => {
    await expect(service.blockUser('user-1', { userId: 'user-1' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects duplicate block with 409', async () => {
    await service.blockUser('user-1', { userId: 'user-2' });
    await expect(service.blockUser('user-1', { userId: 'user-2' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects unknown target with 404', async () => {
    await expect(service.blockUser('user-1', { userId: 'missing' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('BlocksService.unblockUser', () => {
  it('hard-deletes the relationship', async () => {
    await service.blockUser('user-1', { userId: 'user-2' });
    await service.unblockUser('user-1', 'user-2');
    expect(blocks.rows.size).toBe(0);
  });

  it('returns 404 when the relationship is missing', async () => {
    await expect(service.unblockUser('user-1', 'user-2')).rejects.toBeInstanceOf(NotFoundException);
  });
});
