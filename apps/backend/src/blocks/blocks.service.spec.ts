import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  createFakeUserRepository,
  makeUser,
  type FakeUserRepository,
} from '../users/testing/fake-repositories';

import { BlocksService } from './blocks.service';
import {
  createFakeBlockRepository,
  makeBlock,
  type FakeBlockRepository,
} from './testing/fake-repositories';

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

describe('BlocksService.listBlocked (3b.3a)', () => {
  it('returns an empty paginated list when nothing is blocked', async () => {
    const page = await service.listBlocked('user-1');
    expect(page.items).toEqual([]);
    expect(page.hasMore).toBe(false);
    expect(page.cursor.next).toBeNull();
  });

  it('paginates most-recently-blocked first and rejects invalid cursors', async () => {
    users = createFakeUserRepository([
      makeUser({ id: 'user-1', handle: 'gamer', displayName: 'Gamer' }),
      makeUser({ id: 'user-2', handle: 'older-block', displayName: 'Older Block' }),
      makeUser({ id: 'user-3', handle: 'newer-block', displayName: 'Newer Block' }),
    ]);
    blocks = createFakeBlockRepository([
      makeBlock({
        id: 'block-old',
        blockerId: 'user-1',
        blockedId: 'user-2',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
      makeBlock({
        id: 'block-new',
        blockerId: 'user-1',
        blockedId: 'user-3',
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
      }),
    ]);
    service = new BlocksService(blocks, users);

    const page1 = await service.listBlocked('user-1', { limit: 1 });
    expect(page1.items[0]?.blocked.id).toBe('user-3');
    expect(page1.hasMore).toBe(true);
    expect(page1.cursor.next).toEqual(expect.any(String));

    const page2 = await service.listBlocked('user-1', {
      limit: 1,
      cursor: page1.cursor.next!,
    });
    expect(page2.items[0]?.blocked.id).toBe('user-2');
    expect(page2.hasMore).toBe(false);

    await expect(service.listBlocked('user-1', { cursor: 'bad' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('drops a row whose blocked user has since been deleted, rather than rendering it', async () => {
    users = createFakeUserRepository([
      makeUser({ id: 'user-1', handle: 'gamer', displayName: 'Gamer' }),
      makeUser({
        id: 'user-2',
        handle: 'gone',
        displayName: 'Gone',
        deletedAt: new Date('2026-01-02T00:00:00.000Z'),
      }),
    ]);
    blocks = createFakeBlockRepository([
      makeBlock({ id: 'block-1', blockerId: 'user-1', blockedId: 'user-2' }),
    ]);
    service = new BlocksService(blocks, users);

    const page = await service.listBlocked('user-1');
    expect(page.items).toEqual([]);
    expect(page.hasMore).toBe(false);
  });
});
