import type {
  Conversation,
  ConversationParticipant,
  ConversationParticipantRepository,
  ConversationRepository,
  Message,
  MessageRepository,
  Prisma,
  User,
} from '@gmrlog/database';

/**
 * In-memory repository fakes — test support only (build-excluded).
 */

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-gen-${idCounter.toString(36)}-${Date.now().toString(36)}`;
}

function connectId(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || !('connect' in value)) {
    return undefined;
  }
  const connect = (value as { connect?: { id?: string } }).connect;
  return typeof connect?.id === 'string' ? connect.id : undefined;
}

export function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'conversation-1',
    kind: 'direct',
    lastMessageAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function makeConversationParticipant(
  overrides: Partial<ConversationParticipant> = {},
): ConversationParticipant {
  return {
    id: 'participant-1',
    conversationId: 'conversation-1',
    userId: 'user-1',
    lastReadAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'message-1',
    conversationId: 'conversation-1',
    senderId: 'user-1',
    body: 'Hello',
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    handle: 'gamer',
    displayName: 'Gamer',
    bio: null,
    avatarKey: null,
    bannerKey: null,
    avatarBlurhash: null,
    avatarVariants: null,
    bannerBlurhash: null,
    bannerVariants: null,
    privacyId: null,
    creatorFeatured: false,
    accountKind: 'individual',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

export interface FakeConversationRepository extends ConversationRepository {
  rows: Map<string, Conversation>;
}

export function createFakeConversationRepository(
  seed: Conversation[] = [],
): FakeConversationRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));

  return {
    rows,
    create: (data: Prisma.ConversationCreateInput) => {
      const conversation = makeConversation({
        id: nextId('conversation'),
        kind: data.kind,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      rows.set(conversation.id, conversation);
      return Promise.resolve(conversation);
    },
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    listByParticipant: (userId) => {
      const participantRepo = participantRowsForUser.get(userId);
      if (!participantRepo) {
        return Promise.resolve([]);
      }
      const conversations = participantRepo
        .map((conversationId) => rows.get(conversationId))
        .filter((row): row is Conversation => row != null);
      return Promise.resolve(
        conversations.sort((a, b) => {
          const aTime = a.lastMessageAt?.getTime() ?? a.updatedAt.getTime();
          const bTime = b.lastMessageAt?.getTime() ?? b.updatedAt.getTime();
          if (aTime !== bTime) {
            return bTime - aTime;
          }
          if (a.updatedAt.getTime() !== b.updatedAt.getTime()) {
            return b.updatedAt.getTime() - a.updatedAt.getTime();
          }
          return b.id.localeCompare(a.id);
        }),
      );
    },
    touchLastMessage: (id, lastMessageAt) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`conversation ${id} not found`));
      }
      const next: Conversation = {
        ...current,
        lastMessageAt,
        updatedAt: new Date(),
      };
      rows.set(id, next);
      return Promise.resolve(next);
    },
  };
}

/** Links user → conversation ids for fake inbox listing. */
const participantRowsForUser = new Map<string, string[]>();

export function linkParticipantForInbox(userId: string, conversationId: string): void {
  const existing = participantRowsForUser.get(userId) ?? [];
  if (!existing.includes(conversationId)) {
    participantRowsForUser.set(userId, [...existing, conversationId]);
  }
}

export function resetMessagingFakeInboxIndex(): void {
  participantRowsForUser.clear();
  idCounter = 0;
}

export interface FakeConversationParticipantRepository extends ConversationParticipantRepository {
  rows: Map<string, ConversationParticipant>;
}

export function createFakeConversationParticipantRepository(
  seed: ConversationParticipant[] = [],
): FakeConversationParticipantRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));

  const findByConversationAndUser = (
    conversationId: string,
    userId: string,
  ): Promise<ConversationParticipant | null> =>
    Promise.resolve(
      [...rows.values()].find(
        (row) => row.conversationId === conversationId && row.userId === userId,
      ) ?? null,
    );

  return {
    rows,
    create: (data: Prisma.ConversationParticipantCreateInput) => {
      const conversationId = connectId(data.conversation);
      const userId = connectId(data.user);
      if (!conversationId || !userId) {
        return Promise.reject(new Error('conversation and user required'));
      }
      const participant = makeConversationParticipant({
        id: nextId('participant'),
        conversationId,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      rows.set(participant.id, participant);
      linkParticipantForInbox(userId, conversationId);
      return Promise.resolve(participant);
    },
    findByConversationAndUser,
    listByConversation: (conversationId) =>
      Promise.resolve(
        [...rows.values()]
          .filter((row) => row.conversationId === conversationId)
          .sort((a, b) => {
            const byTime = a.createdAt.getTime() - b.createdAt.getTime();
            return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
          }),
      ),
    updateLastReadAt: async (conversationId, userId, at) => {
      const existing = await findByConversationAndUser(conversationId, userId);
      if (!existing) {
        return null;
      }
      const next: ConversationParticipant = {
        ...existing,
        lastReadAt: at,
        updatedAt: new Date(),
      };
      rows.set(existing.id, next);
      return next;
    },
  };
}

export interface FakeMessageRepository extends MessageRepository {
  rows: Map<string, Message>;
}

export function createFakeMessageRepository(seed: Message[] = []): FakeMessageRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));

  const activeRows = (conversationId: string): Message[] =>
    [...rows.values()].filter(
      (row) => row.conversationId === conversationId && row.deletedAt == null,
    );

  return {
    rows,
    create: (data: Prisma.MessageCreateInput) => {
      const conversationId = connectId(data.conversation);
      const senderId = connectId(data.sender);
      if (!conversationId || !senderId) {
        return Promise.reject(new Error('conversation and sender required'));
      }
      const message = makeMessage({
        id: nextId('message'),
        conversationId,
        senderId,
        body: typeof data.body === 'string' ? data.body : '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      rows.set(message.id, message);
      return Promise.resolve(message);
    },
    findActiveById: (id) => {
      const row = rows.get(id);
      return Promise.resolve(row != null && row.deletedAt == null ? row : null);
    },
    listByConversation: (conversationId) =>
      Promise.resolve(
        activeRows(conversationId).sort((a, b) => {
          const byTime = a.createdAt.getTime() - b.createdAt.getTime();
          return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
        }),
      ),
    listByConversationCursor: (conversationId, params) => {
      let sorted = activeRows(conversationId).sort((a, b) => {
        const byTime = a.createdAt.getTime() - b.createdAt.getTime();
        return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
      });
      if (params.cursor !== undefined) {
        const cursor = params.cursor;
        sorted = sorted.filter((row) => {
          if (row.createdAt.getTime() > cursor.createdAt.getTime()) {
            return true;
          }
          return row.createdAt.getTime() === cursor.createdAt.getTime() && row.id > cursor.id;
        });
      }
      return Promise.resolve(sorted.slice(0, params.limit));
    },
    findLatestActiveByConversation: (conversationId) => {
      const sorted = activeRows(conversationId).sort((a, b) => {
        const byTime = b.createdAt.getTime() - a.createdAt.getTime();
        return byTime !== 0 ? byTime : b.id.localeCompare(a.id);
      });
      return Promise.resolve(sorted[0] ?? null);
    },
  };
}
