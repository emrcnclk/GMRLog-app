import type { Prisma, Repost } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * Repost persistence (D3.24 · docs/07_SOCIAL/SOCIAL_ACTIONS.md). Amplify a post
 * without a new body; idempotent per (actorId, originalPostId). Soft-deletable
 * so an un-repost can be audited like other content edges.
 */
export interface RepostRepository {
  create(data: Prisma.RepostCreateInput): Promise<Repost>;
  findById(id: string): Promise<Repost | null>;
  findActiveByActorAndPost(actorId: string, originalPostId: string): Promise<Repost | null>;
  countByPost(originalPostId: string): Promise<number>;
  softDelete(id: string): Promise<Repost>;
  delete(id: string): Promise<Repost>;
}

export class PrismaRepostRepository implements RepostRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.RepostCreateInput): Promise<Repost> {
    return this.db.repost.create({ data });
  }

  findById(id: string): Promise<Repost | null> {
    return this.db.repost.findUnique({ where: { id } });
  }

  findActiveByActorAndPost(actorId: string, originalPostId: string): Promise<Repost | null> {
    return this.db.repost.findFirst({
      where: { actorId, originalPostId, deletedAt: null },
    });
  }

  countByPost(originalPostId: string): Promise<number> {
    return this.db.repost.count({ where: { originalPostId, deletedAt: null } });
  }

  softDelete(id: string): Promise<Repost> {
    return this.db.repost.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  delete(id: string): Promise<Repost> {
    return this.db.repost.delete({ where: { id } });
  }
}
