import type { Prisma, Review } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * Review persistence (S2 §10.4). Soft-deletable (§6); active reads assume
 * `deletedAt IS NULL` (§15). Persistence only — no visibility/Trust filtering.
 */
export interface ReviewRepository {
  create(data: Prisma.ReviewCreateInput): Promise<Review>;
  findById(id: string): Promise<Review | null>;
  findActiveById(id: string): Promise<Review | null>;
  findActiveByAuthorAndGame(authorId: string, gameId: string): Promise<Review | null>;
  listByGame(gameId: string): Promise<Review[]>;
  /** D3.24 Game Hub tab count. */
  countByGame(gameId: string): Promise<number>;
  listByAuthor(authorId: string): Promise<Review[]>;
  update(id: string, data: Prisma.ReviewUpdateInput): Promise<Review>;
  softDelete(id: string): Promise<Review>;
  delete(id: string): Promise<Review>;
}

export class PrismaReviewRepository implements ReviewRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.ReviewCreateInput): Promise<Review> {
    return this.db.review.create({ data });
  }

  findById(id: string): Promise<Review | null> {
    return this.db.review.findUnique({ where: { id } });
  }

  findActiveById(id: string): Promise<Review | null> {
    return this.db.review.findFirst({ where: { id, deletedAt: null } });
  }

  findActiveByAuthorAndGame(authorId: string, gameId: string): Promise<Review | null> {
    return this.db.review.findFirst({
      where: { authorId, gameId, deletedAt: null },
    });
  }

  listByGame(gameId: string): Promise<Review[]> {
    return this.db.review.findMany({
      where: { gameId, deletedAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  countByGame(gameId: string): Promise<number> {
    return this.db.review.count({ where: { gameId, deletedAt: null } });
  }

  listByAuthor(authorId: string): Promise<Review[]> {
    return this.db.review.findMany({
      where: { authorId, deletedAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  update(id: string, data: Prisma.ReviewUpdateInput): Promise<Review> {
    return this.db.review.update({ where: { id }, data });
  }

  softDelete(id: string): Promise<Review> {
    return this.db.review.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  delete(id: string): Promise<Review> {
    return this.db.review.delete({ where: { id } });
  }
}
