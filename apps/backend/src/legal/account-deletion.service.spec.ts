import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountDeletionService } from './account-deletion.service';

const USER = 'user-1';
const now = new Date('2026-08-23T00:00:00.000Z');
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function makeRequest(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'req-1',
    userId: USER,
    requestedAt: now,
    deletesAt: new Date(now.getTime() + THIRTY_DAYS_MS),
    cancelledAt: null,
    erasedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('AccountDeletionService', () => {
  const prisma = {
    accountDeletionRequest: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    communityMember: { findMany: vi.fn() },
    community: { updateMany: vi.fn() },
    post: { updateMany: vi.fn() },
    review: { updateMany: vi.fn() },
    collection: { updateMany: vi.fn() },
    tierList: { updateMany: vi.fn() },
    quote: { updateMany: vi.fn() },
    authCredential: { deleteMany: vi.fn() },
    connectedAccount: { deleteMany: vi.fn() },
    session: { deleteMany: vi.fn() },
    user: { update: vi.fn() },
    $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };

  let service: AccountDeletionService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    prisma.communityMember.findMany.mockResolvedValue([]);
    prisma.$transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));

    service = new AccountDeletionService(prisma as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('requestDeletion', () => {
    it('starts a 30-day grace period when nothing is pending', async () => {
      prisma.accountDeletionRequest.findUnique.mockResolvedValue(null);
      prisma.accountDeletionRequest.upsert.mockResolvedValue(makeRequest());

      const result = await service.requestDeletion(USER);

      expect(result.pending).toBe(true);
      expect(result.requestedAt).toBe(now.toISOString());
      expect(result.deletesAt).toBe(new Date(now.getTime() + THIRTY_DAYS_MS).toISOString());
      expect(prisma.accountDeletionRequest.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: USER } }),
      );
    });

    it('refuses a second request while one is already pending', async () => {
      prisma.accountDeletionRequest.findUnique.mockResolvedValue(makeRequest());

      await expect(service.requestDeletion(USER)).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.accountDeletionRequest.upsert).not.toHaveBeenCalled();
    });

    it('allows a fresh request after a previous one was cancelled', async () => {
      prisma.accountDeletionRequest.findUnique.mockResolvedValue(makeRequest({ cancelledAt: now }));
      prisma.accountDeletionRequest.upsert.mockResolvedValue(makeRequest());

      const result = await service.requestDeletion(USER);

      expect(result.pending).toBe(true);
      expect(prisma.accountDeletionRequest.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ cancelledAt: null, erasedAt: null }),
        }),
      );
    });
  });

  describe('cancelDeletion', () => {
    it('cancels a pending request', async () => {
      prisma.accountDeletionRequest.findUnique.mockResolvedValue(makeRequest());

      const result = await service.cancelDeletion(USER);

      expect(result).toEqual({ pending: false, requestedAt: null, deletesAt: null });
      expect(prisma.accountDeletionRequest.update).toHaveBeenCalledWith({
        where: { userId: USER },
        data: { cancelledAt: now },
      });
    });

    it('refuses to cancel when nothing is pending', async () => {
      prisma.accountDeletionRequest.findUnique.mockResolvedValue(null);
      await expect(service.cancelDeletion(USER)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('refuses to cancel an already-cancelled request', async () => {
      prisma.accountDeletionRequest.findUnique.mockResolvedValue(makeRequest({ cancelledAt: now }));
      await expect(service.cancelDeletion(USER)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getStatus', () => {
    it('reports nothing pending when no request exists', async () => {
      prisma.accountDeletionRequest.findUnique.mockResolvedValue(null);
      await expect(service.getStatus(USER)).resolves.toEqual({
        pending: false,
        requestedAt: null,
        deletesAt: null,
      });
    });

    it('reports the deadline for a pending request', async () => {
      const request = makeRequest();
      prisma.accountDeletionRequest.findUnique.mockResolvedValue(request);

      await expect(service.getStatus(USER)).resolves.toEqual({
        pending: true,
        requestedAt: request.requestedAt.toISOString(),
        deletesAt: request.deletesAt.toISOString(),
      });
    });
  });

  describe('enforceGracePeriod', () => {
    it('is a no-op with no request on record', async () => {
      prisma.accountDeletionRequest.findUnique.mockResolvedValue(null);
      await expect(service.enforceGracePeriod(USER)).resolves.toBeUndefined();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('is a no-op for a cancelled request even past its deadline', async () => {
      prisma.accountDeletionRequest.findUnique.mockResolvedValue(
        makeRequest({ cancelledAt: now, deletesAt: new Date(now.getTime() - 1000) }),
      );
      await expect(service.enforceGracePeriod(USER)).resolves.toBeUndefined();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('is a no-op while the grace period has not yet elapsed', async () => {
      prisma.accountDeletionRequest.findUnique.mockResolvedValue(makeRequest());
      await expect(service.enforceGracePeriod(USER)).resolves.toBeUndefined();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('refuses without re-erasing when the account was already erased', async () => {
      prisma.accountDeletionRequest.findUnique.mockResolvedValue(makeRequest({ erasedAt: now }));

      await expect(service.enforceGracePeriod(USER)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('erases the account and refuses once the grace period has elapsed', async () => {
      prisma.accountDeletionRequest.findUnique.mockResolvedValue(
        makeRequest({ deletesAt: new Date(now.getTime() - 1000) }),
      );
      prisma.communityMember.findMany.mockResolvedValue([
        { communityId: 'community-1' },
        { communityId: 'community-2' },
      ]);

      await expect(service.enforceGracePeriod(USER)).rejects.toBeInstanceOf(UnauthorizedException);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);

      // Rule 3 — communities solely owned by this account are archived, the
      // same path `leaveCommunity` already forces a leaving owner down.
      expect(prisma.community.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['community-1', 'community-2'] }, deletedAt: null },
        data: { deletedAt: now },
      });

      // Rule 2 — only private-visibility content is soft-deleted; anything
      // reachable by anyone else is left alone and merely loses its author.
      for (const model of [
        prisma.post,
        prisma.review,
        prisma.collection,
        prisma.tierList,
        prisma.quote,
      ]) {
        expect(model.updateMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ visibility: 'private', deletedAt: null }),
            data: { deletedAt: now },
          }),
        );
      }

      // Public quotes are never touched by the where clause above — they
      // keep their (now-anonymised) authorId, same as public posts/reviews.
      expect(prisma.quote.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ authorId: USER, visibility: 'private' }),
        }),
      );

      // Rule 4 — credentials, links and sessions are removed outright.
      expect(prisma.authCredential.deleteMany).toHaveBeenCalledWith({ where: { userId: USER } });
      expect(prisma.connectedAccount.deleteMany).toHaveBeenCalledWith({ where: { userId: USER } });
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({ where: { userId: USER } });

      // Rule 1 — the user row is anonymised, not deleted, so every other
      // table's authorId/senderId keeps resolving to a real row.
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: USER },
          data: expect.objectContaining({
            deletedAt: now,
            displayName: 'Deleted user',
            bio: null,
            firstName: null,
            lastName: null,
            birthDate: null,
            countryCode: null,
          }),
        }),
      );

      expect(prisma.accountDeletionRequest.update).toHaveBeenCalledWith({
        where: { userId: USER },
        data: { erasedAt: now },
      });
    });

    it('does not touch communities.updateMany when the account owns none', async () => {
      prisma.accountDeletionRequest.findUnique.mockResolvedValue(
        makeRequest({ deletesAt: new Date(now.getTime() - 1000) }),
      );
      prisma.communityMember.findMany.mockResolvedValue([]);

      await expect(service.enforceGracePeriod(USER)).rejects.toBeInstanceOf(UnauthorizedException);

      expect(prisma.community.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [] }, deletedAt: null },
        data: { deletedAt: now },
      });
    });
  });
});
