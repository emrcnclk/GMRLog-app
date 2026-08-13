import type {
  Comment,
  CommentHostType,
  CommentRepository,
  Post,
  PostRepository,
  Prisma,
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
    creatorFeatured: false,
    accountKind: 'individual',
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

export interface FakeCommentRepository extends CommentRepository {
  rows: Map<string, Comment>;
}

export function createFakeCommentRepository(seed: Comment[] = []): FakeCommentRepository {
  const rows = new Map(seed.map((comment) => [comment.id, comment]));
  const active = (): Comment[] => [...rows.values()].filter((c) => c.deletedAt === null);
  return {
    rows,
    create: (data) => {
      const authorId = connectId(data.author);
      if (!authorId) {
        return Promise.reject(new Error('author required'));
      }
      const parentCommentId = connectId(data.parent) ?? null;
      const comment = makeComment({
        id: nextId('comment'),
        authorId,
        hostType: data.hostType,
        hostId: data.hostId,
        parentCommentId,
        body: data.body,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });
      rows.set(comment.id, comment);
      return Promise.resolve(comment);
    },
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findActiveById: (id) => {
      const comment = rows.get(id);
      return Promise.resolve(comment?.deletedAt === null ? comment : null);
    },
    listByHost: (hostType: CommentHostType, hostId: string) =>
      Promise.resolve(
        active()
          .filter((c) => c.hostType === hostType && c.hostId === hostId)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      ),
    listReplies: (parentCommentId) =>
      Promise.resolve(
        active()
          .filter((c) => c.parentCommentId === parentCommentId)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      ),
    // 7.1 — communities' own leaderboard tests fake this repository directly
    // (communities/testing/fake-repositories.ts); nothing in this domain's
    // suites exercises it.
    countByHostsGroupedByAuthorSince: notSupported,
    update: (id, data: Prisma.CommentUpdateInput) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`comment ${id} not found`));
      }
      const next: Comment = {
        ...current,
        body: typeof data.body === 'string' ? data.body : current.body,
        updatedAt: new Date(),
      };
      rows.set(id, next);
      return Promise.resolve(next);
    },
    softDelete: (id) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`comment ${id} not found`));
      }
      const next: Comment = { ...current, deletedAt: new Date(), updatedAt: new Date() };
      rows.set(id, next);
      return Promise.resolve(next);
    },
    delete: notSupported,
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
    // 7.1 — same as countByHostsGroupedByAuthorSince above.
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
