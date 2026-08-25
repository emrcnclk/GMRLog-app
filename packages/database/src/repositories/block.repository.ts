import type { Block, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

export interface BlockListCursor {
  createdAt: Date;
  id: string;
}

export interface BlockListParams {
  limit: number;
  cursor?: BlockListCursor;
}

/**
 * Block persistence (S2 §10.8 / S1 §13.13). Directed edge; unique per
 * (blockerId, blockedId). Relationship rows hard-delete.
 */
export interface BlockRepository {
  create(data: Prisma.BlockCreateInput): Promise<Block>;
  findByPair(blockerId: string, blockedId: string): Promise<Block | null>;
  exists(blockerId: string, blockedId: string): Promise<boolean>;
  /**
   * True when either user has blocked the other. Blocks are directed edges, but
   * almost every rule built on them is symmetric: the person you blocked must
   * not be able to reach you either, so checking only your own outgoing edge
   * would let them follow and message you regardless.
   */
  existsEitherDirection(userId: string, otherUserId: string): Promise<boolean>;
  /**
   * D3.24 feed AuthZ — userIds blocked by `userId` OR who blocked `userId`
   * (hard exclude either direction).
   */
  listBlockedPairIds(userId: string): Promise<string[]>;
  /** 3b.3a — `GET /blocks`, cursor-paginated, most-recently-blocked first. */
  listByBlocker(blockerId: string, params: BlockListParams): Promise<Block[]>;
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

  async existsEitherDirection(userId: string, otherUserId: string): Promise<boolean> {
    const row = await this.db.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: otherUserId },
          { blockerId: otherUserId, blockedId: userId },
        ],
      },
      select: { id: true },
    });
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

  listByBlocker(blockerId: string, params: BlockListParams): Promise<Block[]> {
    return this.db.block.findMany({
      where: {
        blockerId,
        ...(params.cursor !== undefined
          ? {
              OR: [
                { createdAt: { lt: params.cursor.createdAt } },
                { createdAt: params.cursor.createdAt, id: { lt: params.cursor.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: params.limit,
    });
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
