import type { Post, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

/** Post persistence (S2 §10.4). Soft-deletable (§6). Persistence only. */
export interface PostRepository {
  create(data: Prisma.PostCreateInput): Promise<Post>;
  findById(id: string): Promise<Post | null>;
  findActiveById(id: string): Promise<Post | null>;
  listByAuthor(authorId: string): Promise<Post[]>;
  listByGame(gameId: string): Promise<Post[]>;
  /** D3.24 Communities 2.0 — posts scoped to a community (newest first). */
  listByCommunity(communityId: string): Promise<Post[]>;
  /** D3.24 — post counts per author within a community (badges · top_contributor). */
  countByCommunityGroupedByAuthor(
    communityId: string,
  ): Promise<{ authorId: string; count: number }[]>;
  /** D3.24 — at most one pinned post per author (§ SOCIAL_ACTIONS Pin Post). */
  findPinnedByAuthor(authorId: string): Promise<Post | null>;
  update(id: string, data: Prisma.PostUpdateInput): Promise<Post>;
  softDelete(id: string): Promise<Post>;
  delete(id: string): Promise<Post>;
}

export class PrismaPostRepository implements PostRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.PostCreateInput): Promise<Post> {
    return this.db.post.create({ data });
  }

  findById(id: string): Promise<Post | null> {
    return this.db.post.findUnique({ where: { id } });
  }

  findActiveById(id: string): Promise<Post | null> {
    return this.db.post.findFirst({ where: { id, deletedAt: null } });
  }

  listByAuthor(authorId: string): Promise<Post[]> {
    return this.db.post.findMany({
      where: { authorId, deletedAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  listByGame(gameId: string): Promise<Post[]> {
    return this.db.post.findMany({
      where: { gameId, deletedAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  async countByCommunityGroupedByAuthor(
    communityId: string,
  ): Promise<{ authorId: string; count: number }[]> {
    const rows = await this.db.post.groupBy({
      by: ['authorId'],
      where: { communityId, deletedAt: null },
      _count: { _all: true },
    });
    return rows.map((row) => ({
      authorId: row.authorId,
      count: row._count._all,
    }));
  }

  listByCommunity(communityId: string): Promise<Post[]> {
    return this.db.post.findMany({
      where: { communityId, deletedAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  findPinnedByAuthor(authorId: string): Promise<Post | null> {
    return this.db.post.findFirst({
      where: { authorId, pinnedAt: { not: null }, deletedAt: null },
    });
  }

  update(id: string, data: Prisma.PostUpdateInput): Promise<Post> {
    return this.db.post.update({ where: { id }, data });
  }

  softDelete(id: string): Promise<Post> {
    return this.db.post.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  delete(id: string): Promise<Post> {
    return this.db.post.delete({ where: { id } });
  }
}
