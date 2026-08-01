import type { ModerationCase, Report } from '@gmrlog/database';
import type { ModerationCaseResponse, ReportReasonValue, ReportResponse } from '@gmrlog/types';

/**
 * Persistence → player-safe ReportResponse.
 * Staff §15.18 fields are never projected on the player API.
 */
export function toReportResponse(report: Report): ReportResponse {
  return {
    id: report.id,
    targetType: report.targetType,
    targetId: report.targetId,
    reason: report.reason as ReportReasonValue,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
  };
}

export function toModerationCaseResponse(row: ModerationCase): ModerationCaseResponse {
  return {
    id: row.id,
    reportId: row.reportId,
    subjectType: row.subjectType,
    subjectId: row.subjectId,
    status: row.status,
    assignedTo: row.assignedTo,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
