import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CreatorProfileService } from './creator-profile.service';

const activeUser = {
  id: 'user-1',
  handle: 'creator1',
  displayName: 'Creator One',
  avatarKey: null,
  deletedAt: null,
  creatorFeatured: false,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

function fakePost(
  id: string,
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    id,
    authorId: 'user-1',
    body: 'body',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    visibility: 'public',
    gameId: null,
    communityId: null,
    postKind: 'guide',
    containsSpoilers: false,
    pinnedAt: null,
    ...overrides,
  };
}

describe('CreatorProfileService', () => {
  const users = { findById: vi.fn(), update: vi.fn() };
  const games = { findManyByIds: vi.fn() };
  const follows = { exists: vi.fn() };
  const prisma = {
    post: { findMany: vi.fn() },
    collection: { findMany: vi.fn() },
    follow: { count: vi.fn() },
  };
  const eligibility = { isEligible: vi.fn() };

  let service: CreatorProfileService;

  beforeEach(() => {
    vi.clearAllMocks();
    users.findById.mockResolvedValue(activeUser);
    users.update.mockResolvedValue(activeUser);
    games.findManyByIds.mockResolvedValue([]);
    prisma.post.findMany.mockResolvedValue([]);
    prisma.collection.findMany.mockResolvedValue([]);
    prisma.follow.count.mockResolvedValue(0);
    service = new CreatorProfileService(
      users as never,
      games as never,
      follows as never,
      prisma as never,
      eligibility as never,
    );
  });

  it('throws when the user is missing', async () => {
    users.findById.mockResolvedValue(null);
    await expect(service.getProfile('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns an empty ineligible payload when eligibility fails', async () => {
    eligibility.isEligible.mockResolvedValue(false);
    prisma.follow.count.mockResolvedValue(3);

    const result = await service.getProfile('user-1');

    expect(result).toEqual({
      eligible: false,
      creatorBadge: false,
      followerCount: 3,
      featuredPosts: [],
      guides: [],
      collections: [],
    });
    expect(users.update).not.toHaveBeenCalled();
  });

  it('projects featured posts, guides and collections when eligible', async () => {
    eligibility.isEligible.mockResolvedValue(true);
    prisma.post.findMany
      .mockResolvedValueOnce([
        fakePost('post-1', { pinnedAt: new Date('2026-01-02T00:00:00.000Z') }),
      ])
      .mockResolvedValueOnce([fakePost('guide-1')]);
    prisma.collection.findMany.mockResolvedValue([]);
    prisma.follow.count.mockResolvedValue(10);

    const result = await service.getProfile('user-1');

    expect(result.eligible).toBe(true);
    expect(result.creatorBadge).toBe(true);
    expect(result.followerCount).toBe(10);
    expect(result.featuredPosts.map((row) => row.id)).toEqual(['post-1']);
    expect(result.guides.map((row) => row.id)).toEqual(['guide-1']);
    expect(users.update).toHaveBeenCalledWith('user-1', { creatorFeatured: true });
  });

  it('does not re-persist creatorFeatured when it is already set', async () => {
    users.findById.mockResolvedValue({ ...activeUser, creatorFeatured: true });
    eligibility.isEligible.mockResolvedValue(true);

    await service.getProfile('user-1');

    expect(users.update).not.toHaveBeenCalled();
  });
});
