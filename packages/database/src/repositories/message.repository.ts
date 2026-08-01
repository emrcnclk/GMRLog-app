import type { Message, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

/** Keyset cursor for message lists (`createdAt` + `id`), ascending pages. */
export interface MessageListCursor {
  createdAt: Date;
  id: string;
}

export interface MessageListParams {
  limit: number;
  cursor?: MessageListCursor;
}

/**
 * Message persistence (S2 §10.7). Soft-deletable rows (`deletedAt`).
 * Lists active messages oldest → newest.
 */
export interface MessageRepository {
  create(data: Prisma.MessageCreateInput): Promise<Message>;
  findActiveById(id: string): Promise<Message | null>;
  listByConversation(conversationId: string): Promise<Message[]>;
  /** Oldest → newest page. Returns up to `limit` rows (caller may fetch limit+1 for hasMore). */
  listByConversationCursor(conversationId: string, params: MessageListParams): Promise<Message[]>;
  findLatestActiveByConversation(conversationId: string): Promise<Message | null>;
}

export class PrismaMessageRepository implements MessageRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.MessageCreateInput): Promise<Message> {
    return this.db.message.create({ data });
  }

  findActiveById(id: string): Promise<Message | null> {
    return this.db.message.findFirst({ where: { id, deletedAt: null } });
  }

  listByConversation(conversationId: string): Promise<Message[]> {
    return this.db.message.findMany({
      where: { conversationId, deletedAt: null },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  listByConversationCursor(conversationId: string, params: MessageListParams): Promise<Message[]> {
    if (params.cursor !== undefined) {
      // Keyset: (createdAt, id) strictly newer than cursor for asc order.
      return this.db.message.findMany({
        where: {
          conversationId,
          deletedAt: null,
          OR: [
            { createdAt: { gt: params.cursor.createdAt } },
            {
              createdAt: params.cursor.createdAt,
              id: { gt: params.cursor.id },
            },
          ],
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: params.limit,
      });
    }
    return this.db.message.findMany({
      where: { conversationId, deletedAt: null },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: params.limit,
    });
  }

  findLatestActiveByConversation(conversationId: string): Promise<Message | null> {
    return this.db.message.findFirst({
      where: { conversationId, deletedAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }
}
