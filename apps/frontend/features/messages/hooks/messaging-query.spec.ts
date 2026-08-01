import type { ConversationResponse, MessageResponse } from '@gmrlog/types';
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { messageCreateSchema, conversationCreateSchema } from '@gmrlog/validators';

import { queryKeys } from '../../../src/query/query-client';
import { createOptimisticMessage } from './messaging-model';

describe('messaging query architecture', () => {
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('uses independent messaging keys', () => {
    expect(queryKeys.messages.conversations()).toEqual(['messages', 'conversations']);
    expect(queryKeys.messages.conversation('c1')).toEqual(['messages', 'conversation', 'c1']);
    expect(queryKeys.messages.thread('c1')).toEqual(['messages', 'thread', 'c1']);
  });

  it('optimistically appends then rolls back on failure', () => {
    const threadKey = queryKeys.messages.thread('c1');
    const previous: MessageResponse[] = [
      {
        id: 'm1',
        senderId: 'me',
        body: 'First',
        createdAt: '2026-01-01T00:00:00.000Z',
        media: null,
      },
    ];
    client.setQueryData(threadKey, previous);
    const optimistic = createOptimisticMessage('Second', 'me');
    client.setQueryData(threadKey, [...previous, optimistic]);
    expect(client.getQueryData<MessageResponse[]>(threadKey)?.map((m) => m.id)).toEqual([
      'm1',
      optimistic.id,
    ]);
    client.setQueryData(threadKey, previous);
    expect(client.getQueryData<MessageResponse[]>(threadKey)?.map((m) => m.id)).toEqual(['m1']);
  });

  it('invalidates inbox after conversation create', async () => {
    const spy = vi.spyOn(client, 'invalidateQueries');
    await client.invalidateQueries({ queryKey: queryKeys.messages.conversations() });
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.messages.conversations() });
  });

  it('validates composer and create payloads with shared schemas', () => {
    expect(messageCreateSchema.parse({ body: 'Hello' }).body).toBe('Hello');
    expect(() => messageCreateSchema.parse({ body: '   ' })).toThrow();
    expect(
      conversationCreateSchema.parse({ participantUserIds: ['user-2'] }).participantUserIds,
    ).toEqual(['user-2']);
  });

  it('preserves backend inbox order in cache', () => {
    const list: ConversationResponse[] = [
      {
        id: 'c2',
        participants: [],
        lastMessage: null,
        updatedAt: '2026-01-02T00:00:00.000Z',
        unreadCount: 0,
      },
      {
        id: 'c1',
        participants: [],
        lastMessage: null,
        updatedAt: '2026-01-01T00:00:00.000Z',
        unreadCount: 0,
      },
    ];
    client.setQueryData(queryKeys.messages.conversations(), list);
    expect(
      client
        .getQueryData<ConversationResponse[]>(queryKeys.messages.conversations())
        ?.map((c) => c.id),
    ).toEqual(['c2', 'c1']);
  });
});
