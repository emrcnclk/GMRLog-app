import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppLogger } from '../infrastructure/logging/app-logger.service';

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
      findMany: vi.fn(),
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

  // 12.6 — `cancelDeletion` releases the caller's own `deletion` rate-limit
  // window so a cancel-then-re-request inside the same day isn't held at 429.
  const redis = { del: vi.fn() };

  const logger = { event: vi.fn() } as unknown as AppLogger;

  let service: AccountDeletionService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    prisma.communityMember.findMany.mockResolvedValue([]);
    prisma.$transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));

    redis.del.mockResolvedValue(1);
    service = new AccountDeletionService(prisma as never, redis as never, logger);
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

    it('releases the deletion rate-limit window so a same-day re-request is not held at 429', async () => {
      prisma.accountDeletionRequest.findUnique.mockResolvedValue(makeRequest());

      await service.cancelDeletion(USER);

      expect(redis.del).toHaveBeenCalledWith(`ratelimit:deletion:user:${USER}`);
    });

    it('still cancels when the rate-limit release fails', async () => {
      // The limiter fails open when Redis is down; a cancellation already
      // committed to the database must not be reported as failed because a
      // cache write did not land.
      prisma.accountDeletionRequest.findUnique.mockResolvedValue(makeRequest());
      redis.del.mockRejectedValueOnce(new Error('redis not ready'));

      await expect(service.cancelDeletion(USER)).resolves.toEqual({
        pending: false,
        requestedAt: null,
        deletesAt: null,
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

  describe('runExpiredDeletionSweep', () => {
    // The gap 12.6 recorded and left open: `enforceGracePeriod` only fires when
    // the account comes back for a token, so an account that never returns was
    // never erased even though its 30 days had passed.
    it('erases only requests that are due, live and uncancelled', async () => {
      prisma.accountDeletionRequest.findMany.mockResolvedValue([{ userId: USER }]);
      prisma.user.update.mockResolvedValue({});

      const result = await service.runExpiredDeletionSweep(now);

      expect(result).toEqual({ erased: 1, failed: 0 });
      expect(prisma.accountDeletionRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { cancelledAt: null, erasedAt: null, deletesAt: { lte: now } },
        }),
      );
      expect(prisma.user.update).toHaveBeenCalledTimes(1);
    });

    it('takes a bounded batch, oldest first', async () => {
      prisma.accountDeletionRequest.findMany.mockResolvedValue([]);

      await service.runExpiredDeletionSweep(now);

      expect(prisma.accountDeletionRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { deletesAt: 'asc' }, take: 100 }),
      );
    });

    it('keeps going when one account fails, and reports it', async () => {
      // One unerasable row must not postpone everyone else's erasure — that is
      // the compliance failure the sweep exists to prevent, not just noise.
      prisma.accountDeletionRequest.findMany.mockResolvedValue([
        { userId: 'user-bad' },
        { userId: 'user-good' },
      ]);
      prisma.$transaction
        .mockRejectedValueOnce(new Error('fk violation'))
        .mockImplementationOnce((ops: Promise<unknown>[]) => Promise.all(ops));
      prisma.user.update.mockResolvedValue({});

      const result = await service.runExpiredDeletionSweep(now);

      expect(result).toEqual({ erased: 1, failed: 1 });
      // Both were attempted: the loop did not stop at the first failure.
      // (`user.update` is not the probe here — `eraseAccount` calls it while
      // *building* the `$transaction` array, so it registers even for the row
      // whose transaction then rejects.)
      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    });

    it('does not throw the 401 the credential path throws', async () => {
      // `enforceGracePeriod` throws because it is refusing a caller a token.
      // The sweep has no caller, and a 401 inside a worker is just a failed job.
      prisma.accountDeletionRequest.findMany.mockResolvedValue([{ userId: USER }]);
      prisma.user.update.mockResolvedValue({});

      await expect(service.runExpiredDeletionSweep(now)).resolves.toEqual({
        erased: 1,
        failed: 0,
      });
    });
  });
});
