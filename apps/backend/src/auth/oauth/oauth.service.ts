import type { Prisma } from '@gmrlog/database';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/database/prisma.service';

import { baseHandleFromDisplayName } from './handle-generator';
import type { OAuthIdentity, OAuthMatchResult } from './oauth.types';

const MAX_MATCH_ATTEMPTS = 3;
const MAX_HANDLE_ATTEMPTS = 50;
const MAX_HANDLE_LENGTH = 24;
const MAX_DISPLAY_NAME_LENGTH = 40;

/**
 * OAuth account matching (OAUTH.md §3). Verified-email matching only — an
 * unverified provider email must never claim an existing account, so rule 3
 * always rejects instead of linking. That is the account-takeover path this
 * service exists to close.
 *
 * `User` has no email column, and `AuthCredential.providerRef` only carries
 * an email for `type=password` rows (`SessionsService.register`). So a fresh
 * OAuth signup with a *verified* email also plants a `type=password`
 * credential for that email with `secretHash: null` — a claim placeholder,
 * not a login method (`SessionsService.login` already refuses a null hash).
 * That is what lets rule 2 find "same person, second provider" later. It
 * must only ever be planted from a verified email: planting one from an
 * unverified email would let an attacker claim an email they don't own, and
 * then win the account outright when its real owner later verifies it
 * through a different provider and rule 2 links to the attacker's row.
 *
 * Every multi-row write here goes through one `$transaction` (OAUTH.md §2:
 * "two devices tapping Google at the same moment must not create two
 * users"). The three unique constraints in play — the oauth credential's
 * `(type, providerRef)`, the email placeholder's same constraint, and
 * `User.handle` — mean a genuine race surfaces as a Postgres unique
 * violation (Prisma `P2002`) on one of the two racing transactions, not a
 * silent duplicate. That transaction is retried from scratch; on retry, the
 * loser's own lookups now see what the winner committed and resolve to
 * `signed_in`/`linked` instead of colliding again.
 *
 * `AccountLink.userId` is non-nullable, so this service cannot create the
 * `pending` pre-user row OAUTH.md §2 step 1 describes ("the backend creates
 * an account_links row ... before matching") — there is no user to attach it
 * to yet at that point. It writes a `completed` row only once a user is
 * resolved, and only for rules that actually add a login method (2 and 4) —
 * not for a routine rule-1 sign-in, so this table doesn't gain a row on
 * every login. The `pending` / `awaiting_provider` states, and who cleans up
 * an abandoned one, belong entirely to whatever 4.3's `/start` and
 * `/callback` controllers use to track an attempt before a user exists.
 */
@Injectable()
export class OAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveLogin(identity: OAuthIdentity): Promise<OAuthMatchResult> {
    return this.attempt(identity, 0);
  }

  private async attempt(identity: OAuthIdentity, retryCount: number): Promise<OAuthMatchResult> {
    try {
      return await this.prisma.$transaction((tx) => this.matchWithinTransaction(tx, identity));
    } catch (error) {
      if (retryCount < MAX_MATCH_ATTEMPTS - 1 && isUniqueViolation(error)) {
        return this.attempt(identity, retryCount + 1);
      }
      throw error;
    }
  }

  private async matchWithinTransaction(
    tx: Prisma.TransactionClient,
    identity: OAuthIdentity,
  ): Promise<OAuthMatchResult> {
    const providerRef = `${identity.provider}:${identity.subject}`;

    // Rule 1 — this provider + subject already has a credential: sign in.
    // Short-circuits before any email comparison. OAUTH.md doesn't say
    // whether a changed provider email should re-sync the stored claim
    // placeholder; leaving it untouched avoids reassigning that placeholder
    // out from under whoever the new email now actually belongs to.
    const existingOAuthCredential = await tx.authCredential.findUnique({
      where: { type_providerRef: { type: 'oauth', providerRef } },
    });
    if (existingOAuthCredential !== null) {
      const user = await tx.user.findUnique({ where: { id: existingOAuthCredential.userId } });
      if (user?.deletedAt !== null) {
        return { outcome: 'rejected', reason: 'account_deleted' };
      }
      return { outcome: 'signed_in', user };
    }

    const email = normalizeEmail(identity.email);
    const emailCredential =
      email !== null
        ? await tx.authCredential.findUnique({
            where: { type_providerRef: { type: 'password', providerRef: email } },
          })
        : null;

    if (emailCredential !== null) {
      const matchedUser = await tx.user.findUnique({
        where: { id: emailCredential.userId },
      });
      if (matchedUser?.deletedAt !== null) {
        return { outcome: 'rejected', reason: 'account_deleted' };
      }

      // Rule 3 — unverified email matching an existing user: never link.
      if (!identity.emailVerified) {
        return {
          outcome: 'rejected',
          reason: 'unverified_email_conflict',
          hasPassword: emailCredential.secretHash !== null,
        };
      }

      // Rule 2 — verified email matches an existing user: link.
      await tx.authCredential.create({
        data: {
          user: { connect: { id: matchedUser.id } },
          type: 'oauth',
          provider: identity.provider,
          providerRef,
        },
      });
      await tx.accountLink.create({
        data: {
          user: { connect: { id: matchedUser.id } },
          provider: identity.provider,
          purpose: 'login',
          status: 'completed',
        },
      });
      return { outcome: 'linked', user: matchedUser };
    }

    // Rule 4 — no match: provision a new user.
    const handle = await this.allocateHandle(tx, identity.displayName);
    const displayName = identity.displayName.trim().slice(0, MAX_DISPLAY_NAME_LENGTH) || handle;
    const user = await tx.user.create({ data: { handle, displayName } });

    await tx.authCredential.create({
      data: {
        user: { connect: { id: user.id } },
        type: 'oauth',
        provider: identity.provider,
        providerRef,
      },
    });

    if (email !== null && identity.emailVerified) {
      await tx.authCredential.create({
        data: {
          user: { connect: { id: user.id } },
          type: 'password',
          providerRef: email,
          secretHash: null,
        },
      });
    }

    await tx.accountLink.create({
      data: {
        user: { connect: { id: user.id } },
        provider: identity.provider,
        purpose: 'login',
        status: 'completed',
      },
    });

    return { outcome: 'created', user };
  }

  private async allocateHandle(tx: Prisma.TransactionClient, displayName: string): Promise<string> {
    const base = baseHandleFromDisplayName(displayName);
    for (let attempt = 0; attempt < MAX_HANDLE_ATTEMPTS; attempt++) {
      const candidate =
        attempt === 0 ? base : `${base}${String(attempt + 1)}`.slice(0, MAX_HANDLE_LENGTH);
      const existing = await tx.user.findUnique({ where: { handle: candidate } });
      if (existing === null) return candidate;
    }
    throw new Error(`Unable to allocate a unique handle from "${displayName}"`);
  }
}

function normalizeEmail(email: string | null): string | null {
  return email === null ? null : email.trim().toLowerCase();
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}
