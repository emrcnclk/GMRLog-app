import type { Prisma, Session } from '@prisma/client';

import type { DatabaseClient } from './types';

/** Session persistence (S2 §10.1). Persistence only — token mechanics live in auth. */
export interface SessionRepository {
  create(data: Prisma.SessionCreateInput): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  listByUser(userId: string): Promise<Session[]>;
  revoke(id: string): Promise<Session>;
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
