import type { Block, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * Block persistence (S2 §10.8 / S1 §13.13). Directed edge; unique per
 * (blockerId, blockedId). Relationship rows hard-delete.
 */
export interface BlockRepository {
  create(data: Prisma.BlockCreateInput): Promise<Block>;
  findByPair(blockerId: string, blockedId: string): Promise<Block | null>;
  exists(blockerId: string, blockedId: string): Promise<boolean>;
  /**
   * D3.24 feed AuthZ — userIds blocked by `userId` OR who blocked `userId`
   * (hard exclude either direction).
   */
  listBlockedPairIds(userId: string): Promise<string[]>;
  delete(id: string): Promise<Block>;
  deleteByPair(blockerId: string, blockedId: string): Promise<Block | null>;
}

export class PrismaBlockRepository implements BlockRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.BlockCreateInput): Promise<Block> {
    return this.db.block.create({ data });
  }

  findByPair(blockerId: string, blockedId: string): Promise<Block | null> {
    return this.db.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
  }

  async exists(blockerId: string, blockedId: string): Promise<boolean> {
    const row = await this.findByPair(blockerId, blockedId);
    return row !== null;
  }

  async listBlockedPairIds(userId: string): Promise<string[]> {
    const [outgoing, incoming] = await Promise.all([
      this.db.block.findMany({
        where: { blockerId: userId },
        select: { blockedId: true },
      }),
      this.db.block.findMany({
        where: { blockedId: userId },
        select: { blockerId: true },
      }),
    ]);
    return [
      ...new Set([
        ...outgoing.map((row) => row.blockedId),
        ...incoming.map((row) => row.blockerId),
      ]),
    ];
  }

  delete(id: string): Promise<Block> {
    return this.db.block.delete({ where: { id } });
  }

  async deleteByPair(blockerId: string, blockedId: string): Promise<Block | null> {
    const existing = await this.findByPair(blockerId, blockedId);
    if (!existing) {
      return null;
    }
    return this.delete(existing.id);
  }
}
