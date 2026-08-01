import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CollectionDiscoverService } from './collection-discover.service';

const owner = {
  id: 'owner-1',
  handle: 'owner1',
  displayName: 'Owner One',
  avatarKey: null,
};

function fakeCollection(
  id: string,
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    id,
    title: `Collection ${id}`,
    description: null,
    owner,
    visibility: 'public',
    type: 'manual',
    ruleKey: null,
    bannerKey: null,
    coverKey: null,
    color: null,
    tags: [],
    entries: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    _count: { followers: 0 },
    ...overrides,
  };
}

describe('CollectionDiscoverService', () => {
  const prisma = {
    collection: { findMany: vi.fn() },
    collectionFollower: { groupBy: vi.fn() },
    game: { findMany: vi.fn() },
  };
  const follows = { listFollowing: vi.fn() };

  let service: CollectionDiscoverService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.game.findMany.mockResolvedValue([]);
    service = new CollectionDiscoverService(prisma as never, follows as never);
  });

  it('defaults to top sort ranked by follower count', async () => {
    prisma.collection.findMany.mockResolvedValue([
      fakeCollection('low', { _count: { followers: 1 } }),
      fakeCollection('high', { _count: { followers: 9 } }),
    ]);

    const result = await service.discover({});

    expect(result.items.map((row) => row.id)).toEqual(['high', 'low']);
  });

  it('sorts by createdAt for the newest slice', async () => {
    prisma.collection.findMany.mockResolvedValue([
      fakeCollection('old', { createdAt: new Date('2025-01-01T00:00:00.000Z') }),
      fakeCollection('new', { createdAt: new Date('2026-01-01T00:00:00.000Z') }),
    ]);

    const result = await service.discover({ sort: 'newest' });

    expect(result.items.map((row) => row.id)).toEqual(['new', 'old']);
  });

  it('ranks trending by windowed follower velocity', async () => {
    prisma.collectionFollower.groupBy.mockResolvedValue([
      { collectionId: 'a', _count: { collectionId: 2 } },
      { collectionId: 'b', _count: { collectionId: 5 } },
    ]);
    prisma.collection.findMany.mockResolvedValue([fakeCollection('a'), fakeCollection('b')]);

    const result = await service.discover({ sort: 'trending' });

    expect(result.items.map((row) => row.id)).toEqual(['b', 'a']);
  });

  it('falls back to top when there is no windowed trending activity', async () => {
    prisma.collectionFollower.groupBy.mockResolvedValue([]);
    prisma.collection.findMany.mockResolvedValue([fakeCollection('only')]);

    const result = await service.discover({ sort: 'trending' });

    expect(result.items.map((row) => row.id)).toEqual(['only']);
  });

  it('filters by tag', async () => {
    prisma.collection.findMany.mockResolvedValue([fakeCollection('tagged')]);

    await service.discover({ tag: 'soulslike' });

    expect(prisma.collection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tags: { has: 'soulslike' } }),
      }),
    );
  });

  it('requires authentication for the following sort', async () => {
    await expect(service.discover({ sort: 'following' }, null)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('returns collections owned by followed users for the following sort', async () => {
    follows.listFollowing.mockResolvedValue([{ followeeId: 'owner-1' }]);
    prisma.collection.findMany.mockResolvedValue([fakeCollection('followed')]);

    const result = await service.discover({ sort: 'following' }, 'viewer-1');

    expect(result.items.map((row) => row.id)).toEqual(['followed']);
  });

  it('returns an empty page for the following sort when the viewer follows nobody', async () => {
    follows.listFollowing.mockResolvedValue([]);

    const result = await service.discover({ sort: 'following' }, 'viewer-1');

    expect(result.items).toEqual([]);
    expect(prisma.collection.findMany).not.toHaveBeenCalled();
  });
});
