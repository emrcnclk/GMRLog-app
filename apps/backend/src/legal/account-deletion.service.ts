import type { AccountDeletionStatusResponse } from '@gmrlog/types';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../infrastructure/database/prisma.service';

const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * 12.6 — the right `privacy-policy.en.ts` §6/§7 has promised since 12.1: a
 * 30-day grace period between a deletion request and irreversible erasure,
 * cancellable by the player at any point before `deletesAt`.
 *
 * **Content-handling decisions, made here rather than discovered in
 * production** (the task's own gate). Each one traces to something already
 * decided elsewhere in this codebase rather than a rule invented for this
 * task:
 *
 * 1. **Posts, reviews, comments, messages the account authored: kept,
 *    author anonymised.** §6 already promises this in prose — "deleting your
 *    account removes your identity from it rather than destroying another
 *    person's record of their own conversation" — for the case a reply sits
 *    beneath someone else's post, or a message has already reached its
 *    recipient. `eraseAccount` below doesn't delete a single `Post`,
 *    `Review`, `Comment` or `Message` row for that reason: it scrubs the
 *    `User` row's PII columns (the same nullable columns 12.4c introduced),
 *    so every row `authorId`/`senderId` still resolves to a real user whose
 *    display name now reads "Deleted user". No foreign key ever points at a
 *    row that stops existing.
 * 2. **`private`-visibility content is the one exception, and is
 *    soft-deleted instead.** Nobody but the author could ever see a private
 *    review, post, collection or tier list, so anonymising it serves no
 *    one — it would just be personal data sitting unread. `deletedAt` is the
 *    same soft-delete column 12.5's export already treats as "gone".
 * 3. **Communities the account solely owns: archived (soft-deleted), not
 *    handed to a successor.** `CommunitiesService.leaveCommunity` already
 *    refuses an owner ("Community owner cannot leave; delete the community
 *    instead" — `communities.service.ts`) — there is no ownership-transfer
 *    primitive anywhere in this codebase today. Account deletion takes the
 *    same path a leaving owner is already forced to take rather than
 *    inventing succession logic as a side effect of this task. A community's
 *    other members' own posts and comments are unaffected by this — they
 *    fall under rule 1 like any other content, the community row itself is
 *    just no longer reachable (`requireActiveCommunity` already treats a
 *    soft-deleted community as gone).
 * 4. **Auth credentials, connected accounts and sessions: deleted /
 *    revoked outright**, not merely anonymised. An email address and an
 *    OAuth token are the two pieces of this account's data with no
 *    legitimate reason to survive erasure for anyone else's sake — nothing
 *    else's row references them the way a comment's `authorId` does.
 */
@Injectable()
export class AccountDeletionService {
  constructor(private readonly prisma: PrismaService) {}

  async requestDeletion(userId: string): Promise<AccountDeletionStatusResponse> {
    const existing = await this.prisma.accountDeletionRequest.findUnique({ where: { userId } });

    if (existing !== null && existing.cancelledAt === null && existing.erasedAt === null) {
      throw new ConflictException({
        code: 'DELETION_ALREADY_PENDING',
        message: 'A deletion request is already pending for this account.',
      });
    }

    const requestedAt = new Date();
    const deletesAt = new Date(requestedAt.getTime() + GRACE_PERIOD_MS);

    await this.prisma.accountDeletionRequest.upsert({
      where: { userId },
      create: { userId, requestedAt, deletesAt },
      update: { requestedAt, deletesAt, cancelledAt: null, erasedAt: null },
    });

    return {
      pending: true,
      requestedAt: requestedAt.toISOString(),
      deletesAt: deletesAt.toISOString(),
    };
  }

  async cancelDeletion(userId: string): Promise<AccountDeletionStatusResponse> {
    const existing = await this.prisma.accountDeletionRequest.findUnique({ where: { userId } });

    const isPending =
      existing !== null && existing.cancelledAt === null && existing.erasedAt === null;
    if (!isPending) {
      throw new NotFoundException({
        code: 'NO_PENDING_DELETION',
        message: 'There is no pending deletion request to cancel.',
      });
    }

    await this.prisma.accountDeletionRequest.update({
      where: { userId },
      data: { cancelledAt: new Date() },
    });

    return { pending: false, requestedAt: null, deletesAt: null };
  }

  async getStatus(userId: string): Promise<AccountDeletionStatusResponse> {
    const existing = await this.prisma.accountDeletionRequest.findUnique({ where: { userId } });

    if (existing === null) {
      return { pending: false, requestedAt: null, deletesAt: null };
    }
    if (existing.cancelledAt !== null || existing.erasedAt !== null) {
      return { pending: false, requestedAt: null, deletesAt: null };
    }

    return {
      pending: true,
      requestedAt: existing.requestedAt.toISOString(),
      deletesAt: existing.deletesAt.toISOString(),
    };
  }

  /**
   * The grace-period check `SessionsService.issueCredentialPair` runs before
   * every token issuance — login, register, refresh, every OAuth path.
   *
   * No scheduled job runs the 30-day erasure yet (out of this task's scope —
   * see the module doc). Credential issuance is the substitute: it is the one
   * moment a lazy check costs nothing extra, because the account is already
   * being looked up. An account that never comes back to request a new token
   * past its `deletesAt` would never be swept by this alone — that gap is
   * real and is the scheduled-job follow-up this task leaves as a TODO, not a
   * defect in the check itself.
   *
   * Three states, one no-op and two exits:
   * - no request, or a cancelled one → no-op, issuance proceeds.
   * - `erasedAt` already set → the account was erased on a previous call;
   *   refuse rather than silently re-running erasure.
   * - `deletesAt` has passed and `erasedAt` is still null → this call is the
   *   first one since expiry, so it performs the erasure itself and then
   *   refuses (the account it just erased cannot also be issued a token).
   */
  async enforceGracePeriod(userId: string): Promise<void> {
    const request = await this.prisma.accountDeletionRequest.findUnique({ where: { userId } });
    if (request === null) {
      return;
    }
    if (request.cancelledAt !== null) {
      return;
    }

    if (request.erasedAt !== null) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_DELETED',
        message: 'This account has been permanently deleted.',
      });
    }

    if (request.deletesAt.getTime() > Date.now()) {
      return;
    }

    await this.eraseAccount(userId);
    throw new UnauthorizedException({
      code: 'ACCOUNT_DELETED',
      message: 'This account has been permanently deleted.',
    });
  }

  private async eraseAccount(userId: string): Promise<void> {
    const now = new Date();

    const ownedCommunityIds = (
      await this.prisma.communityMember.findMany({
        where: { userId, role: 'owner' },
        select: { communityId: true },
      })
    ).map((row) => row.communityId);

    await this.prisma.$transaction([
      // Rule 3 — archive communities this account solely owns, the same path
      // `leaveCommunity` already forces a leaving owner down.
      this.prisma.community.updateMany({
        where: { id: { in: ownedCommunityIds }, deletedAt: null },
        data: { deletedAt: now },
      }),
      // Rule 2 — private-only content has no one else to stay legible for.
      this.prisma.post.updateMany({
        where: { authorId: userId, visibility: 'private', deletedAt: null },
        data: { deletedAt: now },
      }),
      this.prisma.review.updateMany({
        where: { authorId: userId, visibility: 'private', deletedAt: null },
        data: { deletedAt: now },
      }),
      this.prisma.collection.updateMany({
        where: { ownerId: userId, visibility: 'private', deletedAt: null },
        data: { deletedAt: now },
      }),
      this.prisma.tierList.updateMany({
        where: { ownerId: userId, visibility: 'private', deletedAt: null },
        data: { deletedAt: now },
      }),
      // Rule 4 — credentials, links and sessions have no reason to survive.
      this.prisma.authCredential.deleteMany({ where: { userId } }),
      this.prisma.connectedAccount.deleteMany({ where: { userId } }),
      this.prisma.session.deleteMany({ where: { userId } }),
      // Rule 1 — everything else (posts, reviews, comments, messages, public
      // collections/tier lists) is left exactly where it is; only the author
      // identity behind it is scrubbed, here.
      this.prisma.user.update({
        where: { id: userId },
        data: {
          deletedAt: now,
          handle: `deleted-${userId}`,
          displayName: 'Deleted user',
          bio: null,
          firstName: null,
          lastName: null,
          birthDate: null,
          countryCode: null,
          avatarKey: null,
          bannerKey: null,
          avatarBlurhash: null,
          avatarVariants: Prisma.DbNull,
          bannerBlurhash: null,
          bannerVariants: Prisma.DbNull,
          privacyId: null,
        },
      }),
      this.prisma.accountDeletionRequest.update({
        where: { userId },
        data: { erasedAt: now },
      }),
    ]);
  }
}
