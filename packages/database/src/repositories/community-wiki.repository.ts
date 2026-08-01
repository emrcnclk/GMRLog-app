import type { CommunityWikiPage, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * CommunityWikiPage persistence (D3.24 · docs/07_SOCIAL/COMMUNITIES_2.md).
 * Unique per (communityId, slug). Version increments on every update —
 * not a CRDT / realtime collaborative editor.
 */
export interface CommunityWikiRepository {
  create(data: Prisma.CommunityWikiPageCreateInput): Promise<CommunityWikiPage>;
  findById(id: string): Promise<CommunityWikiPage | null>;
  findBySlug(communityId: string, slug: string): Promise<CommunityWikiPage | null>;
  listByCommunity(communityId: string): Promise<CommunityWikiPage[]>;
  /** Contribution counts for top_contributor badge (pages last-edited by user). */
  countByUpdatedBy(communityId: string): Promise<{ updatedById: string; count: number }[]>;
  update(id: string, data: Prisma.CommunityWikiPageUpdateInput): Promise<CommunityWikiPage>;
  delete(id: string): Promise<CommunityWikiPage>;
}

export class PrismaCommunityWikiRepository implements CommunityWikiRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.CommunityWikiPageCreateInput): Promise<CommunityWikiPage> {
    return this.db.communityWikiPage.create({ data });
  }

  findById(id: string): Promise<CommunityWikiPage | null> {
    return this.db.communityWikiPage.findUnique({ where: { id } });
  }

  findBySlug(communityId: string, slug: string): Promise<CommunityWikiPage | null> {
    return this.db.communityWikiPage.findUnique({
      where: { communityId_slug: { communityId, slug } },
    });
  }

  listByCommunity(communityId: string): Promise<CommunityWikiPage[]> {
    return this.db.communityWikiPage.findMany({
      where: { communityId },
      orderBy: [{ title: 'asc' }, { id: 'asc' }],
    });
  }

  async countByUpdatedBy(communityId: string): Promise<{ updatedById: string; count: number }[]> {
    const rows = await this.db.communityWikiPage.groupBy({
      by: ['updatedById'],
      where: { communityId },
      _count: { _all: true },
    });
    return rows.map((row) => ({
      updatedById: row.updatedById,
      count: row._count._all,
    }));
  }

  update(id: string, data: Prisma.CommunityWikiPageUpdateInput): Promise<CommunityWikiPage> {
    return this.db.communityWikiPage.update({ where: { id }, data });
  }

  delete(id: string): Promise<CommunityWikiPage> {
    return this.db.communityWikiPage.delete({ where: { id } });
  }
}
