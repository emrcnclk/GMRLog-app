import { PrismaClient } from '@prisma/client';

export { PrismaClient, Prisma } from '@prisma/client';

// Generated model + enum types (S2 catalog). Domains consume these projections.
export type * from '@prisma/client';

export * from './repositories';

export interface CreatePrismaClientOptions {
  /** Overrides env(DATABASE_URL) resolution — injected by the platform config module. */
  datasourceUrl?: string;
}

export function createPrismaClient(options: CreatePrismaClientOptions = {}): PrismaClient {
  return new PrismaClient(
    options.datasourceUrl === undefined ? undefined : { datasourceUrl: options.datasourceUrl },
  );
}
