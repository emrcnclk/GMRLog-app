import type { UserConsent, UserConsentRepository } from '@gmrlog/database';

type ConsentInput = Parameters<UserConsentRepository['record']>[0];

export interface FakeUserConsentRepository extends UserConsentRepository {
  rows: Map<string, UserConsent>;
}

function keyOf(userId: string, documentId: string, version: string): string {
  return `${userId}|${documentId}|${version}`;
}

/**
 * 12.4 — in-memory consent store.
 *
 * Mirrors the real unique key `(userId, documentId, version)` exactly, so a
 * test that records two decisions about the same version sees one row updated
 * rather than two rows accumulating — which is the behaviour the Postgres
 * unique index enforces and the behaviour re-consent depends on.
 */
export function createFakeUserConsentRepository(): FakeUserConsentRepository {
  const rows = new Map<string, UserConsent>();

  function upsert(input: ConsentInput): UserConsent {
    const key = keyOf(input.userId, input.documentId, input.version);
    const existing = rows.get(key);
    const now = new Date();
    const next: UserConsent = {
      id: existing?.id ?? `consent-${String(rows.size + 1)}`,
      userId: input.userId,
      documentId: input.documentId,
      version: input.version,
      locale: input.locale,
      consentKey: input.consentKey,
      decision: input.decision,
      decidedAt: input.decidedAt ?? now,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    rows.set(key, next);
    return next;
  }

  return {
    rows,
    async listByUser(userId) {
      return [...rows.values()]
        .filter((row) => row.userId === userId)
        .sort((a, b) => b.decidedAt.getTime() - a.decidedAt.getTime());
    },
    async findDecision(userId, documentId, version) {
      return rows.get(keyOf(userId, documentId, version)) ?? null;
    },
    async record(input) {
      return upsert(input);
    },
    async recordMany(inputs) {
      return inputs.map((input) => upsert(input));
    },
  };
}
