import type { ConsentDecision, Prisma, UserConsent } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * 12.4 — legal consent persistence.
 *
 * One row per (user, document, version). The version is part of the key
 * because accepting 1.0.0 says nothing about 1.1.0; a store keyed only by
 * document would carry an old acceptance forward across a change to the very
 * rights it granted.
 *
 * Note what is deliberately absent: any method that deletes a decision.
 * Consent history is evidence — under KVKK and the GDPR the controller has to
 * be able to show what a player was asked and what they answered — so a
 * withdrawal is recorded as a new decision on the same row, never as the
 * removal of the acceptance that preceded it.
 */
export interface UserConsentRepository {
  listByUser(userId: string): Promise<UserConsent[]>;
  findDecision(userId: string, documentId: string, version: string): Promise<UserConsent | null>;
  /**
   * Records a decision for one (user, document, version).
   *
   * Upsert rather than create: a player may accept a version, withdraw, and
   * accept again, and each of those is the current answer for that version
   * rather than a new row competing with the last.
   */
  record(input: {
    userId: string;
    documentId: string;
    version: string;
    locale: string;
    consentKey: string;
    decision: ConsentDecision;
    decidedAt?: Date;
  }): Promise<UserConsent>;
  recordMany(
    inputs: readonly {
      userId: string;
      documentId: string;
      version: string;
      locale: string;
      consentKey: string;
      decision: ConsentDecision;
      decidedAt?: Date;
    }[],
  ): Promise<UserConsent[]>;
}

export class PrismaUserConsentRepository implements UserConsentRepository {
  constructor(private readonly db: DatabaseClient) {}

  listByUser(userId: string): Promise<UserConsent[]> {
    return this.db.userConsent.findMany({
      where: { userId },
      orderBy: { decidedAt: 'desc' },
    });
  }

  findDecision(userId: string, documentId: string, version: string): Promise<UserConsent | null> {
    return this.db.userConsent.findUnique({
      where: { userId_documentId_version: { userId, documentId, version } },
    });
  }

  record(input: {
    userId: string;
    documentId: string;
    version: string;
    locale: string;
    consentKey: string;
    decision: ConsentDecision;
    decidedAt?: Date;
  }): Promise<UserConsent> {
    const decidedAt = input.decidedAt ?? new Date();

    const update: Prisma.UserConsentUpdateInput = {
      locale: input.locale,
      consentKey: input.consentKey,
      decision: input.decision,
      decidedAt,
    };

    return this.db.userConsent.upsert({
      where: {
        userId_documentId_version: {
          userId: input.userId,
          documentId: input.documentId,
          version: input.version,
        },
      },
      update,
      create: {
        user: { connect: { id: input.userId } },
        documentId: input.documentId,
        version: input.version,
        locale: input.locale,
        consentKey: input.consentKey,
        decision: input.decision,
        decidedAt,
      },
    });
  }

  async recordMany(
    inputs: readonly {
      userId: string;
      documentId: string;
      version: string;
      locale: string;
      consentKey: string;
      decision: ConsentDecision;
      decidedAt?: Date;
    }[],
  ): Promise<UserConsent[]> {
    // Sequential rather than `createMany`: each is an upsert, and the set is
    // two or three rows at registration. A transaction so a half-recorded
    // consent cannot outlive a failure — an account whose terms acceptance
    // landed but whose privacy acceptance did not is worse than neither.
    return this.db.$transaction(inputs.map((input) => this.recordOperation(input)));
  }

  private recordOperation(input: {
    userId: string;
    documentId: string;
    version: string;
    locale: string;
    consentKey: string;
    decision: ConsentDecision;
    decidedAt?: Date;
  }): Prisma.PrismaPromise<UserConsent> {
    const decidedAt = input.decidedAt ?? new Date();

    return this.db.userConsent.upsert({
      where: {
        userId_documentId_version: {
          userId: input.userId,
          documentId: input.documentId,
          version: input.version,
        },
      },
      update: {
        locale: input.locale,
        consentKey: input.consentKey,
        decision: input.decision,
        decidedAt,
      },
      create: {
        user: { connect: { id: input.userId } },
        documentId: input.documentId,
        version: input.version,
        locale: input.locale,
        consentKey: input.consentKey,
        decision: input.decision,
        decidedAt,
      },
    });
  }
}
