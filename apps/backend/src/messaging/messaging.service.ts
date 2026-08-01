import type {
  Conversation,
  ConversationParticipantRepository,
  ConversationRepository,
  MessageListCursor,
  MessageRepository,
  User,
  UserRepository,
} from '@gmrlog/database';
import type { ConversationResponse, MessageResponse } from '@gmrlog/types';
import type {
  ConversationCreateInput,
  MessageCreateInput,
  MessageListQueryInput,
} from '@gmrlog/validators';
import { MESSAGE_LIST_DEFAULT_LIMIT } from '@gmrlog/validators';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PaginatedPayload } from '../infrastructure/http/paginated-payload';

import {
  toConversationResponse,
  toMessageResponse,
  toMessageSummary,
  toUserPublicResponse,
} from './mappers/messaging.mapper';
import {
  CONVERSATION_PARTICIPANT_REPOSITORY,
  CONVERSATION_REPOSITORY,
  MESSAGE_REPOSITORY,
  MESSAGING_USER_REPOSITORY,
} from './messaging.tokens';
/**
 * Messaging domain service (F6.3 / D2.13). Participant-only inbox Â· send Â· read.
 * No websocket Â· realtime Â· notifications Â· typing Â· attachments.
 */
@Injectable()
export class MessagingService {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: ConversationRepository,
    @Inject(CONVERSATION_PARTICIPANT_REPOSITORY)
    private readonly participants: ConversationParticipantRepository,
    @Inject(MESSAGE_REPOSITORY) private readonly messages: MessageRepository,
    @Inject(MESSAGING_USER_REPOSITORY) private readonly users: UserRepository,
  ) {}
  async listConversations(actorId: string): Promise<ConversationResponse[]> {
    await this.requireActiveUser(actorId);
    const rows = await this.conversations.listByParticipant(actorId);
    return Promise.all(rows.map((row) => this.projectConversation(row)));
  }
  async getConversation(conversationId: string, actorId: string): Promise<ConversationResponse> {
    const conversation = await this.requireParticipantConversation(conversationId, actorId);
    return this.projectConversation(conversation);
  }
  async createConversation(
    actorId: string,
    input: ConversationCreateInput,
  ): Promise<ConversationResponse> {
    await this.requireActiveUser(actorId);
    const participantIds = uniqueIds([actorId, ...input.participantUserIds]);
    if (participantIds.length < 2) {
      throw new BadRequestException('Conversation requires at least two participants');
    }
    for (const userId of participantIds) {
      if (userId !== actorId) {
        await this.requireActiveUser(userId);
      }
    }
    const kind = participantIds.length === 2 ? 'direct' : 'group';
    const conversation = await this.conversations.create({ kind });
    for (const userId of participantIds) {
      await this.participants.create({
        conversation: { connect: { id: conversation.id } },
        user: { connect: { id: userId } },
      });
    }
    return this.projectConversation(conversation);
  }
  async listMessages(
    conversationId: string,
    actorId: string,
    query: MessageListQueryInput = {},
  ): Promise<PaginatedPayload<MessageResponse>> {
    await this.requireParticipantConversation(conversationId, actorId);
    const limit = query.limit ?? MESSAGE_LIST_DEFAULT_LIMIT;
    const cursor = query.cursor !== undefined ? decodeCursor(query.cursor) : undefined;
    const rows = await this.messages.listByConversationCursor(conversationId, {
      limit: limit + 1,
      ...(cursor !== undefined ? { cursor } : {}),
    });
    await this.participants.updateLastReadAt(conversationId, actorId, new Date());
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const next =
      hasMore && last !== undefined
        ? encodeCursor({ createdAt: last.createdAt, id: last.id })
        : null;
    return new PaginatedPayload(page.map(toMessageResponse), { next }, hasMore, limit);
  }
  async sendMessage(
    conversationId: string,
    actorId: string,
    input: MessageCreateInput,
  ): Promise<ConversationResponse> {
    if (input.mediaUploadIds != null && input.mediaUploadIds.length > 0) {
      throw new BadRequestException('Message media is not supported yet');
    }
    const conversation = await this.requireParticipantConversation(conversationId, actorId);
    await this.requireActiveUser(actorId);
    const message = await this.messages.create({
      conversation: { connect: { id: conversationId } },
      sender: { connect: { id: actorId } },
      body: input.body,
    });
    const touched = await this.conversations.touchLastMessage(conversation.id, message.createdAt);
    return this.projectConversation(touched);
  }
  private async projectConversation(conversation: Conversation): Promise<ConversationResponse> {
    const participantRows = await this.participants.listByConversation(conversation.id);
    const loaded = await this.users.findManyByIds(participantRows.map((row) => row.userId));
    const byId = new Map(loaded.map((user) => [user.id, user]));
    const participants = participantRows.flatMap((row) => {
      const user = byId.get(row.userId);
      if (user == null || user.deletedAt != null) {
        return [];
      }
      return [toUserPublicResponse(user)];
    });
    const latest = await this.messages.findLatestActiveByConversation(conversation.id);
    const lastMessage = latest ? toMessageSummary(latest) : null;
    return toConversationResponse(conversation, participants, lastMessage);
  }
  private async requireParticipantConversation(
    conversationId: string,
    actorId: string,
  ): Promise<Conversation> {
    const conversation = await this.conversations.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    const membership = await this.participants.findByConversationAndUser(conversationId, actorId);
    if (!membership) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }
  private async requireActiveUser(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (user == null || user.deletedAt != null) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}
function encodeCursor(cursor: MessageListCursor): string {
  const payload = `${cursor.createdAt.toISOString()}|${cursor.id}`;
  return Buffer.from(payload, 'utf8').toString('base64url');
}
function decodeCursor(raw: string): MessageListCursor {
  let decoded: string;
  try {
    decoded = Buffer.from(raw, 'base64url').toString('utf8');
  } catch {
    throw new BadRequestException('Invalid cursor');
  }
  const separator = decoded.indexOf('|');
  if (separator <= 0) {
    throw new BadRequestException('Invalid cursor');
  }
  const createdAtRaw = decoded.slice(0, separator);
  const id = decoded.slice(separator + 1);
  const createdAt = new Date(createdAtRaw);
  if (Number.isNaN(createdAt.getTime()) || id.length === 0) {
    throw new BadRequestException('Invalid cursor');
  }
  return { createdAt, id };
}
