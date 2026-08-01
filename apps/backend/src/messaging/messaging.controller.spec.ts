import type {
  ApiEnvelope,
  ApiErrorEnvelope,
  ConversationResponse,
  MessageResponse,
} from '@gmrlog/types';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AuthModule } from '../auth/auth.module';
import { TokenService } from '../auth/jwt/token.service';
import { AppConfigModule } from '../infrastructure/config/config.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { HttpInfrastructureModule } from '../infrastructure/http/http.module';
import { LoggerModule } from '../infrastructure/logging/logger.module';
import { createFakeUserRepository } from '../users/testing/fake-repositories';

import { MessagingModule } from './messaging.module';
import {
  CONVERSATION_PARTICIPANT_REPOSITORY,
  CONVERSATION_REPOSITORY,
  MESSAGE_REPOSITORY,
  MESSAGING_USER_REPOSITORY,
} from './messaging.tokens';
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
} from './testing/fake-repositories';

const conversations = createFakeConversationRepository([
  makeConversation({
    id: 'conversation-1',
    kind: 'direct',
    lastMessageAt: new Date('2026-01-02T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  }),
]);
const participants = createFakeConversationParticipantRepository([
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
]);
linkParticipantForInbox('user-1', 'conversation-1');
linkParticipantForInbox('user-2', 'conversation-1');
const messages = createFakeMessageRepository([
  makeMessage({
    id: 'message-1',
    conversationId: 'conversation-1',
    senderId: 'user-1',
    body: 'Hi',
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
  }),
]);
const users = createFakeUserRepository([
  makeUser({ id: 'user-1', handle: 'gamer', displayName: 'Gamer' }),
  makeUser({ id: 'user-2', handle: 'other', displayName: 'Other' }),
  makeUser({ id: 'user-3', handle: 'third', displayName: 'Third' }),
]);

let app: NestFastifyApplication;
let accessToken: string;
let outsiderToken: string;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppConfigModule, LoggerModule, HttpInfrastructureModule, AuthModule, MessagingModule],
  })
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(CONVERSATION_REPOSITORY)
    .useValue(conversations)
    .overrideProvider(CONVERSATION_PARTICIPANT_REPOSITORY)
    .useValue(participants)
    .overrideProvider(MESSAGE_REPOSITORY)
    .useValue(messages)
    .overrideProvider(MESSAGING_USER_REPOSITORY)
    .useValue(users)
    .compile();

  app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  const tokens = moduleRef.get(TokenService);
  accessToken = await tokens.signAccessToken('user-1');
  outsiderToken = await tokens.signAccessToken('user-3');
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  resetMessagingFakeInboxIndex();
  conversations.rows.clear();
  conversations.rows.set(
    'conversation-1',
    makeConversation({
      id: 'conversation-1',
      kind: 'direct',
      lastMessageAt: new Date('2026-01-02T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    }),
  );
  participants.rows.clear();
  participants.rows.set(
    'participant-1',
    makeConversationParticipant({
      id: 'participant-1',
      conversationId: 'conversation-1',
      userId: 'user-1',
    }),
  );
  participants.rows.set(
    'participant-2',
    makeConversationParticipant({
      id: 'participant-2',
      conversationId: 'conversation-1',
      userId: 'user-2',
    }),
  );
  linkParticipantForInbox('user-1', 'conversation-1');
  linkParticipantForInbox('user-2', 'conversation-1');
  messages.rows.clear();
  messages.rows.set(
    'message-1',
    makeMessage({
      id: 'message-1',
      conversationId: 'conversation-1',
      senderId: 'user-1',
      body: 'Hi',
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
    }),
  );
});

function authHeaders(token = accessToken): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

describe('GET /conversations', () => {
  it('rejects guests with authn 401', async () => {
    const response = await app.inject({ method: 'GET', url: '/conversations' });
    expect(response.statusCode).toBe(401);
    expect((JSON.parse(response.payload) as ApiErrorEnvelope).error.category).toBe('authn');
  });

  it('lists inbox inside the S1 envelope', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/conversations',
      headers: authHeaders(),
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<ConversationResponse[]>;
    expect(body.meta.requestId).toEqual(expect.any(String));
    expect(body.data[0]).toMatchObject({
      id: 'conversation-1',
      unreadCount: 0,
      lastMessage: { body: 'Hi' },
    });
  });
});

describe('POST /conversations', () => {
  it('starts a conversation with 201', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/conversations',
      headers: authHeaders(),
      payload: { participantUserIds: ['user-3'] },
    });
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload) as ApiEnvelope<ConversationResponse>;
    expect(body.data.participants.map((p) => p.id).sort()).toEqual(['user-1', 'user-3']);
    expect(body.data.lastMessage).toBeNull();
  });

  it('returns 400 for self-only participant list', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/conversations',
      headers: authHeaders(),
      payload: { participantUserIds: ['user-1'] },
    });
    expect(response.statusCode).toBe(400);
  });

  it('returns 404 for unknown participant', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/conversations',
      headers: authHeaders(),
      payload: { participantUserIds: ['missing-user'] },
    });
    expect(response.statusCode).toBe(404);
  });
});

describe('GET /conversations/{id}', () => {
  it('returns conversation for participants', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/conversations/conversation-1',
      headers: authHeaders(),
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<ConversationResponse>;
    expect(body.data.id).toBe('conversation-1');
  });

  it('returns 404 for non-participants', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/conversations/conversation-1',
      headers: authHeaders(outsiderToken),
    });
    expect(response.statusCode).toBe(404);
  });
});

describe('GET /conversations/{id}/messages', () => {
  it('lists messages oldest-first', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/conversations/conversation-1/messages',
      headers: authHeaders(),
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload) as ApiEnvelope<MessageResponse[]>;
    expect(body.data).toEqual([
      expect.objectContaining({ id: 'message-1', body: 'Hi', media: null }),
    ]);
    expect(body.meta.cursor?.next).toBeNull();
  });

  it('returns 404 for non-participants', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/conversations/conversation-1/messages',
      headers: authHeaders(outsiderToken),
    });
    expect(response.statusCode).toBe(404);
  });
});

describe('POST /conversations/{id}/messages', () => {
  it('sends a message and returns updated ConversationResponse', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/conversations/conversation-1/messages',
      headers: authHeaders(),
      payload: { body: 'Reply' },
    });
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload) as ApiEnvelope<ConversationResponse>;
    expect(body.data.lastMessage).toMatchObject({ body: 'Reply', senderId: 'user-1' });
  });

  it('rejects mediaUploadIds with 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/conversations/conversation-1/messages',
      headers: authHeaders(),
      payload: { body: 'Photo', mediaUploadIds: ['upload-1'] },
    });
    expect(response.statusCode).toBe(400);
  });

  it('returns 404 for non-participants', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/conversations/conversation-1/messages',
      headers: authHeaders(outsiderToken),
      payload: { body: 'Nope' },
    });
    expect(response.statusCode).toBe(404);
  });

  it('returns 400 for empty body validation', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/conversations/conversation-1/messages',
      headers: authHeaders(),
      payload: { body: '   ' },
    });
    expect(response.statusCode).toBe(400);
  });
});
