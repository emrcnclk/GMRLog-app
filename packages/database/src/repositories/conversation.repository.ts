import type { Conversation, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * Conversation persistence (S2 §10.7). Persistence only.
 */
export interface ConversationRepository {
  create(data: Prisma.ConversationCreateInput): Promise<Conversation>;
  findById(id: string): Promise<Conversation | null>;
  /** Inbox order: most recently active first. */
  listByParticipant(userId: string): Promise<Conversation[]>;
  touchLastMessage(id: string, lastMessageAt: Date): Promise<Conversation>;
}

export class PrismaConversationRepository implements ConversationRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.ConversationCreateInput): Promise<Conversation> {
    return this.db.conversation.create({ data });
  }

  findById(id: string): Promise<Conversation | null> {
    return this.db.conversation.findUnique({ where: { id } });
  }

  listByParticipant(userId: string): Promise<Conversation[]> {
    return this.db.conversation.findMany({
      where: { participants: { some: { userId } } },
      orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }, { id: 'desc' }],
    });
  }

  touchLastMessage(id: string, lastMessageAt: Date): Promise<Conversation> {
    return this.db.conversation.update({
      where: { id },
      data: { lastMessageAt },
    });
  }
}
