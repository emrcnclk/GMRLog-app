import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { REPUTATION_THRESHOLDS, ReputationEngineService } from './reputation-engine.service';

const activeUser = {
  id: 'user-1',
  deletedAt: null,
};

describe('ReputationEngineService', () => {
  const reputations = {
    create: vi.fn(),
    findByUserAndBadge: vi.fn(),
    listByUser: vi.fn(),
    delete: vi.fn(),
  };
  const users = {
    findById: vi.fn(),
  };
  const notifications = {
    create: vi.fn(),
  };
  const prisma = {
    review: { findMany: vi.fn() },
    post: { findMany: vi.fn() },
    communityWikiPage: { count: vi.fn() },
    achievementProgress: { count: vi.fn() },
    communityMember: { findMany: vi.fn() },
    reaction: { count: vi.fn() },
  };

  let service: ReputationEngineService;

  beforeEach(() => {
    vi.clearAllMocks();
    users.findById.mockResolvedValue(activeUser);
    reputations.listByUser.mockResolvedValue([]);
    prisma.review.findMany.mockResolvedValue([]);
    prisma.post.findMany.mockResolvedValue([]);
    prisma.communityWikiPage.count.mockResolvedValue(0);
    prisma.achievementProgress.count.mockResolvedValue(0);
    prisma.communityMember.findMany.mockResolvedValue([]);
    prisma.reaction.count.mockResolvedValue(0);
    notifications.create.mockResolvedValue({});
    service = new ReputationEngineService(
      reputations as never,
      users as never,
      prisma as never,
      notifications as never,
    );
  });

  it('throws when the user is missing', async () => {
    users.findById.mockResolvedValue(null);
    await expect(service.listForUser('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('awards nothing when no signal clears its threshold', async () => {
    const result = await service.recalculate('user-1');
    expect(result).toEqual([]);
    expect(reputations.create).not.toHaveBeenCalled();
  });

  it('awards helpful_reviewer at ≥5 public reviews when helpful signals are absent', async () => {
    prisma.review.findMany.mockResolvedValue(
      Array.from({ length: REPUTATION_THRESHOLDS.helpfulReviewer.minPublicReviews }, (_, i) => ({
        id: `review-${String(i)}`,
      })),
    );
    prisma.reaction.count.mockResolvedValue(0);
    reputations.create.mockResolvedValue(undefined);
    reputations.listByUser.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: 'rep-1',
        userId: 'user-1',
        badge: 'helpful_reviewer',
        awardedAt: new Date('2026-01-01T00:00:00.000Z'),
        evidence: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await service.recalculate('user-1');

    expect(reputations.create).toHaveBeenCalledWith(
      expect.objectContaining({ badge: 'helpful_reviewer' }),
    );
    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'reputation_awarded' }),
    );
    expect(result).toEqual([{ badge: 'helpful_reviewer', awardedAt: '2026-01-01T00:00:00.000Z' }]);
  });

  it('awards strategy_expert at ≥3 guide posts', async () => {
    prisma.post.findMany.mockResolvedValue(
      Array.from({ length: REPUTATION_THRESHOLDS.strategyExpert.minGuides }, (_, i) => ({
        id: `guide-${String(i)}`,
        body: 'short',
      })),
    );
    reputations.create.mockResolvedValue(undefined);
    reputations.listByUser.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: 'rep-1',
        userId: 'user-1',
        badge: 'strategy_expert',
        awardedAt: new Date('2026-01-01T00:00:00.000Z'),
        evidence: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await service.recalculate('user-1');
    expect(result.map((row) => row.badge)).toContain('strategy_expert');
  });

  it('awards lore_master from wiki edits ≥2', async () => {
    prisma.communityWikiPage.count.mockResolvedValue(REPUTATION_THRESHOLDS.loreMaster.minWikiPages);
    reputations.create.mockResolvedValue(undefined);
    reputations.listByUser.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: 'rep-1',
        userId: 'user-1',
        badge: 'lore_master',
        awardedAt: new Date('2026-01-01T00:00:00.000Z'),
        evidence: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await service.recalculate('user-1');
    expect(result.map((row) => row.badge)).toContain('lore_master');
  });

  it('awards achievement_hunter at ≥10 awarded achievements', async () => {
    prisma.achievementProgress.count
      .mockResolvedValueOnce(REPUTATION_THRESHOLDS.achievementHunter.minAwarded)
      .mockResolvedValueOnce(0);
    reputations.create.mockResolvedValue(undefined);
    reputations.listByUser.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: 'rep-1',
        userId: 'user-1',
        badge: 'achievement_hunter',
        awardedAt: new Date('2026-01-01T00:00:00.000Z'),
        evidence: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await service.recalculate('user-1');
    expect(result.map((row) => row.badge)).toContain('achievement_hunter');
  });

  it('awards community_leader for tenured leadership role', async () => {
    const joinedAt = new Date(
      Date.now() - (REPUTATION_THRESHOLDS.communityLeader.minTenureDays + 1) * 86_400_000,
    );
    prisma.communityMember.findMany.mockResolvedValue([{ joinedAt }]);
    reputations.create.mockResolvedValue(undefined);
    reputations.listByUser.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: 'rep-1',
        userId: 'user-1',
        badge: 'community_leader',
        awardedAt: new Date('2026-01-01T00:00:00.000Z'),
        evidence: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await service.recalculate('user-1');
    expect(result.map((row) => row.badge)).toContain('community_leader');
  });

  it('revokes a stored badge once signals no longer clear the threshold', async () => {
    reputations.listByUser
      .mockResolvedValueOnce([
        {
          id: 'rep-1',
          userId: 'user-1',
          badge: 'achievement_hunter',
          awardedAt: new Date(),
          evidence: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ])
      .mockResolvedValueOnce([]);

    const result = await service.recalculate('user-1');
    expect(reputations.delete).toHaveBeenCalledWith('rep-1');
    expect(result).toEqual([]);
  });
});
