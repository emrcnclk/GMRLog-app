import type { Prisma, Report, ReportStatus, ReportTargetType } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * Report persistence (S2 §10.10). Abuse reports — persistence only.
 */
export interface ReportRepository {
  create(data: Prisma.ReportCreateInput): Promise<Report>;
  findById(id: string): Promise<Report | null>;
  findOpenByReporterAndTarget(
    reporterId: string,
    targetType: ReportTargetType,
    targetId: string,
  ): Promise<Report | null>;
  listByReporter(reporterId: string): Promise<Report[]>;
  updateStatus(id: string, status: ReportStatus): Promise<Report>;
}

export class PrismaReportRepository implements ReportRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.ReportCreateInput): Promise<Report> {
    return this.db.report.create({ data });
  }

  findById(id: string): Promise<Report | null> {
    return this.db.report.findUnique({ where: { id } });
  }

  findOpenByReporterAndTarget(
    reporterId: string,
    targetType: ReportTargetType,
    targetId: string,
  ): Promise<Report | null> {
    return this.db.report.findFirst({
      where: {
        reporterId,
        targetType,
        targetId,
        status: { in: ['open', 'in_review'] },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  listByReporter(reporterId: string): Promise<Report[]> {
    return this.db.report.findMany({
      where: { reporterId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  updateStatus(id: string, status: ReportStatus): Promise<Report> {
    return this.db.report.update({ where: { id }, data: { status } });
  }
}
