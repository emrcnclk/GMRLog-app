import type { UserConsent, UserConsentRepository } from '@gmrlog/database';

type ConsentInput = Parameters<UserConsentRepository['record']>[0];

export interface FakeUserConsentRepository extends UserConsentRepository {
  /** Every row ever recorded, oldest first — the table, not a per-version view. */
  rows: UserConsent[];
}

/**
 * 12.4 — in-memory consent store.
 *
 * Mirrors the real table exactly, which since the append-only migration means
 * **a new row per decision**, not one row per `(userId, documentId, version)`
 * updated in place. A test that records two decisions about the same version
 * sees two rows, and the newest one is the answer — which is what
 * `findDecision` and `listByUser`'s `decidedAt desc` ordering give, and what
 * re-consent reads.
 *
 * It used to key a `Map` on `(userId, documentId, version)` and overwrite,
 * because the table used to carry a unique index on those three columns. That
 * index is gone: it was silently destroying the withdrawal in an
 * accept → withdraw → accept sequence, which is exactly the evidence the store
 * exists to keep.
 */
export function createFakeUserConsentRepository(): FakeUserConsentRepository {
  const rows: UserConsent[] = [];

  function append(input: ConsentInput): UserConsent {
    const now = new Date();
    const next: UserConsent = {
      id: `consent-${String(rows.length + 1)}`,
      sequence: rows.length + 1,
      userId: input.userId,
      documentId: input.documentId,
      version: input.version,
      locale: input.locale,
      consentKey: input.consentKey,
      decision: input.decision,
      decidedAt: input.decidedAt ?? now,
      createdAt: now,
      updatedAt: now,
    };
    rows.push(next);
    return next;
  }

  return {
    rows,
    async listByUser(userId) {
      // `sequence` desc, exactly as the real repository orders: `decidedAt` is
      // millisecond-precision and two decisions in one test tie on it.
      return [...rows]
        .filter((row) => row.userId === userId)
        .sort((a, b) => b.sequence - a.sequence);
    },
    async findDecision(userId, documentId, version) {
      return (
        [...rows]
          .filter(
            (row) =>
              row.userId === userId && row.documentId === documentId && row.version === version,
          )
          .sort((a, b) => b.sequence - a.sequence)[0] ?? null
      );
    },
    async record(input) {
      return append(input);
    },
    async recordMany(inputs) {
      return inputs.map((input) => append(input));
    },
  };
}
