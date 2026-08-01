import type { PostBookmark, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

export interface PostBookmarkListCursor {
  createdAt: Date;
  id: string;
}

export interface PostBookmarkListParams {
  limit: number;
  cursor?: PostBookmarkListCursor;
}

/**
 * PostBookmark persistence (D3.24 · docs/07_SOCIAL/SOCIAL_ACTIONS.md).
 * Private per-user save; unique per (userId, postId). Never a public signal.
 */
export interface PostBookmarkRepository {
  create(data: Prisma.PostBookmarkCreateInput): Promise<PostBookmark>;
  findByUserAndPost(userId: string, postId: string): Promise<PostBookmark | null>;
  /** Newest → oldest bookmarks for a user. */
  listByUser(userId: string, params: PostBookmarkListParams): Promise<PostBookmark[]>;
  delete(id: string): Promise<PostBookmark>;
  deleteByUserAndPost(userId: string, postId: string): Promise<PostBookmark | null>;
}

export class PrismaPostBookmarkRepository implements PostBookmarkRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.PostBookmarkCreateInput): Promise<PostBookmark> {
    return this.db.postBookmark.create({ data });
  }

  findByUserAndPost(userId: string, postId: string): Promise<PostBookmark | null> {
    return this.db.postBookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });
  }

  listByUser(userId: string, params: PostBookmarkListParams): Promise<PostBookmark[]> {
    return this.db.postBookmark.findMany({
      where: {
        userId,
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

  delete(id: string): Promise<PostBookmark> {
    return this.db.postBookmark.delete({ where: { id } });
  }

  async deleteByUserAndPost(userId: string, postId: string): Promise<PostBookmark | null> {
    const existing = await this.findByUserAndPost(userId, postId);
    if (!existing) {
      return null;
    }
    return this.delete(existing.id);
  }
}
