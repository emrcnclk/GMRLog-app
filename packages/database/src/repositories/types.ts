import type { PrismaClient } from '@prisma/client';

/**
 * Persistence handle accepted by every repository. A live `PrismaClient` or a
 * transaction-scoped client both satisfy this — repositories never own the
 * connection lifecycle, they only speak persistence (S2 repository law).
 */
export type DatabaseClient = PrismaClient;
