import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CREATOR_ELIGIBILITY_THRESHOLDS,
  CreatorEligibilityService,
} from './creator-eligibility.service';

describe('CreatorEligibilityService', () => {
  const prisma = {
    user: { findUnique: vi.fn() },
    post: { count: vi.fn() },
    collection: { findMany: vi.fn() },
  };
  const reputation = {
    listForUser: vi.fn(),
  };

  let service: CreatorEligibilityService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({ creatorFeatured: false });
    prisma.post.count.mockResolvedValue(0);
    prisma.collection.findMany.mockResolvedValue([]);
    reputation.listForUser.mockResolvedValue([]);
    service = new CreatorEligibilityService(prisma as never, reputation as never);
  });

  it('is not eligible when no signal clears its threshold', async () => {
    expect(await service.isEligible('user-1')).toBe(false);
  });

  it('is eligible when creatorFeatured is manually set', async () => {
    prisma.user.findUnique.mockResolvedValue({ creatorFeatured: true });
    expect(await service.isEligible('user-1')).toBe(true);
  });

  it('is eligible at the published guide threshold', async () => {
    prisma.post.count.mockResolvedValue(CREATOR_ELIGIBILITY_THRESHOLDS.minPublishedGuides);
    expect(await service.isEligible('user-1')).toBe(true);
  });

  it('is not eligible one guide below the threshold', async () => {
    prisma.post.count.mockResolvedValue(CREATOR_ELIGIBILITY_THRESHOLDS.minPublishedGuides - 1);
    expect(await service.isEligible('user-1')).toBe(false);
  });

  it('is eligible when a public collection clears the follower threshold', async () => {
    prisma.collection.findMany.mockResolvedValue([
      { _count: { followers: CREATOR_ELIGIBILITY_THRESHOLDS.minCollectionFollowers } },
    ]);
    expect(await service.isEligible('user-1')).toBe(true);
  });

  it('is eligible via a qualifying reputation badge', async () => {
    reputation.listForUser.mockResolvedValue([
      { badge: 'helpful_reviewer', awardedAt: new Date().toISOString() },
    ]);
    expect(await service.isEligible('user-1')).toBe(true);
  });

  it('is not eligible via a non-qualifying reputation badge', async () => {
    reputation.listForUser.mockResolvedValue([
      { badge: 'achievement_hunter', awardedAt: new Date().toISOString() },
    ]);
    expect(await service.isEligible('user-1')).toBe(false);
  });
});
