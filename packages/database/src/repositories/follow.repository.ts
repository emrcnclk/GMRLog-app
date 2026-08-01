import type { Follow, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * Follow persistence (S2 §10.8). Directed relationship; unique per
 * (followerId, followeeId) (§11). Relationship rows hard-delete (§6).
 * Lists ordered oldest → newest by creation time.
 */
export interface FollowRepository {
  create(data: Prisma.FollowCreateInput): Promise<Follow>;
  findByPair(followerId: string, followeeId: string): Promise<Follow | null>;
  exists(followerId: string, followeeId: string): Promise<boolean>;
  listFollowers(followeeId: string): Promise<Follow[]>;
  listFollowing(followerId: string): Promise<Follow[]>;
  delete(id: string): Promise<Follow>;
  deleteByPair(followerId: string, followeeId: string): Promise<Follow | null>;
}

export class PrismaFollowRepository implements FollowRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.FollowCreateInput): Promise<Follow> {
    return this.db.follow.create({ data });
  }

  findByPair(followerId: string, followeeId: string): Promise<Follow | null> {
    return this.db.follow.findUnique({
      where: { followerId_followeeId: { followerId, followeeId } },
    });
  }

  async exists(followerId: string, followeeId: string): Promise<boolean> {
    const row = await this.findByPair(followerId, followeeId);
    return row !== null;
  }

  listFollowers(followeeId: string): Promise<Follow[]> {
    return this.db.follow.findMany({
      where: { followeeId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  listFollowing(followerId: string): Promise<Follow[]> {
    return this.db.follow.findMany({
      where: { followerId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  delete(id: string): Promise<Follow> {
    return this.db.follow.delete({ where: { id } });
  }

  async deleteByPair(followerId: string, followeeId: string): Promise<Follow | null> {
    const existing = await this.findByPair(followerId, followeeId);
    if (!existing) {
      return null;
    }
    return this.delete(existing.id);
  }
}
