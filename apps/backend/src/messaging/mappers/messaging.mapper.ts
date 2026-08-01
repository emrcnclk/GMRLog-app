import type { Conversation, Message, User } from '@gmrlog/database';
import type {
  ConversationResponse,
  MessageResponse,
  MessageSummary,
  UserPublicResponse,
} from '@gmrlog/types';

import { resolveMediaUrl } from '../../infrastructure/media/resolve-media-url';
export { resolveMediaUrl };
export function toUserPublicResponse(user: User): UserPublicResponse {
  return {
    id: user.id,
    handle: user.handle,
    displayName: user.displayName,
    avatarUrl: resolveMediaUrl(user.avatarKey),
  };
}
export function toMessageSummary(message: Message): MessageSummary {
  return {
    id: message.id,
    senderId: message.senderId,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
  };
}
export function toMessageResponse(message: Message): MessageResponse {
  return {
    id: message.id,
    senderId: message.senderId,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    media: null,
  };
}
export function toConversationResponse(
  conversation: Conversation,
  participants: UserPublicResponse[],
  lastMessage: MessageSummary | null,
): ConversationResponse {
  return {
    id: conversation.id,
    participants,
    lastMessage,
    updatedAt: conversation.updatedAt.toISOString(),
    unreadCount: 0,
  };
}
