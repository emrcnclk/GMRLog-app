import type { Comment, CommentHostType, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * Comment persistence (S2 §10.4). Polymorphic host (hostType/hostId).
 * Soft-deletable (§6 / §13). Persistence only — no visibility/Trust filtering.
 */
export interface CommentRepository {
  create(data: Prisma.CommentCreateInput): Promise<Comment>;
  findById(id: string): Promise<Comment | null>;
  findActiveById(id: string): Promise<Comment | null>;
  listByHost(hostType: CommentHostType, hostId: string): Promise<Comment[]>;
  listReplies(parentCommentId: string): Promise<Comment[]>;
  /**
   * 7.1 — BACKEND_CHANGES.md §5. Comment counts per author across a set of
   * hosts (a community's own post ids) since a cutoff, one `groupBy`
   * (community leaderboard "replies" points). `Comment` has no direct
   * community FK — it is polymorphic on `hostType`/`hostId` — so the caller
   * supplies the host id set.
   */
  countByHostsGroupedByAuthorSince(
    hostType: CommentHostType,
    hostIds: readonly string[],
    since: Date,
  ): Promise<{ authorId: string; count: number }[]>;
  update(id: string, data: Prisma.CommentUpdateInput): Promise<Comment>;
  softDelete(id: string): Promise<Comment>;
  delete(id: string): Promise<Comment>;
}

export class PrismaCommentRepository implements CommentRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.CommentCreateInput): Promise<Comment> {
    return this.db.comment.create({ data });
  }

  findById(id: string): Promise<Comment | null> {
    return this.db.comment.findUnique({ where: { id } });
  }

  findActiveById(id: string): Promise<Comment | null> {
    return this.db.comment.findFirst({ where: { id, deletedAt: null } });
  }

  listByHost(hostType: CommentHostType, hostId: string): Promise<Comment[]> {
    return this.db.comment.findMany({
      where: { hostType, hostId, deletedAt: null },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  listReplies(parentCommentId: string): Promise<Comment[]> {
    return this.db.comment.findMany({
      where: { parentCommentId, deletedAt: null },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  async countByHostsGroupedByAuthorSince(
    hostType: CommentHostType,
    hostIds: readonly string[],
    since: Date,
  ): Promise<{ authorId: string; count: number }[]> {
    if (hostIds.length === 0) {
      return [];
    }
    const rows = await this.db.comment.groupBy({
      by: ['authorId'],
      where: {
        hostType,
        hostId: { in: [...hostIds] },
        deletedAt: null,
        createdAt: { gte: since },
      },
      _count: { _all: true },
    });
    return rows.map((row) => ({ authorId: row.authorId, count: row._count._all }));
  }

  update(id: string, data: Prisma.CommentUpdateInput): Promise<Comment> {
    return this.db.comment.update({ where: { id }, data });
  }

  softDelete(id: string): Promise<Comment> {
    return this.db.comment.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  delete(id: string): Promise<Comment> {
    return this.db.comment.delete({ where: { id } });
  }
}
