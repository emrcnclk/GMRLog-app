import type { GameLog, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * GameLog persistence (S2 §10.3). Append-only play/log events under a
 * LibraryEntry. Persistence only — lifecycle meaning lives in the Library domain.
 */
export interface GameLogRepository {
  create(data: Prisma.GameLogCreateInput): Promise<GameLog>;
  listByLibraryEntry(libraryEntryId: string): Promise<GameLog[]>;
  deleteByLibraryEntry(libraryEntryId: string): Promise<number>;
}

export class PrismaGameLogRepository implements GameLogRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.GameLogCreateInput): Promise<GameLog> {
    return this.db.gameLog.create({ data });
  }

  listByLibraryEntry(libraryEntryId: string): Promise<GameLog[]> {
    return this.db.gameLog.findMany({
      where: { libraryEntryId },
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
    });
  }

  async deleteByLibraryEntry(libraryEntryId: string): Promise<number> {
    const result = await this.db.gameLog.deleteMany({ where: { libraryEntryId } });
    return result.count;
  }
}
