import type { CollectionEntry, Prisma } from '@prisma/client';

import { withTransaction, type DatabaseClient } from './types';

export interface CollectionEntryWrite {
  gameId: string;
  position: number;
  note?: string | null;
}

/**
 * CollectionEntry persistence (S2 §10.5). Ordered game rows under a
 * Collection. Persistence only — replace is delete-all + insert (S1 PUT).
 */
export interface CollectionEntryRepository {
  create(data: Prisma.CollectionEntryCreateInput): Promise<CollectionEntry>;
  findById(id: string): Promise<CollectionEntry | null>;
  findEntry(collectionId: string, gameId: string): Promise<CollectionEntry | null>;
  listByCollection(collectionId: string): Promise<CollectionEntry[]>;
  addEntry(data: Prisma.CollectionEntryCreateInput): Promise<CollectionEntry>;
  removeEntry(collectionId: string, gameId: string): Promise<CollectionEntry>;
  replaceEntries(collectionId: string, entries: CollectionEntryWrite[]): Promise<CollectionEntry[]>;
  delete(id: string): Promise<CollectionEntry>;
}

export class PrismaCollectionEntryRepository implements CollectionEntryRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.CollectionEntryCreateInput): Promise<CollectionEntry> {
    return this.db.collectionEntry.create({ data });
  }

  findById(id: string): Promise<CollectionEntry | null> {
    return this.db.collectionEntry.findUnique({ where: { id } });
  }

  findEntry(collectionId: string, gameId: string): Promise<CollectionEntry | null> {
    return this.db.collectionEntry.findUnique({
      where: { collectionId_gameId: { collectionId, gameId } },
    });
  }

  listByCollection(collectionId: string): Promise<CollectionEntry[]> {
    return this.db.collectionEntry.findMany({
      where: { collectionId },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    });
  }

  addEntry(data: Prisma.CollectionEntryCreateInput): Promise<CollectionEntry> {
    return this.create(data);
  }

  removeEntry(collectionId: string, gameId: string): Promise<CollectionEntry> {
    return this.db.collectionEntry.delete({
      where: { collectionId_gameId: { collectionId, gameId } },
    });
  }

  async replaceEntries(
    collectionId: string,
    entries: CollectionEntryWrite[],
  ): Promise<CollectionEntry[]> {
    await withTransaction(this.db, async (tx) => {
      await tx.collectionEntry.deleteMany({ where: { collectionId } });
      if (entries.length === 0) {
        return;
      }
      await tx.collectionEntry.createMany({
        data: entries.map((entry) => ({
          collectionId,
          gameId: entry.gameId,
          position: entry.position,
          note: entry.note ?? null,
        })),
      });
    });
    return this.listByCollection(collectionId);
  }

  delete(id: string): Promise<CollectionEntry> {
    return this.db.collectionEntry.delete({ where: { id } });
  }
}
