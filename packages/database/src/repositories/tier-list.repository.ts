import type { ContentVisibility, Prisma, TierList } from '@prisma/client';

import type { DatabaseClient } from './types';

/** TierList persistence (S2 §10.5). Soft-deletable (§6). Persistence only. */
export interface TierListRepository {
  create(data: Prisma.TierListCreateInput): Promise<TierList>;
  findById(id: string): Promise<TierList | null>;
  findActiveById(id: string): Promise<TierList | null>;
  listByOwner(ownerId: string): Promise<TierList[]>;
  listPublicByOwner(ownerId: string): Promise<TierList[]>;
  /** D3.24 Game Hub — public tier lists that place the game in any slot. */
  listPublicContainingGame(gameId: string): Promise<TierList[]>;
  update(id: string, data: Prisma.TierListUpdateInput): Promise<TierList>;
  softDelete(id: string): Promise<TierList>;
  delete(id: string): Promise<TierList>;
}

export class PrismaTierListRepository implements TierListRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.TierListCreateInput): Promise<TierList> {
    return this.db.tierList.create({ data });
  }

  findById(id: string): Promise<TierList | null> {
    return this.db.tierList.findUnique({ where: { id } });
  }

  findActiveById(id: string): Promise<TierList | null> {
    return this.db.tierList.findFirst({ where: { id, deletedAt: null } });
  }

  listByOwner(ownerId: string): Promise<TierList[]> {
    return this.db.tierList.findMany({
      where: { ownerId, deletedAt: null },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
  }

  listPublicByOwner(ownerId: string): Promise<TierList[]> {
    const visibility: ContentVisibility = 'public';
    return this.db.tierList.findMany({
      where: { ownerId, deletedAt: null, visibility },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
  }

  listPublicContainingGame(gameId: string): Promise<TierList[]> {
    const visibility: ContentVisibility = 'public';
    return this.db.tierList.findMany({
      where: { deletedAt: null, visibility, slots: { some: { games: { some: { gameId } } } } },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
  }

  update(id: string, data: Prisma.TierListUpdateInput): Promise<TierList> {
    return this.db.tierList.update({ where: { id }, data });
  }

  softDelete(id: string): Promise<TierList> {
    return this.db.tierList.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  delete(id: string): Promise<TierList> {
    return this.db.tierList.delete({ where: { id } });
  }
}
