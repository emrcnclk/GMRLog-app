import type {
  ModerationCase,
  ModerationCaseRepository,
  Prisma,
  Report,
  ReportRepository,
  ReportStatus,
  ReportTargetType,
  User,
  UserRepository,
} from '@gmrlog/database';

/**
 * In-memory repository fakes — test support only (build-excluded).
 */

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${String(idCounter)}`;
}

function connectId(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || !('connect' in value)) {
    return undefined;
  }
  const connect = (value as { connect?: { id?: string } }).connect;
  return typeof connect?.id === 'string' ? connect.id : undefined;
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    handle: 'gamer',
    displayName: 'Gamer',
    bio: null,
    avatarKey: null,
    bannerKey: null,
    avatarBlurhash: null,
    avatarVariants: null,
    bannerBlurhash: null,
    bannerVariants: null,
    privacyId: null,
    creatorFeatured: false,
    accountKind: 'individual',
    cardNumber: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

export function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    id: 'report-1',
    reporterId: 'user-1',
    targetType: 'user',
    targetId: 'user-2',
    reason: 'spam',
    status: 'open',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function makeModerationCase(overrides: Partial<ModerationCase> = {}): ModerationCase {
  return {
    id: 'case-1',
    reportId: 'report-1',
    subjectType: 'user',
    subjectId: 'user-2',
    status: 'open',
    assignedTo: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export interface FakeReportRepository extends ReportRepository {
  rows: Map<string, Report>;
}

export function createFakeReportRepository(seed: Report[] = []): FakeReportRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));
  return {
    rows,
    create: (data: Prisma.ReportCreateInput) => {
      const reporterId = connectId(data.reporter);
      if (!reporterId) {
        return Promise.reject(new Error('reporter required'));
      }
      const report = makeReport({
        id: nextId('report'),
        reporterId,
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
        status: data.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      rows.set(report.id, report);
      return Promise.resolve(report);
    },
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findOpenByReporterAndTarget: (reporterId, targetType, targetId) => {
      const match = [...rows.values()].find(
        (row) =>
          row.reporterId === reporterId &&
          row.targetType === targetType &&
          row.targetId === targetId &&
          (row.status === 'open' || row.status === 'in_review'),
      );
      return Promise.resolve(match ?? null);
    },
    listByReporter: (reporterId) =>
      Promise.resolve(
        [...rows.values()]
          .filter((row) => row.reporterId === reporterId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      ),
    updateStatus: (id, status: ReportStatus) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`report ${id} not found`));
      }
      const next: Report = { ...current, status, updatedAt: new Date() };
      rows.set(id, next);
      return Promise.resolve(next);
    },
  };
}

export interface FakeModerationCaseRepository extends ModerationCaseRepository {
  rows: Map<string, ModerationCase>;
}

export function createFakeModerationCaseRepository(
  seed: ModerationCase[] = [],
): FakeModerationCaseRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));
  return {
    rows,
    create: (data: Prisma.ModerationCaseCreateInput) => {
      const reportId = connectId(data.report) ?? null;
      const row = makeModerationCase({
        id: nextId('case'),
        reportId,
        subjectType: data.subjectType,
        subjectId: data.subjectId,
        status: data.status,
        assignedTo: connectId(data.assignee) ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      rows.set(row.id, row);
      return Promise.resolve(row);
    },
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findByReportId: (reportId) =>
      Promise.resolve([...rows.values()].find((row) => row.reportId === reportId) ?? null),
    updateStatus: (id, status) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`case ${id} not found`));
      }
      const next: ModerationCase = { ...current, status, updatedAt: new Date() };
      rows.set(id, next);
      return Promise.resolve(next);
    },
  };
}

export interface FakeUserRepository extends UserRepository {
  rows: Map<string, User>;
}

export function createFakeUserRepository(seed: User[] = []): FakeUserRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));
  return {
    rows,
    create: () => Promise.reject(new Error('not supported')),
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findByHandle: () => Promise.resolve(null),
    findManyByIds: (ids) =>
      Promise.resolve(
        ids.flatMap((id) => {
          const user = rows.get(id);
          return user ? [user] : [];
        }),
      ),
    update: () => Promise.reject(new Error('not supported')),
    softDelete: () => Promise.reject(new Error('not supported')),
    delete: () => Promise.reject(new Error('not supported')),
  };
}

export function createActiveIdLookup<T extends { id: string }>(
  seed: T[] = [],
): { rows: Map<string, T>; findActiveById: (id: string) => Promise<T | null> } {
  const rows = new Map(seed.map((row) => [row.id, row]));
  return {
    rows,
    findActiveById: (id) => Promise.resolve(rows.get(id) ?? null),
  };
}

export type { ReportTargetType };
