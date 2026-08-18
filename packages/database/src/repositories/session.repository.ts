import type { Prisma, Session } from '@prisma/client';

import type { DatabaseClient } from './types';

/** Session persistence (S2 §10.1). Persistence only — token mechanics live in auth. */
export interface SessionRepository {
  create(data: Prisma.SessionCreateInput): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  listByUser(userId: string): Promise<Session[]>;
  revoke(id: string): Promise<Session>;
  /**
   * Atomically revokes a session only if it is still active, reporting whether
   * this call is the one that did it. Backs single-use refresh-token rotation:
   * a read-then-revoke pair lets two concurrent refreshes both observe an
   * active session and both mint a new credential pair, so the decision has to
   * happen inside one conditional UPDATE rather than across two statements.
   */
  revokeIfActive(id: string): Promise<boolean>;
  delete(id: string): Promise<Session>;
  /** Marks unrevoked sessions whose `expiresAt` is before `now` as revoked. */
  revokeExpiredBefore(now: Date): Promise<number>;
  /** Deletes sessions that are revoked or expired before `now` (maintenance). */
  deleteRevokedOrExpiredBefore(now: Date): Promise<number>;
}

export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.SessionCreateInput): Promise<Session> {
    return this.db.session.create({ data });
  }

  findById(id: string): Promise<Session | null> {
    return this.db.session.findUnique({ where: { id } });
  }

  listByUser(userId: string): Promise<Session[]> {
    return this.db.session.findMany({ where: { userId } });
  }

  revoke(id: string): Promise<Session> {
    return this.db.session.update({ where: { id }, data: { revokedAt: new Date() } });
  }

  async revokeIfActive(id: string): Promise<boolean> {
    // `updateMany` so the `revokedAt: null` guard travels into the WHERE clause
    // and the database decides the winner. Postgres takes a row lock for the
    // UPDATE, so exactly one concurrent caller can match an active row; the
    // rest match nothing and get `count: 0`.
    const result = await this.db.session.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count === 1;
  }

  delete(id: string): Promise<Session> {
    return this.db.session.delete({ where: { id } });
  }

  async revokeExpiredBefore(now: Date): Promise<number> {
    const result = await this.db.session.updateMany({
      where: {
        revokedAt: null,
        expiresAt: { lt: now },
      },
      data: { revokedAt: now },
    });
    return result.count;
  }

  async deleteRevokedOrExpiredBefore(now: Date): Promise<number> {
    const result = await this.db.session.deleteMany({
      where: {
        OR: [{ revokedAt: { not: null, lt: now } }, { expiresAt: { lt: now } }],
      },
    });
    return result.count;
  }
}
