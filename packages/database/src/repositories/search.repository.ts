import type {
  Collection,
  Community,
  Event,
  Game,
  Post,
  Prisma,
  Review,
  TierList,
  User,
} from '@prisma/client';

import type { DatabaseClient } from './types';

/** S1 §15.15 — closed search hit type vocabulary. */
export type SearchHitType =
  'game' | 'user' | 'review' | 'post' | 'collection' | 'tier-list' | 'community' | 'event';

export interface SearchListCursor {
  orderedAt: Date;
  type: SearchHitType;
  id: string;
}

export interface SearchListParams {
  query: string;
  limit: number;
  cursor?: SearchListCursor;
  viewerId: string | null;
}

export type SearchHitRecord =
  // D3.25 — `genres` is optional and Meilisearch-only: the direct Postgres
  // fallback path returns a bare `Game` row and leaves it undefined.
  | { type: 'game'; id: string; orderedAt: Date; game: Game; genres?: string[] }
  | { type: 'user'; id: string; orderedAt: Date; user: User }
  | { type: 'review'; id: string; orderedAt: Date; review: Review; game: Game }
  | { type: 'post'; id: string; orderedAt: Date; post: Post }
  | { type: 'collection'; id: string; orderedAt: Date; collection: Collection }
  | { type: 'tier-list'; id: string; orderedAt: Date; tierList: TierList }
  | { type: 'community'; id: string; orderedAt: Date; community: Community }
  | { type: 'event'; id: string; orderedAt: Date; event: Event };

const SEARCH_HIT_TYPE_RANK: Record<SearchHitType, number> = {
  game: 0,
  user: 1,
  review: 2,
  post: 3,
  collection: 4,
  'tier-list': 5,
  community: 6,
  event: 7,
};

/**
 * Search projection reads (S1 §13.5 GET `/search`). Database substring match only —
 * no search engine · ranking · personalization.
 */
export interface SearchRepository {
  search(params: SearchListParams): Promise<SearchHitRecord[]>;
}

export class PrismaSearchRepository implements SearchRepository {
  constructor(private readonly db: DatabaseClient) {}

  async search(params: SearchListParams): Promise<SearchHitRecord[]> {
    const q = params.query.trim();
    if (q.length === 0) {
      return [];
    }

    const perTypeTake = params.limit + 1;
    const textFilter: Prisma.StringFilter = { contains: q, mode: 'insensitive' };

    const [games, users, reviews, posts, collections, tierLists, communities, events] =
      await Promise.all([
        this.searchGames(textFilter, perTypeTake),
        this.searchUsers(textFilter, perTypeTake),
        this.searchReviews(textFilter, params.viewerId, perTypeTake),
        this.searchPosts(textFilter, params.viewerId, perTypeTake),
        this.searchCollections(textFilter, params.viewerId, perTypeTake),
        this.searchTierLists(textFilter, params.viewerId, perTypeTake),
        this.searchCommunities(textFilter, params.viewerId, perTypeTake),
        this.searchEvents(textFilter, perTypeTake),
      ]);

    let hits: SearchHitRecord[] = [
      ...games,
      ...users,
      ...reviews,
      ...posts,
      ...collections,
      ...tierLists,
      ...communities,
      ...events,
    ];
    hits.sort(compareHitsDesc);

    if (params.cursor !== undefined) {
      const cursor = params.cursor;
      hits = hits.filter((hit) => isAfterCursorInDescSort(hit, cursor));
    }

    return hits.slice(0, params.limit + 1);
  }

  private searchGames(filter: Prisma.StringFilter, take: number): Promise<SearchHitRecord[]> {
    return this.db.game
      .findMany({
        where: {
          OR: [{ title: filter }, { slug: filter }],
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take,
      })
      .then((rows) =>
        rows.map((game) => ({
          type: 'game' as const,
          id: game.id,
          orderedAt: game.createdAt,
          game,
        })),
      );
  }

  private searchUsers(filter: Prisma.StringFilter, take: number): Promise<SearchHitRecord[]> {
    return this.db.user
      .findMany({
        where: {
          deletedAt: null,
          OR: [{ handle: filter }, { displayName: filter }],
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take,
      })
      .then((rows) =>
        rows.map((user) => ({
          type: 'user' as const,
          id: user.id,
          orderedAt: user.createdAt,
          user,
        })),
      );
  }

  private searchReviews(
    filter: Prisma.StringFilter,
    viewerId: string | null,
    take: number,
  ): Promise<SearchHitRecord[]> {
    return this.db.review
      .findMany({
        where: {
          ...reviewVisibilityWhere(viewerId),
          OR: [{ body: filter }, { game: { title: filter } }],
        },
        include: { game: true },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take,
      })
      .then((rows) =>
        rows.map((row) => ({
          type: 'review' as const,
          id: row.id,
          orderedAt: row.createdAt,
          review: row,
          game: row.game,
        })),
      );
  }

  private searchPosts(
    filter: Prisma.StringFilter,
    viewerId: string | null,
    take: number,
  ): Promise<SearchHitRecord[]> {
    return this.db.post
      .findMany({
        where: {
          ...postVisibilityWhere(viewerId),
          body: filter,
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take,
      })
      .then((rows) =>
        rows.map((post) => ({
          type: 'post' as const,
          id: post.id,
          orderedAt: post.createdAt,
          post,
        })),
      );
  }

  private searchCollections(
    filter: Prisma.StringFilter,
    viewerId: string | null,
    take: number,
  ): Promise<SearchHitRecord[]> {
    return this.db.collection
      .findMany({
        where: {
          ...collectionVisibilityWhere(viewerId),
          OR: [{ title: filter }, { description: filter }],
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take,
      })
      .then((rows) =>
        rows.map((collection) => ({
          type: 'collection' as const,
          id: collection.id,
          orderedAt: collection.createdAt,
          collection,
        })),
      );
  }

  private searchTierLists(
    filter: Prisma.StringFilter,
    viewerId: string | null,
    take: number,
  ): Promise<SearchHitRecord[]> {
    return this.db.tierList
      .findMany({
        where: {
          ...tierListVisibilityWhere(viewerId),
          title: filter,
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take,
      })
      .then((rows) =>
        rows.map((tierList) => ({
          type: 'tier-list' as const,
          id: tierList.id,
          orderedAt: tierList.createdAt,
          tierList,
        })),
      );
  }

  private searchCommunities(
    filter: Prisma.StringFilter,
    viewerId: string | null,
    take: number,
  ): Promise<SearchHitRecord[]> {
    return this.db.community
      .findMany({
        where: {
          ...communityVisibilityWhere(viewerId),
          OR: [{ name: filter }, { description: filter }],
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take,
      })
      .then((rows) =>
        rows.map((community) => ({
          type: 'community' as const,
          id: community.id,
          orderedAt: community.createdAt,
          community,
        })),
      );
  }

  private searchEvents(filter: Prisma.StringFilter, take: number): Promise<SearchHitRecord[]> {
    return this.db.event
      .findMany({
        where: {
          deletedAt: null,
          title: filter,
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take,
      })
      .then((rows) =>
        rows.map((event) => ({
          type: 'event' as const,
          id: event.id,
          orderedAt: event.createdAt,
          event,
        })),
      );
  }
}

function postVisibilityWhere(viewerId: string | null): Prisma.PostWhereInput {
  return contentVisibilityWhere('authorId', viewerId);
}

function reviewVisibilityWhere(viewerId: string | null): Prisma.ReviewWhereInput {
  return contentVisibilityWhere('authorId', viewerId);
}

function collectionVisibilityWhere(viewerId: string | null): Prisma.CollectionWhereInput {
  return contentVisibilityWhere('ownerId', viewerId);
}

function tierListVisibilityWhere(viewerId: string | null): Prisma.TierListWhereInput {
  return contentVisibilityWhere('ownerId', viewerId);
}

function contentVisibilityWhere(
  ownerField: 'authorId' | 'ownerId',
  viewerId: string | null,
): {
  deletedAt: null;
  visibility?: 'public';
  OR?: Record<string, unknown>[];
} {
  const base = { deletedAt: null };
  if (viewerId === null) {
    return { ...base, visibility: 'public' };
  }

  const ownerRelation =
    ownerField === 'authorId'
      ? { author: { followers: { some: { followerId: viewerId } } } }
      : { owner: { followers: { some: { followerId: viewerId } } } };

  return {
    ...base,
    OR: [
      { visibility: 'public' },
      { [ownerField]: viewerId },
      { visibility: 'followers', ...ownerRelation },
    ],
  };
}

function communityVisibilityWhere(viewerId: string | null): Prisma.CommunityWhereInput {
  const base = { deletedAt: null };
  if (viewerId === null) {
    return { ...base, visibility: 'public' };
  }
  return {
    ...base,
    OR: [
      { visibility: 'public' },
      { members: { some: { userId: viewerId } } },
      {
        visibility: 'followers',
        members: {
          some: {
            role: 'owner',
            user: { followers: { some: { followerId: viewerId } } },
          },
        },
      },
    ],
  };
}

function compareHitsDesc(a: SearchHitRecord, b: SearchHitRecord): number {
  const at = a.orderedAt.getTime();
  const bt = b.orderedAt.getTime();
  if (at !== bt) {
    return bt - at;
  }
  const ar = SEARCH_HIT_TYPE_RANK[a.type];
  const br = SEARCH_HIT_TYPE_RANK[b.type];
  if (ar !== br) {
    return br - ar;
  }
  return b.id.localeCompare(a.id);
}

function isAfterCursorInDescSort(hit: SearchHitRecord, cursor: SearchListCursor): boolean {
  const ht = hit.orderedAt.getTime();
  const ct = cursor.orderedAt.getTime();
  if (ht < ct) {
    return true;
  }
  if (ht > ct) {
    return false;
  }
  const hr = SEARCH_HIT_TYPE_RANK[hit.type];
  const cr = SEARCH_HIT_TYPE_RANK[cursor.type];
  if (hr < cr) {
    return true;
  }
  if (hr > cr) {
    return false;
  }
  return hit.id < cursor.id;
}
