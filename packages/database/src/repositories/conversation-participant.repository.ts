import type { ConversationParticipant, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * Conversation participant persistence (S2 §10.7). Persistence only.
 */
export interface ConversationParticipantRepository {
  create(data: Prisma.ConversationParticipantCreateInput): Promise<ConversationParticipant>;
  findByConversationAndUser(
    conversationId: string,
    userId: string,
  ): Promise<ConversationParticipant | null>;
  listByConversation(conversationId: string): Promise<ConversationParticipant[]>;
  updateLastReadAt(
    conversationId: string,
    userId: string,
    at: Date,
  ): Promise<ConversationParticipant | null>;
}

export class PrismaConversationParticipantRepository implements ConversationParticipantRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.ConversationParticipantCreateInput): Promise<ConversationParticipant> {
    return this.db.conversationParticipant.create({ data });
  }

  findByConversationAndUser(
    conversationId: string,
    userId: string,
  ): Promise<ConversationParticipant | null> {
    return this.db.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
  }

  listByConversation(conversationId: string): Promise<ConversationParticipant[]> {
    return this.db.conversationParticipant.findMany({
      where: { conversationId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  async updateLastReadAt(
    conversationId: string,
    userId: string,
    at: Date,
  ): Promise<ConversationParticipant | null> {
    const result = await this.db.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: at },
    });
    if (result.count === 0) {
      return null;
    }
    return this.findByConversationAndUser(conversationId, userId);
  }
}
