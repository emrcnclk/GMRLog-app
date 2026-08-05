import type { MessageResponse } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import {
  buildMessageBubbles,
  conversationTitle,
  createOptimisticMessage,
  filterConversations,
  formatRelativeActivity,
  messagesForInvertedList,
  resolveListView,
} from './messaging-model';

const conversation = {
  id: 'c1',
  participants: [
    { id: 'me', handle: 'me', displayName: 'Me', avatarUrl: null },
    { id: 'you', handle: 'you', displayName: 'You', avatarUrl: null },
  ],
  lastMessage: null,
  updatedAt: '2026-01-01T00:00:00.000Z',
  unreadCount: 0,
};

describe('messaging model', () => {
  it('titles direct conversations with peer name', () => {
    expect(conversationTitle(conversation, 'me')).toBe('You');
  });

  it('groups consecutive bubbles', () => {
    const messages: MessageResponse[] = [
      {
        id: '1',
        senderId: 'you',
        body: 'Hi',
        createdAt: '2026-01-01T00:00:00.000Z',
        media: null,
      },
      {
        id: '2',
        senderId: 'you',
        body: 'Again',
        createdAt: '2026-01-01T00:01:00.000Z',
        media: null,
      },
      {
        id: '3',
        senderId: 'me',
        body: 'Hello',
        createdAt: '2026-01-01T00:02:00.000Z',
        media: null,
      },
    ];
    const bubbles = buildMessageBubbles(messages, 'me');
    expect(bubbles[0]?.showAvatar).toBe(true);
    expect(bubbles[1]?.showAvatar).toBe(false);
    expect(bubbles[1]?.showTimestamp).toBe(true);
    expect(bubbles[2]?.isMine).toBe(true);
  });

  it('reverses for inverted list newest-first', () => {
    const messages: MessageResponse[] = [
      {
        id: '1',
        senderId: 'a',
        body: 'old',
        createdAt: '2026-01-01T00:00:00.000Z',
        media: null,
      },
      {
        id: '2',
        senderId: 'a',
        body: 'new',
        createdAt: '2026-01-01T00:01:00.000Z',
        media: null,
      },
    ];
    expect(messagesForInvertedList(messages).map((m) => m.id)).toEqual(['2', '1']);
  });

  it('builds optimistic messages', () => {
    const optimistic = createOptimisticMessage('Hello', 'me');
    expect(optimistic.id.startsWith('optimistic_')).toBe(true);
    expect(optimistic.body).toBe('Hello');
    expect(optimistic.media).toBeNull();
  });

  it('resolves list loading empty ready', () => {
    expect(
      resolveListView({
        isPending: true,
        isError: false,
        error: null,
        items: [],
        isRefreshing: false,
      }).status,
    ).toBe('loading');
    expect(
      resolveListView({
        isPending: false,
        isError: false,
        error: null,
        items: [],
        isRefreshing: false,
      }).status,
    ).toBe('empty');
  });

  it('formats relative activity', () => {
    expect(formatRelativeActivity(new Date().toISOString())).toBe('Just now');
  });

  it('filters conversations by peer name or last message, case-insensitively', () => {
    const withMessage = {
      ...conversation,
      id: 'c2',
      lastMessage: {
        id: 'm1',
        senderId: 'you',
        body: 'Anyone up for co-op tonight?',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    };
    const all = [conversation, withMessage];
    expect(filterConversations(all, '', 'me').map((c) => c.id)).toEqual(['c1', 'c2']);
    expect(filterConversations(all, 'YOU', 'me').map((c) => c.id)).toEqual(['c1', 'c2']);
    expect(filterConversations(all, 'co-op', 'me').map((c) => c.id)).toEqual(['c2']);
    expect(filterConversations(all, 'nothing matches this', 'me')).toEqual([]);
  });
});
