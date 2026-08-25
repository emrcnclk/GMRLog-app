import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DataExportService } from './data-export.service';

const USER = 'user-1';

const now = new Date('2026-08-22T00:00:00.000Z');

function emptyFindMany() {
  return vi.fn().mockResolvedValue([]);
}

describe('DataExportService', () => {
  const prisma = {
    user: { findUnique: vi.fn() },
    authCredential: { findMany: emptyFindMany() },
    userConsent: { findMany: emptyFindMany() },
    userSettings: { findUnique: vi.fn() },
    libraryEntry: { findMany: emptyFindMany() },
    review: { findMany: emptyFindMany() },
    post: { findMany: emptyFindMany() },
    comment: { findMany: emptyFindMany() },
    reaction: { findMany: emptyFindMany() },
    collection: { findMany: emptyFindMany() },
    tierList: { findMany: emptyFindMany() },
    quote: { findMany: emptyFindMany() },
    communityMember: { findMany: emptyFindMany() },
    eventParticipation: { findMany: emptyFindMany() },
    achievementProgress: { findMany: emptyFindMany() },
    follow: { findMany: emptyFindMany() },
    friendRequest: { findMany: emptyFindMany() },
    friendship: { findMany: emptyFindMany() },
    block: { findMany: emptyFindMany() },
    mute: { findMany: emptyFindMany() },
    message: { findMany: emptyFindMany() },
    session: { findMany: emptyFindMany() },
    auditLog: { findMany: emptyFindMany() },
    report: { findMany: emptyFindMany() },
    connectedAccount: { findMany: emptyFindMany() },
    userIntegration: { findMany: emptyFindMany() },
    gameLog: { findMany: emptyFindMany() },
  };

  let service: DataExportService;

  beforeEach(() => {
    vi.clearAllMocks();
    for (const model of Object.values(prisma)) {
      if ('findMany' in model) {
        (model.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      }
    }
    prisma.user.findUnique.mockResolvedValue({
      id: USER,
      handle: 'playerone',
      displayName: 'Player One',
      bio: null,
      firstName: null,
      lastName: null,
      birthDate: new Date('2000-01-01'),
      countryCode: 'DE',
      avatarKey: null,
      bannerKey: null,
      createdAt: now,
    });
    prisma.userSettings.findUnique.mockResolvedValue({ locale: 'en' });
    service = new DataExportService(prisma as never);
  });

  it('rejects an account that no longer exists', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.buildExport(USER)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('shapes the five categories PRIVACY_POLICY.md names, even with no data', async () => {
    const result = await service.buildExport(USER);

    expect(result.format).toBe('gmrlog.data-export.v1');
    expect(Object.keys(result.categories).sort()).toEqual(
      ['account', 'gamingActivity', 'optional', 'social', 'technical'].sort(),
    );
    expect(result.categories.account.handle).toBe('playerone');
    expect(result.categories.account.email).toBeNull();
    expect(result.categories.account.language).toBe('en');
    expect(result.categories.gamingActivity.libraryEntries).toEqual([]);
    expect(result.categories.social.following).toEqual([]);
    expect(result.categories.technical.sessions).toEqual([]);
    expect(result.categories.optional.connectedAccounts).toEqual([]);
  });

  it('reads the password credential as email without ever touching the hash', async () => {
    prisma.authCredential.findMany.mockResolvedValue([
      {
        type: 'password',
        provider: null,
        providerRef: 'player@example.com',
        secretHash: 'do-not-leak-me',
        createdAt: now,
      },
    ]);

    const result = await service.buildExport(USER);

    expect(result.categories.account.email).toBe('player@example.com');
    expect(JSON.stringify(result)).not.toContain('do-not-leak-me');
  });

  it('excludes soft-deleted content', async () => {
    await service.buildExport(USER);

    expect(prisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) }),
    );
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) }),
    );
    expect(prisma.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) }),
    );
    expect(prisma.quote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) }),
    );
  });

  it('includes both public and private quotes — visibility is not filtered, only soft-deletion is', async () => {
    prisma.quote.findMany.mockResolvedValue([
      {
        id: 'quote-1',
        targetType: 'post',
        targetId: 'post-1',
        body: 'A public quote',
        visibility: 'public',
        createdAt: now,
      },
      {
        id: 'quote-2',
        targetType: 'review',
        targetId: 'review-1',
        body: 'A private quote',
        visibility: 'private',
        createdAt: now,
      },
    ]);

    const result = await service.buildExport(USER);

    expect(result.categories.gamingActivity.quotes).toEqual([
      {
        id: 'quote-1',
        targetType: 'post',
        targetId: 'post-1',
        body: 'A public quote',
        visibility: 'public',
        createdAt: now.toISOString(),
      },
      {
        id: 'quote-2',
        targetType: 'review',
        targetId: 'review-1',
        body: 'A private quote',
        visibility: 'private',
        createdAt: now.toISOString(),
      },
    ]);
  });

  it('resolves friendships from both directions of the canonical low/high edge', async () => {
    prisma.friendship.findMany
      .mockResolvedValueOnce([{ userHighId: 'user-2', createdAt: now }])
      .mockResolvedValueOnce([{ userLowId: 'user-3', createdAt: now }]);

    const result = await service.buildExport(USER);

    expect(result.categories.social.friendships.map((f) => f.userId).sort()).toEqual([
      'user-2',
      'user-3',
    ]);
  });
});
