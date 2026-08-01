import type { Community, ContentVisibility, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * Community persistence (S2 §10.6). Soft-deletable (§6). Persistence only.
 */
export interface CommunityRepository {
  create(data: Prisma.CommunityCreateInput): Promise<Community>;
  findById(id: string): Promise<Community | null>;
  findManyByIds(ids: readonly string[]): Promise<Community[]>;
  findBySlug(slug: string): Promise<Community | null>;
  findActiveById(id: string): Promise<Community | null>;
  listPublic(): Promise<Community[]>;
  listDiscoverableForMemberCommunityIds(
    memberCommunityIds: readonly string[],
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

  listPublic(): Promise<Community[]> {
    const visibility: ContentVisibility = 'public';
    return this.db.community.findMany({
      where: { deletedAt: null, visibility },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
  }

  listDiscoverableForMemberCommunityIds(
    memberCommunityIds: readonly string[],
  ): Promise<Community[]> {
    const visibility: ContentVisibility = 'public';
    const memberIds = [...memberCommunityIds];
    return this.db.community.findMany({
      where: {
        deletedAt: null,
        OR: [{ visibility }, ...(memberIds.length > 0 ? [{ id: { in: memberIds } }] : [])],
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
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
