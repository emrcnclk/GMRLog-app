import type { AdminActionRecord, ObjectType, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * Admin action audit persistence (S2 §10.11). Persistence only.
 * Player report create does not write admin actions (actor is not staff).
 */
export interface AdminActionRepository {
  create(data: Prisma.AdminActionRecordCreateInput): Promise<AdminActionRecord>;
  findById(id: string): Promise<AdminActionRecord | null>;
  listBySubject(subjectType: ObjectType, subjectId: string): Promise<AdminActionRecord[]>;
  listByActor(actorId: string): Promise<AdminActionRecord[]>;
}

export class PrismaAdminActionRepository implements AdminActionRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.AdminActionRecordCreateInput): Promise<AdminActionRecord> {
    return this.db.adminActionRecord.create({ data });
  }

  findById(id: string): Promise<AdminActionRecord | null> {
    return this.db.adminActionRecord.findUnique({ where: { id } });
  }

  listBySubject(subjectType: ObjectType, subjectId: string): Promise<AdminActionRecord[]> {
    return this.db.adminActionRecord.findMany({
      where: { subjectType, subjectId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  listByActor(actorId: string): Promise<AdminActionRecord[]> {
    return this.db.adminActionRecord.findMany({
      where: { actorId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }
}
