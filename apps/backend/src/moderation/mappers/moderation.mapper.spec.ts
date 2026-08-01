import { describe, expect, it } from 'vitest';

import type { ModerationCase, Report } from '@gmrlog/database';

import { toModerationCaseResponse, toReportResponse } from './moderation.mapper';

describe('moderation.mapper', () => {
  it('maps report and moderation case rows', () => {
    const report = {
      id: 'report-1',
      targetType: 'user',
      targetId: 'user-2',
      reason: 'spam',
      status: 'open',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    } as Report;

    expect(toReportResponse(report)).toMatchObject({
      id: 'report-1',
      targetType: 'user',
      reason: 'spam',
      status: 'open',
    });

    const moderationCase = {
      id: 'case-1',
      reportId: 'report-1',
      subjectType: 'user',
      subjectId: 'user-2',
      status: 'open',
      assignedTo: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    } as ModerationCase;

    expect(toModerationCaseResponse(moderationCase)).toMatchObject({
      id: 'case-1',
      reportId: 'report-1',
      assignedTo: null,
    });
  });
});
