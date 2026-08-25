import type { Notification, Prisma } from '@prisma/client';

import { withTransaction, type DatabaseClient } from './types';

export interface NotificationListCursor {
  createdAt: Date;
  id: string;
}

export interface NotificationListParams {
  limit: number;
  cursor?: NotificationListCursor;
  from?: Date;
  to?: Date;
}

/**
 * Notification persistence (S2 §10.9). Recipient-owned. Persistence only.
 *
 * Product `kind` strings (D3.21–D3.24 — not a Prisma enum; documented here as SSOT):
 * - `friend_request` · `friend_accepted`
 * - `achievement_unlocked`
 * - `comment` · `reply` · `like`
 * - `collection_follow`
 * - `community_activity` · `community_wiki` · `community_role` · `community_badge` · `community_invite`
 * - `tier_list_interaction` · `review_interaction`
 * - D3.24: `mention` · `quote` · `repost` · `event_invite` · `event_lfg` · `post_pinned`
 * - D3.24: `reputation_awarded` · `creator_featured`
 */
export interface NotificationRepository {
  create(data: Prisma.NotificationCreateInput): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  /** Newest → oldest. Returns up to `limit` rows (caller may fetch limit+1 for hasMore). */
  listByUser(recipientId: string, params: NotificationListParams): Promise<Notification[]>;
  /** Sets `readAt` only when currently unread — preserves existing timestamps. */
  markRead(id: string): Promise<Notification | null>;
  /** Marks all unread for recipient. Returns count updated. */
  markAllRead(recipientId: string): Promise<number>;
  /** Marks unread rows among `ids` for recipient. Returns count updated. */
  markManyRead(recipientId: string, ids: readonly string[]): Promise<number>;
  /** Deletes read notifications with `readAt` strictly before `cutoff`. Returns count deleted. */
  deleteReadOlderThan(cutoff: Date): Promise<number>;
  delete(id: string): Promise<Notification>;
}

export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.NotificationCreateInput): Promise<Notification> {
    return this.db.notification.create({ data });
  }

  findById(id: string): Promise<Notification | null> {
    return this.db.notification.findUnique({ where: { id } });
  }

  listByUser(recipientId: string, params: NotificationListParams): Promise<Notification[]> {
    const createdAtFilter: Prisma.DateTimeFilter = {};
    if (params.from !== undefined) {
      createdAtFilter.gte = params.from;
    }
    if (params.to !== undefined) {
      createdAtFilter.lte = params.to;
    }
    if (params.cursor !== undefined) {
      // Keyset: (createdAt, id) strictly older than cursor for desc order.
      return this.db.notification.findMany({
        where: {
          recipientId,
          ...(Object.keys(createdAtFilter).length > 0 ? { createdAt: createdAtFilter } : {}),
          OR: [
            { createdAt: { lt: params.cursor.createdAt } },
            {
              createdAt: params.cursor.createdAt,
              id: { lt: params.cursor.id },
            },
          ],
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: params.limit,
      });
    }
    return this.db.notification.findMany({
      where: {
        recipientId,
        ...(Object.keys(createdAtFilter).length > 0 ? { createdAt: createdAtFilter } : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: params.limit,
    });
  }

  async markRead(id: string): Promise<Notification | null> {
    await this.db.notification.updateMany({
      where: { id, readAt: null },
      data: { readAt: new Date() },
    });
    return this.findById(id);
  }

  async markAllRead(recipientId: string): Promise<number> {
    const result = await this.db.notification.updateMany({
      where: { recipientId, readAt: null },
      data: { readAt: new Date() },
    });
    return result.count;
  }

  async markManyRead(recipientId: string, ids: readonly string[]): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }
    const result = await withTransaction(this.db, async (tx) => {
      return tx.notification.updateMany({
        where: { recipientId, id: { in: [...ids] }, readAt: null },
        data: { readAt: new Date() },
      });
    });
    return result.count;
  }

  async deleteReadOlderThan(cutoff: Date): Promise<number> {
    const result = await this.db.notification.deleteMany({
      where: {
        readAt: { not: null, lt: cutoff },
      },
    });
    return result.count;
  }

  delete(id: string): Promise<Notification> {
    return this.db.notification.delete({ where: { id } });
  }
}
