import type { PresenceStatus, Prisma, UserPresence } from '@prisma/client';

import type { DatabaseClient } from './types';

export interface PresenceRepository {
  upsert(userId: string, status: PresenceStatus): Promise<UserPresence>;
  findByUserId(userId: string): Promise<UserPresence | null>;
  findManyByUserIds(userIds: readonly string[]): Promise<UserPresence[]>;
}

export class PrismaPresenceRepository implements PresenceRepository {
  constructor(private readonly db: DatabaseClient) {}

  upsert(userId: string, status: PresenceStatus): Promise<UserPresence> {
    const now = new Date();
    return this.db.userPresence.upsert({
      where: { userId },
      create: {
        user: { connect: { id: userId } },
        status,
        lastSeenAt: now,
      },
      update: {
        status,
        lastSeenAt: now,
      },
    });
  }

  findByUserId(userId: string): Promise<UserPresence | null> {
    return this.db.userPresence.findUnique({ where: { userId } });
  }

  findManyByUserIds(userIds: readonly string[]): Promise<UserPresence[]> {
    if (userIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.db.userPresence.findMany({
      where: { userId: { in: [...userIds] } },
    });
  }
}

export type { PresenceStatus, Prisma };
