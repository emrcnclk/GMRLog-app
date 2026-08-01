import type { Collection, ContentVisibility, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

/** Collection persistence (S2 §10.5). Soft-deletable (§6). Persistence only. */
export interface CollectionRepository {
  create(data: Prisma.CollectionCreateInput): Promise<Collection>;
  findById(id: string): Promise<Collection | null>;
  findActiveById(id: string): Promise<Collection | null>;
  listByOwner(ownerId: string): Promise<Collection[]>;
  listPublicByOwner(ownerId: string): Promise<Collection[]>;
  /** D3.24 Game Hub — public collections that include the game as an entry. */
  listPublicContainingGame(gameId: string): Promise<Collection[]>;
  update(id: string, data: Prisma.CollectionUpdateInput): Promise<Collection>;
  softDelete(id: string): Promise<Collection>;
  delete(id: string): Promise<Collection>;
}

export class PrismaCollectionRepository implements CollectionRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.CollectionCreateInput): Promise<Collection> {
    return this.db.collection.create({ data });
  }

  findById(id: string): Promise<Collection | null> {
    return this.db.collection.findUnique({ where: { id } });
  }

  findActiveById(id: string): Promise<Collection | null> {
    return this.db.collection.findFirst({ where: { id, deletedAt: null } });
  }

  listByOwner(ownerId: string): Promise<Collection[]> {
    return this.db.collection.findMany({
      where: { ownerId, deletedAt: null },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
  }

  listPublicByOwner(ownerId: string): Promise<Collection[]> {
    const visibility: ContentVisibility = 'public';
    return this.db.collection.findMany({
      where: { ownerId, deletedAt: null, visibility },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
  }

  listPublicContainingGame(gameId: string): Promise<Collection[]> {
    const visibility: ContentVisibility = 'public';
    return this.db.collection.findMany({
      where: { deletedAt: null, visibility, entries: { some: { gameId } } },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
  }

  update(id: string, data: Prisma.CollectionUpdateInput): Promise<Collection> {
    return this.db.collection.update({ where: { id }, data });
  }

  softDelete(id: string): Promise<Collection> {
    return this.db.collection.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  delete(id: string): Promise<Collection> {
    return this.db.collection.delete({ where: { id } });
  }
}
