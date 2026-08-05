import type { ConversationResponse, MessageResponse, UserPublicResponse } from '@gmrlog/types';
import { MESSAGE_BODY_MAX, messageBodySchema } from '@gmrlog/validators';
import { z } from 'zod';

export { MESSAGE_BODY_MAX };

export const messageComposerFormSchema = z
  .object({
    body: messageBodySchema,
  })
  .strict();

export type MessageComposerFormValues = z.infer<typeof messageComposerFormSchema>;

export type ListViewStatus = 'loading' | 'error' | 'empty' | 'ready';

export interface ListViewModel<T> {
  status: ListViewStatus;
  items: T[];
  error: unknown;
  isRefreshing: boolean;
}

export function resolveListView<T>(input: {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  items: T[];
  isRefreshing: boolean;
}): ListViewModel<T> {
  if (input.isPending && input.items.length === 0) {
    return { status: 'loading', items: [], error: null, isRefreshing: false };
  }
  if (input.isError && input.items.length === 0) {
    return {
      status: 'error',
      items: [],
      error: input.error,
      isRefreshing: input.isRefreshing,
    };
  }
  if (input.items.length === 0) {
    return {
      status: 'empty',
      items: [],
      error: null,
      isRefreshing: input.isRefreshing,
    };
  }
  return {
    status: 'ready',
    items: input.items,
    error: input.error,
    isRefreshing: input.isRefreshing,
  };
}

export function createIdempotencyKey(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

/** Other participants for display (excludes self when present). */
export function conversationPeers(
  conversation: ConversationResponse,
  selfId: string | null | undefined,
): UserPublicResponse[] {
  if (!selfId) {
    return conversation.participants;
  }
  const peers = conversation.participants.filter((p) => p.id !== selfId);
  return peers.length > 0 ? peers : conversation.participants;
}

export function conversationTitle(
  conversation: ConversationResponse,
  selfId: string | null | undefined,
): string {
  const peers = conversationPeers(conversation, selfId);
  if (peers.length === 0) {
    return 'Conversation';
  }
  if (peers.length === 1) {
    return peers[0]?.displayName ?? 'Conversation';
  }
  return peers.map((p) => p.displayName).join(', ');
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return (parts[0] ?? '?').slice(0, 2).toUpperCase();
  }
  return `${(parts[0] ?? '').slice(0, 1)}${(parts[1] ?? '').slice(0, 1)}`.toUpperCase();
}

export function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeActivity(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${String(minutes)}m`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${String(hours)}h`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${String(days)}d`;
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export interface MessageBubbleModel {
  message: MessageResponse;
  isMine: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  isOptimistic: boolean;
}

/** Group consecutive same-sender messages for bubble chrome. */
export function buildMessageBubbles(
  messages: readonly MessageResponse[],
  selfId: string | null | undefined,
): MessageBubbleModel[] {
  return messages.map((message, index) => {
    const prev = index > 0 ? messages[index - 1] : undefined;
    const next = index < messages.length - 1 ? messages[index + 1] : undefined;
    const isMine = selfId !== undefined && selfId !== null && message.senderId === selfId;
    const showAvatar = prev?.senderId !== message.senderId;
    const showTimestamp = next?.senderId !== message.senderId;
    return {
      message,
      isMine,
      showAvatar,
      showTimestamp,
      isOptimistic: message.id.startsWith('optimistic_'),
    };
  });
}

/**
 * §11's search field filters the already-loaded inbox — there is no
 * `GET /conversations?q=` on the backend, and this recomposition is layout
 * only. Matches peer names first (what someone actually searches an inbox
 * by), falling back to the last message body.
 */
export function filterConversations(
  conversations: readonly ConversationResponse[],
  query: string,
  selfId: string | null | undefined,
): ConversationResponse[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) {
    return [...conversations];
  }
  return conversations.filter((conversation) => {
    const title = conversationTitle(conversation, selfId).toLowerCase();
    const preview = conversation.lastMessage?.body.toLowerCase() ?? '';
    return title.includes(q) || preview.includes(q);
  });
}

/** Newest-first for inverted FlatList (visual bottom = newest). */
export function messagesForInvertedList(messages: readonly MessageResponse[]): MessageResponse[] {
  return [...messages].reverse();
}

export function createOptimisticMessage(body: string, senderId: string): MessageResponse {
  return {
    id: `optimistic_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    senderId,
    body,
    createdAt: new Date().toISOString(),
    media: null,
  };
}
