import type { LibraryEntry, LibraryStatus, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

/** Optional filters for shelf/status list reads (S1 §13.9 `filter[status]`). */
export interface LibraryEntryListFilter {
  status?: LibraryStatus;
}

/**
 * LibraryEntry persistence (S2 §10.3). Unique per (userId, gameId); deleting the
 * relationship cascades its GameLog rows (S2 §13). Persistence only.
 */
export interface LibraryEntryRepository {
  create(data: Prisma.LibraryEntryCreateInput): Promise<LibraryEntry>;
  findById(id: string): Promise<LibraryEntry | null>;
  findByUserAndGame(userId: string, gameId: string): Promise<LibraryEntry | null>;
  listByUser(userId: string, filter?: LibraryEntryListFilter): Promise<LibraryEntry[]>;
  /** D3.24 Game Hub — players tab; entries for a game, most recently updated first. */
  listByGame(gameId: string): Promise<LibraryEntry[]>;
  countByUserGroupedByStatus(userId: string): Promise<ReadonlyMap<LibraryStatus, number>>;
  update(id: string, data: Prisma.LibraryEntryUpdateInput): Promise<LibraryEntry>;
  delete(id: string): Promise<LibraryEntry>;
}

export class PrismaLibraryEntryRepository implements LibraryEntryRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.LibraryEntryCreateInput): Promise<LibraryEntry> {
    return this.db.libraryEntry.create({ data });
  }

  findById(id: string): Promise<LibraryEntry | null> {
    return this.db.libraryEntry.findUnique({ where: { id } });
  }

  findByUserAndGame(userId: string, gameId: string): Promise<LibraryEntry | null> {
    return this.db.libraryEntry.findUnique({ where: { userId_gameId: { userId, gameId } } });
  }

  listByUser(userId: string, filter: LibraryEntryListFilter = {}): Promise<LibraryEntry[]> {
    return this.db.libraryEntry.findMany({
      where: {
        userId,
        ...(filter.status !== undefined ? { status: filter.status } : {}),
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
  }

  listByGame(gameId: string): Promise<LibraryEntry[]> {
    return this.db.libraryEntry.findMany({
      where: { gameId },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
  }

  async countByUserGroupedByStatus(userId: string): Promise<ReadonlyMap<LibraryStatus, number>> {
    const rows = await this.db.libraryEntry.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true },
    });
    const counts = new Map<LibraryStatus, number>();
    for (const row of rows) {
      counts.set(row.status, row._count._all);
    }
    return counts;
  }

  update(id: string, data: Prisma.LibraryEntryUpdateInput): Promise<LibraryEntry> {
    return this.db.libraryEntry.update({ where: { id }, data });
  }

  delete(id: string): Promise<LibraryEntry> {
    return this.db.libraryEntry.delete({ where: { id } });
  }
}
