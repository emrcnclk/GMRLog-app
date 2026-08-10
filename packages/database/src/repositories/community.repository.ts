import type { Community, CommunityKind, ContentVisibility, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * Keyset cursor for the directory lists, matching their
 * `[{ updatedAt: 'desc' }, { id: 'desc' }]` order.
 */
export interface CommunityListCursor {
  updatedAt: Date;
  id: string;
}

export interface CommunityListOptions {
  limit: number;
  cursor?: CommunityListCursor;
  /** 3b.1e — §13's filter pills. Omitted means every kind. */
  kind?: CommunityKind;
}

/**
 * Community persistence (S2 §10.6). Soft-deletable (§6). Persistence only.
 */
export interface CommunityRepository {
  create(data: Prisma.CommunityCreateInput): Promise<Community>;
  findById(id: string): Promise<Community | null>;
  findManyByIds(ids: readonly string[]): Promise<Community[]>;
  findBySlug(slug: string): Promise<Community | null>;
  findActiveById(id: string): Promise<Community | null>;
  /** Bounded by `options.limit` — the directory is never fetched whole. */
  listPublic(options: CommunityListOptions): Promise<Community[]>;
  listDiscoverableForMemberCommunityIds(
    memberCommunityIds: readonly string[],
    options: CommunityListOptions,
  ): Promise<Community[]>;
  /** D3.24 Game Hub — public communities whose name or tags reference the game (heuristic). */
  searchByName(query: string): Promise<Community[]>;
  update(id: string, data: Prisma.CommunityUpdateInput): Promise<Community>;
  softDelete(id: string): Promise<Community>;
}

export class PrismaCommunityRepository implements CommunityRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.CommunityCreateInput): Promise<Community> {
    return this.db.community.create({ data });
  }

  findById(id: string): Promise<Community | null> {
    return this.db.community.findUnique({ where: { id } });
  }

  findManyByIds(ids: readonly string[]): Promise<Community[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    return this.db.community.findMany({ where: { id: { in: [...ids] }, deletedAt: null } });
  }

  findBySlug(slug: string): Promise<Community | null> {
    return this.db.community.findUnique({ where: { slug } });
  }

  findActiveById(id: string): Promise<Community | null> {
    return this.db.community.findFirst({ where: { id, deletedAt: null } });
  }

  listPublic(options: CommunityListOptions): Promise<Community[]> {
    const visibility: ContentVisibility = 'public';
    return this.db.community.findMany({
      where: {
        AND: [
          { deletedAt: null, visibility },
          HAS_OWNER,
          ...cursorFilter(options.cursor),
          ...kindFilter(options.kind),
        ],
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: options.limit,
    });
  }

  listDiscoverableForMemberCommunityIds(
    memberCommunityIds: readonly string[],
    options: CommunityListOptions,
  ): Promise<Community[]> {
    const visibility: ContentVisibility = 'public';
    const memberIds = [...memberCommunityIds];
    return this.db.community.findMany({
      where: {
        AND: [
          {
            deletedAt: null,
            OR: [{ visibility }, ...(memberIds.length > 0 ? [{ id: { in: memberIds } }] : [])],
          },
          HAS_OWNER,
          ...cursorFilter(options.cursor),
          ...kindFilter(options.kind),
        ],
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: options.limit,
    });
  }

  searchByName(query: string): Promise<Community[]> {
    const visibility: ContentVisibility = 'public';
    return this.db.community.findMany({
      where: {
        deletedAt: null,
        visibility,
        OR: [{ name: { contains: query, mode: 'insensitive' } }, { tags: { has: query } }],
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
  }

  update(id: string, data: Prisma.CommunityUpdateInput): Promise<Community> {
    return this.db.community.update({ where: { id }, data });
  }

  softDelete(id: string): Promise<Community> {
    return this.db.community.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

/**
 * A community with no owner membership row is readable by nobody, so the
 * service drops it during projection. The list queries have to exclude it
 * *before* the page is sliced: filtering afterwards returns pages shorter than
 * the limit — and, where owner-less rows cluster, pages that are empty while
 * `hasMore` stays true, which stalls an infinite scroll on a page of nothing.
 */
const HAS_OWNER: Prisma.CommunityWhereInput = { members: { some: { role: 'owner' } } };

/**
 * Keyset predicate for `updatedAt desc, id desc` — strictly after the cursor
 * row. Written as an `AND` term so callers keep their own `where` untouched.
 */
function cursorFilter(cursor: CommunityListCursor | undefined): Prisma.CommunityWhereInput[] {
  if (cursor === undefined) {
    return [];
  }
  return [
    {
      OR: [
        { updatedAt: { lt: cursor.updatedAt } },
        { updatedAt: cursor.updatedAt, id: { lt: cursor.id } },
      ],
    },
  ];
}

/** 3b.1e — §13's filter pills. Applies across the whole page, joined circles included. */
function kindFilter(kind: CommunityKind | undefined): Prisma.CommunityWhereInput[] {
  return kind === undefined ? [] : [{ kind }];
}
