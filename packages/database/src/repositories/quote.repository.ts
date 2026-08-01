import type { Prisma, Quote, QuoteTargetType } from '@prisma/client';

import type { DatabaseClient } from './types';

export interface QuoteListCursor {
  createdAt: Date;
  id: string;
}

export interface QuoteListParams {
  limit: number;
  cursor?: QuoteListCursor;
}

/**
 * Quote persistence (D3.24 Quote System v2 · docs/07_SOCIAL/SOCIAL_ACTIONS.md).
 * Polymorphic target (`targetType` + `targetId`) — Quote never mutates the
 * target, it only references it. Soft-deletable.
 */
export interface QuoteRepository {
  create(data: Prisma.QuoteCreateInput): Promise<Quote>;
  findById(id: string): Promise<Quote | null>;
  findActiveById(id: string): Promise<Quote | null>;
  listByAuthor(authorId: string, params: QuoteListParams): Promise<Quote[]>;
  listByTarget(targetType: QuoteTargetType, targetId: string): Promise<Quote[]>;
  softDelete(id: string): Promise<Quote>;
  delete(id: string): Promise<Quote>;
}

export class PrismaQuoteRepository implements QuoteRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.QuoteCreateInput): Promise<Quote> {
    return this.db.quote.create({ data });
  }

  findById(id: string): Promise<Quote | null> {
    return this.db.quote.findUnique({ where: { id } });
  }

  findActiveById(id: string): Promise<Quote | null> {
    return this.db.quote.findFirst({ where: { id, deletedAt: null } });
  }

  listByAuthor(authorId: string, params: QuoteListParams): Promise<Quote[]> {
    return this.db.quote.findMany({
      where: {
        authorId,
        deletedAt: null,
        ...(params.cursor !== undefined
          ? {
              OR: [
                { createdAt: { lt: params.cursor.createdAt } },
                { createdAt: params.cursor.createdAt, id: { lt: params.cursor.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: params.limit,
    });
  }

  listByTarget(targetType: QuoteTargetType, targetId: string): Promise<Quote[]> {
    return this.db.quote.findMany({
      where: { targetType, targetId, deletedAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  softDelete(id: string): Promise<Quote> {
    return this.db.quote.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  delete(id: string): Promise<Quote> {
    return this.db.quote.delete({ where: { id } });
  }
}
