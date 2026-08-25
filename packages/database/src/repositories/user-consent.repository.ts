import type { ConsentDecision, Prisma, UserConsent } from '@prisma/client';

import { withTransaction, type DatabaseClient } from './types';

/**
 * 12.4 — legal consent persistence.
 *
 * **Append-only: one row per decision.** The version is recorded on every row
 * because accepting 1.0.0 says nothing about 1.1.0; a store keyed only by
 * document would carry an old acceptance forward across a change to the very
 * rights it granted.
 *
 * Note what is deliberately absent: any method that deletes *or overwrites* a
 * decision. Consent history is evidence — under KVKK and the GDPR the
 * controller has to be able to show what a player was asked and what they
 * answered — so a withdrawal is recorded as a new decision alongside the
 * acceptance that preceded it, never on top of it.
 *
 * That last word used to be "row", and the table was keyed
 * `(user, document, version)` UNIQUE to match, which quietly made a
 * re-decision an UPDATE in place: accept → withdraw → accept left one row
 * saying `accepted`, and the window during which consent was *not* held could
 * no longer be demonstrated to anyone. The current answer for a version is now
 * the newest row for it — what `findDecision` returns, and what `listByUser`
 * puts first.
 */
export interface UserConsentRepository {
  listByUser(userId: string): Promise<UserConsent[]>;
  /** The **newest** decision recorded for one (user, document, version), or null. */
  findDecision(userId: string, documentId: string, version: string): Promise<UserConsent | null>;
  /**
   * Records a decision for one (user, document, version).
   *
   * Always a new row: a player may accept a version, withdraw, and accept
   * again, and each of those is a fact about a moment rather than a correction
   * of the one before it.
   */
  record(input: UserConsentWrite): Promise<UserConsent>;
  recordMany(inputs: readonly UserConsentWrite[]): Promise<UserConsent[]>;
}

export interface UserConsentWrite {
  userId: string;
  documentId: string;
  version: string;
  locale: string;
  consentKey: string;
  decision: ConsentDecision;
  decidedAt?: Date;
}

export class PrismaUserConsentRepository implements UserConsentRepository {
  constructor(private readonly db: DatabaseClient) {}

  listByUser(userId: string): Promise<UserConsent[]> {
    return this.db.userConsent.findMany({
      where: { userId },
      // `sequence`, not `decidedAt`: newest-first has to be exact now that a
      // version can carry more than one row, and `decidedAt` is
      // millisecond-precision — a batch write ties on it. Insertion order is
      // decision order.
      orderBy: { sequence: 'desc' },
    });
  }

  findDecision(userId: string, documentId: string, version: string): Promise<UserConsent | null> {
    return this.db.userConsent.findFirst({
      where: { userId, documentId, version },
      orderBy: { sequence: 'desc' },
    });
  }

  record(input: UserConsentWrite): Promise<UserConsent> {
    return this.db.userConsent.create({ data: consentRow(input) });
  }

  recordMany(inputs: readonly UserConsentWrite[]): Promise<UserConsent[]> {
    // Sequential rather than `createMany`: the set is two or three rows at
    // registration and each one has to come back. A transaction so a
    // half-recorded consent cannot outlive a failure — an account whose terms
    // acceptance landed but whose privacy acceptance did not is worse than
    // neither.
    //
    // `withTransaction` rather than `$transaction` directly: when the caller
    // has already opened one — registration writes the user, the credential,
    // the settings row and these together — this joins theirs instead of
    // trying to nest a second, which Prisma does not have.
    return withTransaction(this.db, async (tx) => {
      const rows: UserConsent[] = [];
      for (const input of inputs) {
        rows.push(await tx.userConsent.create({ data: consentRow(input) }));
      }
      return rows;
    });
  }
}

function consentRow(input: UserConsentWrite): Prisma.UserConsentCreateInput {
  return {
    user: { connect: { id: input.userId } },
    documentId: input.documentId,
    version: input.version,
    locale: input.locale,
    consentKey: input.consentKey,
    decision: input.decision,
    decidedAt: input.decidedAt ?? new Date(),
  };
}
