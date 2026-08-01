/**
 * DI tokens binding the reputation domain to `@gmrlog/database` repository
 * implementations (F6.3 — services depend on repository contracts, never on
 * Prisma directly for stored rows; cross-cutting signal aggregation reads the
 * shared PrismaService, mirroring `PlayerMetricsRepository`'s aggregation role).
 */
export const REPUTATION_REPOSITORY = Symbol('REPUTATION_REPOSITORY');
export const REPUTATION_USER_REPOSITORY = Symbol('REPUTATION_USER_REPOSITORY');
export const REPUTATION_NOTIFICATION_REPOSITORY = Symbol('REPUTATION_NOTIFICATION_REPOSITORY');
