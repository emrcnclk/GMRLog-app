import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  createFakeUserRepository,
  type FakeUserRepository,
} from '../users/testing/fake-repositories';

import { MessagingService } from './messaging.service';
import {
  createFakeConversationParticipantRepository,
  createFakeConversationRepository,
  createFakeMessageRepository,
  linkParticipantForInbox,
  makeConversation,
  makeConversationParticipant,
  makeMessage,
  makeUser,
  resetMessagingFakeInboxIndex,
  type FakeConversationParticipantRepository,
  type FakeConversationRepository,
  type FakeMessageRepository,
} from './testing/fake-repositories';

let conversations: FakeConversationRepository;
let participants: FakeConversationParticipantRepository;
let messages: FakeMessageRepository;
let users: FakeUserRepository;
let service: MessagingService;

beforeEach(() => {
  resetMessagingFakeInboxIndex();
  users = createFakeUserRepository([
    makeUser({ id: 'user-1', handle: 'gamer', displayName: 'Gamer' }),
    makeUser({ id: 'user-2', handle: 'other', displayName: 'Other' }),
    makeUser({ id: 'user-3', handle: 'third', displayName: 'Third' }),
  ]);
  conversations = createFakeConversationRepository([
    makeConversation({
      id: 'conversation-1',
      kind: 'direct',
      lastMessageAt: new Date('2026-01-02T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    }),
    makeConversation({
      id: 'conversation-2',
      kind: 'group',
      lastMessageAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    }),
  ]);
  participants = createFakeConversationParticipantRepository([
    makeConversationParticipant({
      id: 'participant-1',
      conversationId: 'conversation-1',
      userId: 'user-1',
    }),
    makeConversationParticipant({
      id: 'participant-2',
      conversationId: 'conversation-1',
      userId: 'user-2',
    }),
    makeConversationParticipant({
      id: 'participant-3',
      conversationId: 'conversation-2',
      userId: 'user-1',
    }),
    makeConversationParticipant({
      id: 'participant-4',
      conversationId: 'conversation-2',
      userId: 'user-3',
    }),
  ]);
  linkParticipantForInbox('user-1', 'conversation-1');
  linkParticipantForInbox('user-2', 'conversation-1');
  linkParticipantForInbox('user-1', 'conversation-2');
  linkParticipantForInbox('user-3', 'conversation-2');
  messages = createFakeMessageRepository([
    makeMessage({
      id: 'message-1',
      conversationId: 'conversation-1',
      senderId: 'user-1',
      body: 'Hi',
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
    }),
  ]);
  service = new MessagingService(conversations, participants, messages, users);
});

describe('MessagingService.listConversations', () => {
  it('lists inbox newest-first for the actor only', async () => {
    const inbox = await service.listConversations('user-1');
    expect(inbox.map((row) => row.id)).toEqual(['conversation-1', 'conversation-2']);
    expect(inbox[0]?.lastMessage?.body).toBe('Hi');
    expect(inbox[0]?.unreadCount).toBe(0);
  });

  it('does not leak conversations where the actor is not a participant', async () => {
    const inbox = await service.listConversations('user-2');
    expect(inbox.map((row) => row.id)).toEqual(['conversation-1']);
  });
});

describe('MessagingService.getConversation', () => {
  it('projects participants and lastMessage for members', async () => {
    const detail = await service.getConversation('conversation-1', 'user-1');
    expect(detail.participants.map((p) => p.id).sort()).toEqual(['user-1', 'user-2']);
    expect(detail.lastMessage).toMatchObject({ body: 'Hi', senderId: 'user-1' });
    expect(detail.unreadCount).toBe(0);
  });

  it('returns 404 for non-participants (fail-closed)', async () => {
    await expect(service.getConversation('conversation-1', 'user-3')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns 404 for unknown conversations', async () => {
    await expect(service.getConversation('missing', 'user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('MessagingService.createConversation', () => {
  it('creates a direct conversation with actor plus one participant', async () => {
    const created = await service.createConversation('user-1', { participantUserIds: ['user-3'] });
    expect(created.participants.map((p) => p.id).sort()).toEqual(['user-1', 'user-3']);
    expect(created.lastMessage).toBeNull();
    expect(created.unreadCount).toBe(0);
  });

  it('rejects self-only conversations', async () => {
    await expect(
      service.createConversation('user-1', { participantUserIds: ['user-1'] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns 404 when a participant user does not exist', async () => {
    await expect(
      service.createConversation('user-1', { participantUserIds: ['missing-user'] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('MessagingService.listMessages', () => {
  it('lists active messages oldest-first for participants and sets lastReadAt', async () => {
    messages.rows.set(
      'message-2',
      makeMessage({
        id: 'message-2',
        conversationId: 'conversation-1',
        senderId: 'user-2',
        body: 'Reply',
        createdAt: new Date('2026-01-03T00:00:00.000Z'),
      }),
    );
    const listed = await service.listMessages('conversation-1', 'user-2');
    expect(listed.items.map((row) => row.body)).toEqual(['Hi', 'Reply']);
    expect(listed.items[0]?.media).toBeNull();
    expect(listed.cursor.next).toBeNull();

    const membership = await participants.findByConversationAndUser('conversation-1', 'user-2');
    expect(membership?.lastReadAt).toBeInstanceOf(Date);
  });

  it('hides soft-deleted messages', async () => {
    const deleted = makeMessage({
      id: 'message-deleted',
      conversationId: 'conversation-1',
      senderId: 'user-2',
      body: 'Gone',
      deletedAt: new Date(),
    });
    messages.rows.set('message-deleted', deleted);
    const listed = await service.listMessages('conversation-1', 'user-1');
    expect(listed.items.some((row) => row.id === 'message-deleted')).toBe(false);
  });

  it('returns 404 for non-participants', async () => {
    await expect(service.listMessages('conversation-1', 'user-3')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('MessagingService.sendMessage', () => {
  it('creates a message and returns updated ConversationResponse', async () => {
    const updated = await service.sendMessage('conversation-1', 'user-2', { body: 'Reply' });
    expect(updated.lastMessage).toMatchObject({ body: 'Reply', senderId: 'user-2' });
    expect(messages.rows.size).toBe(2);
  });

  it('rejects mediaUploadIds with 400', async () => {
    await expect(
      service.sendMessage('conversation-1', 'user-1', {
        body: 'Photo',
        mediaUploadIds: ['upload-1'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns 404 for non-participants', async () => {
    await expect(
      service.sendMessage('conversation-1', 'user-3', { body: 'Nope' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('MessagingService unread counts (9.2)', () => {
  it('counts a message from someone else as unread when lastReadAt is null (never opened)', async () => {
    messages.rows.set(
      'message-2',
      makeMessage({
        id: 'message-2',
        conversationId: 'conversation-1',
        senderId: 'user-2',
        body: 'Hey there',
        createdAt: new Date('2026-01-03T00:00:00.000Z'),
      }),
    );
    const detail = await service.getConversation('conversation-1', 'user-1');
    expect(detail.unreadCount).toBe(1);
    const inbox = await service.listConversations('user-1');
    expect(inbox.find((row) => row.id === 'conversation-1')?.unreadCount).toBe(1);
  });

  it("never counts the viewer's own messages, even with a null lastReadAt", async () => {
    // Seeded message-1 is sent by user-1 (the viewer here) and lastReadAt starts null.
    const detail = await service.getConversation('conversation-1', 'user-1');
    expect(detail.unreadCount).toBe(0);
  });

  it('drops back to 0 once lastReadAt covers every message from the other participant', async () => {
    messages.rows.set(
      'message-2',
      makeMessage({
        id: 'message-2',
        conversationId: 'conversation-1',
        senderId: 'user-2',
        body: 'Hey there',
        createdAt: new Date('2026-01-03T00:00:00.000Z'),
      }),
    );
    await participants.updateLastReadAt(
      'conversation-1',
      'user-1',
      new Date('2026-01-03T00:00:00.000Z'),
    );
    const detail = await service.getConversation('conversation-1', 'user-1');
    expect(detail.unreadCount).toBe(0);
  });

  it('is viewer-relative in a multi-participant conversation, past lastReadAt only, excluding the viewer', async () => {
    // conversation-2: user-1 and user-3. user-1 last read between the two messages
    // below, so only the second (sent after) should count — and never the viewer's own.
    messages.rows.set(
      'message-before',
      makeMessage({
        id: 'message-before',
        conversationId: 'conversation-2',
        senderId: 'user-3',
        body: 'Before',
        createdAt: new Date('2026-01-05T00:00:00.000Z'),
      }),
    );
    await participants.updateLastReadAt(
      'conversation-2',
      'user-1',
      new Date('2026-01-05T12:00:00.000Z'),
    );
    messages.rows.set(
      'message-after',
      makeMessage({
        id: 'message-after',
        conversationId: 'conversation-2',
        senderId: 'user-3',
        body: 'After',
        createdAt: new Date('2026-01-06T00:00:00.000Z'),
      }),
    );
    messages.rows.set(
      'message-own',
      makeMessage({
        id: 'message-own',
        conversationId: 'conversation-2',
        senderId: 'user-1',
        body: 'My own reply',
        createdAt: new Date('2026-01-07T00:00:00.000Z'),
      }),
    );
    const viewerDetail = await service.getConversation('conversation-2', 'user-1');
    expect(viewerDetail.unreadCount).toBe(1);

    // user-3 never read anything (lastReadAt still null) and sent both non-own
    // messages themselves — only user-1's reply is unread from their side.
    const otherDetail = await service.getConversation('conversation-2', 'user-3');
    expect(otherDetail.unreadCount).toBe(1);
  });
});

describe('MessagingService.listMessages pagination', () => {
  it('paginates messages with cursors', async () => {
    for (let index = 3; index <= 4; index += 1) {
      messages.rows.set(
        `message-${index}`,
        makeMessage({
          id: `message-${index}`,
          conversationId: 'conversation-1',
          senderId: 'user-2',
          body: `Message ${index}`,
          createdAt: new Date(`2026-01-0${index}T00:00:00.000Z`),
        }),
      );
    }

    const page1 = await service.listMessages('conversation-1', 'user-1', { limit: 2 });
    expect(page1.items.length).toBe(2);
    expect(page1.hasMore).toBe(true);

    const page2 = await service.listMessages('conversation-1', 'user-1', {
      limit: 2,
      cursor: page1.cursor.next ?? undefined,
    });
    expect(page2.items.length).toBeGreaterThan(0);
  });
});
