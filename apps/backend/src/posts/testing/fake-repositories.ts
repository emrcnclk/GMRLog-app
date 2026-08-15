import type {
  Game,
  GameRepository,
  Poll,
  PollRepository,
  PollVote,
  PollVoteRepository,
  Post,
  PostBookmark,
  PostBookmarkRepository,
  PostRepository,
  Prisma,
  Repost,
  RepostRepository,
  User,
  UserRepository,
} from '@gmrlog/database';

import { GAME_CATALOG_DEFAULTS } from '../../games/game-catalog.defaults';

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

function isDisconnect(value: unknown): boolean {
  return typeof value === 'object' && value !== null && 'disconnect' in value;
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
    cardNumber: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

export function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 'game-1',
    title: 'Hollow Knight',
    slug: 'hollow-knight',
    coverKey: null,
    releaseDate: null,
    featured: false,
    popularity: 0,
    franchiseId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...GAME_CATALOG_DEFAULTS,
    ...overrides,
  };
}

export function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 'post-1',
    authorId: 'user-1',
    gameId: null,
    communityId: null,
    body: 'Hello culture',
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

export interface FakePostRepository extends PostRepository {
  rows: Map<string, Post>;
}

export function createFakePostRepository(seed: Post[] = []): FakePostRepository {
  const rows = new Map(seed.map((post) => [post.id, post]));
  const active = (): Post[] => [...rows.values()].filter((p) => p.deletedAt === null);
  return {
    rows,
    create: (data) => {
      const authorId = connectId(data.author);
      if (!authorId) {
        return Promise.reject(new Error('author required'));
      }
      const post = makePost({
        id: nextId('post'),
        authorId,
        gameId: connectId(data.game) ?? null,
        communityId: connectId(data.community) ?? null,
        body: data.body,
        visibility: data.visibility,
        postKind: data.postKind ?? 'text',
        containsSpoilers: data.containsSpoilers === true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });
      rows.set(post.id, post);
      return Promise.resolve(post);
    },
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findActiveById: (id) => {
      const post = rows.get(id);
      return Promise.resolve(post?.deletedAt === null ? post : null);
    },
    listByAuthor: (authorId) =>
      Promise.resolve(
        active()
          .filter((p) => p.authorId === authorId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      ),
    listByGame: (gameId) =>
      Promise.resolve(
        active()
          .filter((p) => p.gameId === gameId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      ),
    listByCommunity: (communityId) =>
      Promise.resolve(
        active()
          .filter((p) => p.communityId === communityId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      ),
    countByCommunityGroupedByAuthor: (communityId) => {
      const counts = new Map<string, number>();
      for (const post of active()) {
        if (post.communityId === communityId) {
          counts.set(post.authorId, (counts.get(post.authorId) ?? 0) + 1);
        }
      }
      return Promise.resolve(
        [...counts.entries()].map(([authorId, count]) => ({ authorId, count })),
      );
    },
    // 7.1 — communities' leaderboard.
    countByCommunityGroupedByAuthorAndKindSince: (communityId, since) => {
      const grouped = new Map<
        string,
        { authorId: string; postKind: Post['postKind']; count: number }
      >();
      for (const post of active()) {
        if (post.communityId !== communityId) continue;
        if (post.createdAt.getTime() < since.getTime()) continue;
        const key = `${post.authorId}:${post.postKind}`;
        const existing = grouped.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          grouped.set(key, { authorId: post.authorId, postKind: post.postKind, count: 1 });
        }
      }
      return Promise.resolve([...grouped.values()]);
    },
    findPinnedByAuthor: (authorId) =>
      Promise.resolve(active().find((p) => p.authorId === authorId && p.pinnedAt !== null) ?? null),
    update: (id, data: Prisma.PostUpdateInput) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`post ${id} not found`));
      }
      let gameId = current.gameId;
      if (data.game !== undefined) {
        if (isDisconnect(data.game)) {
          gameId = null;
        } else {
          gameId = connectId(data.game) ?? current.gameId;
        }
      }
      let communityId = current.communityId;
      if (data.community !== undefined) {
        if (isDisconnect(data.community)) {
          communityId = null;
        } else {
          communityId = connectId(data.community) ?? current.communityId;
        }
      }
      const next: Post = {
        ...current,
        body: typeof data.body === 'string' ? data.body : current.body,
        visibility:
          data.visibility === 'public' ||
          data.visibility === 'followers' ||
          data.visibility === 'private'
            ? data.visibility
            : current.visibility,
        gameId,
        communityId,
        pinnedAt:
          data.pinnedAt === null
            ? null
            : data.pinnedAt instanceof Date
              ? data.pinnedAt
              : current.pinnedAt,
        updatedAt: new Date(),
      };
      rows.set(id, next);
      return Promise.resolve(next);
    },
    softDelete: (id) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`post ${id} not found`));
      }
      const next: Post = { ...current, deletedAt: new Date(), updatedAt: new Date() };
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

export interface FakeRepostRepository extends RepostRepository {
  rows: Map<string, Repost>;
}

export function createFakeRepostRepository(seed: Repost[] = []): FakeRepostRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));
  return {
    rows,
    create: (data) => {
      const actorId = connectId(data.actor);
      const originalPostId = connectId(data.originalPost);
      if (!actorId || !originalPostId) {
        return Promise.reject(new Error('actor and originalPost required'));
      }
      const repost: Repost = {
        id: nextId('repost'),
        actorId,
        originalPostId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      rows.set(repost.id, repost);
      return Promise.resolve(repost);
    },
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findActiveByActorAndPost: (actorId, originalPostId) =>
      Promise.resolve(
        [...rows.values()].find(
          (row) =>
            row.actorId === actorId &&
            row.originalPostId === originalPostId &&
            row.deletedAt === null,
        ) ?? null,
      ),
    countByPost: (originalPostId) =>
      Promise.resolve(
        [...rows.values()].filter(
          (row) => row.originalPostId === originalPostId && row.deletedAt === null,
        ).length,
      ),
    softDelete: (id) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`repost ${id} not found`));
      }
      const next: Repost = { ...current, deletedAt: new Date(), updatedAt: new Date() };
      rows.set(id, next);
      return Promise.resolve(next);
    },
    delete: notSupported,
  };
}

export interface FakePollRepository extends PollRepository {
  rows: Map<string, Poll>;
}

export function createFakePollRepository(seed: Poll[] = []): FakePollRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));
  return {
    rows,
    create: (data) => {
      const postId = connectId(data.post);
      if (!postId) {
        return Promise.reject(new Error('post required'));
      }
      const poll: Poll = {
        id: nextId('poll'),
        postId,
        question: data.question,
        options: data.options as string[],
        endsAt: data.endsAt instanceof Date ? data.endsAt : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      rows.set(poll.id, poll);
      return Promise.resolve(poll);
    },
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findByPostId: (postId) =>
      Promise.resolve([...rows.values()].find((row) => row.postId === postId) ?? null),
    update: (id, data) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`poll ${id} not found`));
      }
      const updated: Poll = {
        ...current,
        endsAt: 'endsAt' in data ? ((data.endsAt as Date | null) ?? null) : current.endsAt,
        updatedAt: new Date(),
      };
      rows.set(id, updated);
      return Promise.resolve(updated);
    },
    delete: (id) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`poll ${id} not found`));
      }
      rows.delete(id);
      return Promise.resolve(current);
    },
  };
}

export interface FakePollVoteRepository extends PollVoteRepository {
  rows: Map<string, PollVote>;
}

export function createFakePollVoteRepository(seed: PollVote[] = []): FakePollVoteRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));
  return {
    rows,
    create: (data) => {
      const pollId = connectId(data.poll);
      const userId = connectId(data.user);
      if (!pollId || !userId) {
        return Promise.reject(new Error('poll and user required'));
      }
      const vote: PollVote = {
        id: nextId('poll-vote'),
        pollId,
        userId,
        optionIndex: data.optionIndex,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      rows.set(vote.id, vote);
      return Promise.resolve(vote);
    },
    findByPollAndUser: (pollId, userId) =>
      Promise.resolve(
        [...rows.values()].find((row) => row.pollId === pollId && row.userId === userId) ?? null,
      ),
    listByPoll: (pollId) =>
      Promise.resolve([...rows.values()].filter((row) => row.pollId === pollId)),
    countByOption: (pollId) => {
      const counts = new Map<number, number>();
      for (const row of rows.values()) {
        if (row.pollId === pollId) {
          counts.set(row.optionIndex, (counts.get(row.optionIndex) ?? 0) + 1);
        }
      }
      return Promise.resolve(counts);
    },
    delete: (id) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`poll vote ${id} not found`));
      }
      rows.delete(id);
      return Promise.resolve(current);
    },
  };
}

export interface FakePostBookmarkRepository extends PostBookmarkRepository {
  rows: Map<string, PostBookmark>;
}

export function createFakePostBookmarkRepository(
  seed: PostBookmark[] = [],
): FakePostBookmarkRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));
  return {
    rows,
    create: (data) => {
      const userId = connectId(data.user);
      const postId = connectId(data.post);
      if (!userId || !postId) {
        return Promise.reject(new Error('user and post required'));
      }
      const bookmark: PostBookmark = {
        id: nextId('bookmark'),
        userId,
        postId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      rows.set(bookmark.id, bookmark);
      return Promise.resolve(bookmark);
    },
    findByUserAndPost: (userId, postId) =>
      Promise.resolve(
        [...rows.values()].find((row) => row.userId === userId && row.postId === postId) ?? null,
      ),
    listByUser: (userId, params) => {
      let list = [...rows.values()]
        .filter((row) => row.userId === userId)
        .sort((a, b) => {
          const byTime = b.createdAt.getTime() - a.createdAt.getTime();
          return byTime !== 0 ? byTime : b.id.localeCompare(a.id);
        });
      if (params.cursor !== undefined) {
        const cursor = params.cursor;
        const cursorTime = cursor.createdAt.getTime();
        list = list.filter((row) => {
          const time = row.createdAt.getTime();
          return time < cursorTime || (time === cursorTime && row.id < cursor.id);
        });
      }
      return Promise.resolve(list.slice(0, params.limit));
    },
    delete: (id) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`bookmark ${id} not found`));
      }
      rows.delete(id);
      return Promise.resolve(current);
    },
    deleteByUserAndPost: (userId, postId) => {
      const existing = [...rows.values()].find(
        (row) => row.userId === userId && row.postId === postId,
      );
      if (!existing) {
        return Promise.resolve(null);
      }
      rows.delete(existing.id);
      return Promise.resolve(existing);
    },
  };
}

export interface FakeGameRepository extends GameRepository {
  rows: Map<string, Game>;
}

export function createFakeGameRepository(seed: Game[] = []): FakeGameRepository {
  const rows = new Map(seed.map((game) => [game.id, game]));
  return {
    rows,
    create: notSupported,
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    findDetailById: (id) => {
      const game = rows.get(id);
      if (game === undefined) {
        return Promise.resolve(null);
      }
      return Promise.resolve({
        game,
        platforms: [],
        ratingAverage: null,
        ratingCount: 0,
        libraryCount: 0,
      });
    },
    findManyByIds: (ids) =>
      Promise.resolve(ids.map((id) => rows.get(id)).filter((g): g is Game => g !== undefined)),
    findBySlug: notSupported,
    list: notSupported,
    update: notSupported,
    delete: notSupported,
  };
}
