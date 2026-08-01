import type { ModerationCase, ModerationStatus, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * Moderation case persistence (S2 §10.11). Workflow rows — persistence only.
 */
export interface ModerationCaseRepository {
  create(data: Prisma.ModerationCaseCreateInput): Promise<ModerationCase>;
  findById(id: string): Promise<ModerationCase | null>;
  findByReportId(reportId: string): Promise<ModerationCase | null>;
  updateStatus(id: string, status: ModerationStatus): Promise<ModerationCase>;
}

export class PrismaModerationCaseRepository implements ModerationCaseRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.ModerationCaseCreateInput): Promise<ModerationCase> {
    return this.db.moderationCase.create({ data });
  }

  findById(id: string): Promise<ModerationCase | null> {
    return this.db.moderationCase.findUnique({ where: { id } });
  }

  findByReportId(reportId: string): Promise<ModerationCase | null> {
    return this.db.moderationCase.findUnique({ where: { reportId } });
  }

  updateStatus(id: string, status: ModerationStatus): Promise<ModerationCase> {
    return this.db.moderationCase.update({ where: { id }, data: { status } });
  }
}
