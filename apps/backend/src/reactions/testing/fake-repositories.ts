import type {
  Comment,
  CommentRepository,
  Post,
  PostRepository,
  Reaction,
  ReactionRepository,
  ReactionTargetType,
  Review,
  ReviewRepository,
  User,
  UserRepository,
} from '@gmrlog/database';

/**
 * In-memory repository fakes — test support only (build-excluded).
 */

const notSupported = (): never => {
  throw new Error('not supported by this fake');
};

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${String(idCounter)}`;
}

function connectId(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || !('connect' in value)) {
    return undefined;
  }
  const connect = (value as { connect?: { id?: string } }).connect;
  return typeof connect?.id === 'string' ? connect.id : undefined;
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
    firstName: null,
    lastName: null,
    birthDate: null,
    countryCode: null,
    creatorFeatured: false,
    accountKind: 'individual',
    cardNumber: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

export function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 'post-1',
    authorId: 'user-1',
    gameId: null,
    communityId: null,
    body: 'Hello',
    visibility: 'public',
    postKind: 'text' as const,
    containsSpoilers: false,
    pinnedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

export function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 'review-1',
    authorId: 'user-1',
    gameId: 'game-1',
    rating: 8,
    body: 'Great',
    containsSpoilers: false,
    visibility: 'public',
    version: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

export function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 'comment-1',
    authorId: 'user-1',
    hostType: 'review',
    hostId: 'review-1',
    parentCommentId: null,
    body: 'Nice take',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

export function makeReaction(overrides: Partial<Reaction> = {}): Reaction {
  return {
    id: 'reaction-1',
    actorId: 'user-1',
    targetType: 'review',
    targetId: 'review-1',
    kind: 'like',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export interface FakeReactionRepository extends ReactionRepository {
  rows: Map<string, Reaction>;
}

export function createFakeReactionRepository(seed: Reaction[] = []): FakeReactionRepository {
  const rows = new Map(seed.map((reaction) => [reaction.id, reaction]));
  return {
    rows,
    create: (data) => {
      const actorId = connectId(data.actor);
      if (!actorId) {
        return Promise.reject(new Error('actor required'));
      }
      const reaction = makeReaction({
        id: nextId('reaction'),
        actorId,
        targetType: data.targetType,
        targetId: data.targetId,
        kind: data.kind,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const collision = [...rows.values()].find(
        (row) =>
          row.actorId === reaction.actorId &&
          row.targetType === reaction.targetType &&
          row.targetId === reaction.targetId &&
          row.kind === reaction.kind,
      );
      if (collision) {
        return Promise.reject(new Error('unique constraint violated'));
      }
      rows.set(reaction.id, reaction);
      return Promise.resolve(reaction);
    },
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findByActorAndTarget: (
      actorId: string,
      targetType: ReactionTargetType,
      targetId: string,
      kind: string,
    ) =>
      Promise.resolve(
        [...rows.values()].find(
          (row) =>
            row.actorId === actorId &&
            row.targetType === targetType &&
            row.targetId === targetId &&
            row.kind === kind,
        ) ?? null,
      ),
    listByTarget: (targetType: ReactionTargetType, targetId: string) =>
      Promise.resolve(
        [...rows.values()]
          .filter((row) => row.targetType === targetType && row.targetId === targetId)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      ),
    delete: (id) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`reaction ${id} not found`));
      }
      rows.delete(id);
      return Promise.resolve(current);
    },
  };
}

export interface FakeUserRepository extends UserRepository {
  rows: Map<string, User>;
}

export function createFakeUserRepository(seed: User[] = []): FakeUserRepository {
  const rows = new Map(seed.map((user) => [user.id, user]));
  return {
    rows,
    create: notSupported,
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findManyByIds: (ids) =>
      Promise.resolve(ids.map((id) => rows.get(id)).filter((u): u is User => u !== undefined)),
    findByHandle: notSupported,
    update: notSupported,
    softDelete: notSupported,
    delete: notSupported,
  };
}

export interface FakePostRepository extends PostRepository {
  rows: Map<string, Post>;
}

export function createFakePostRepository(seed: Post[] = []): FakePostRepository {
  const rows = new Map(seed.map((post) => [post.id, post]));
  return {
    rows,
    create: notSupported,
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findActiveById: (id) => {
      const post = rows.get(id);
      return Promise.resolve(post?.deletedAt === null ? post : null);
    },
    listByAuthor: notSupported,
    listByGame: notSupported,
    listByCommunity: notSupported,
    countByCommunityGroupedByAuthor: () => Promise.resolve([]),
    // 7.1 — communities' own leaderboard tests fake this repository directly.
    countByCommunityGroupedByAuthorAndKindSince: notSupported,
    findPinnedByAuthor: () => Promise.resolve(null),
    update: notSupported,
    softDelete: notSupported,
    delete: notSupported,
  };
}

export interface FakeReviewRepository extends ReviewRepository {
  rows: Map<string, Review>;
}

export function createFakeReviewRepository(seed: Review[] = []): FakeReviewRepository {
  const rows = new Map(seed.map((review) => [review.id, review]));
  return {
    rows,
    create: notSupported,
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findActiveById: (id) => {
      const review = rows.get(id);
      return Promise.resolve(review?.deletedAt === null ? review : null);
    },
    findActiveByAuthorAndGame: notSupported,
    listByGame: notSupported,
    countByGame: () => Promise.resolve(0),
    listByAuthor: notSupported,
    update: notSupported,
    softDelete: notSupported,
    delete: notSupported,
  };
}

export interface FakeCommentRepository extends CommentRepository {
  rows: Map<string, Comment>;
}

export function createFakeCommentRepository(seed: Comment[] = []): FakeCommentRepository {
  const rows = new Map(seed.map((comment) => [comment.id, comment]));
  return {
    rows,
    create: notSupported,
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findActiveById: (id) => {
      const comment = rows.get(id);
      return Promise.resolve(comment?.deletedAt === null ? comment : null);
    },
    listByHost: () => Promise.resolve([]),
    listReplies: notSupported,
    // 7.1 — communities' own leaderboard tests fake this repository directly.
    countByHostsGroupedByAuthorSince: notSupported,
    update: notSupported,
    softDelete: notSupported,
    delete: notSupported,
  };
}
