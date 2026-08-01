import type { Block, BlockRepository, Prisma } from '@gmrlog/database';

/**
 * In-memory Block repository fake — test support only (build-excluded).
 */

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${String(idCounter)}`;
}

function connectId(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || !('connect' in value)) {
    return undefined;
  }
  const connect = (value as { connect?: { id?: string } }).connect;
  return typeof connect?.id === 'string' ? connect.id : undefined;
}

export function makeBlock(overrides: Partial<Block> = {}): Block {
  return {
    id: 'block-1',
    blockerId: 'user-1',
    blockedId: 'user-2',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export interface FakeBlockRepository extends BlockRepository {
  rows: Map<string, Block>;
}

export function createFakeBlockRepository(seed: Block[] = []): FakeBlockRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));

  const findByPair = (blockerId: string, blockedId: string): Promise<Block | null> =>
    Promise.resolve(
      [...rows.values()].find(
        (row) => row.blockerId === blockerId && row.blockedId === blockedId,
      ) ?? null,
    );

  return {
    rows,
    create: (data: Prisma.BlockCreateInput) => {
      const blockerId = connectId(data.blocker);
      const blockedId = connectId(data.blocked);
      if (!blockerId || !blockedId) {
        return Promise.reject(new Error('blocker and blocked required'));
      }
      const block = makeBlock({
        id: nextId('block'),
        blockerId,
        blockedId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      rows.set(block.id, block);
      return Promise.resolve(block);
    },
    findByPair,
    exists: async (blockerId, blockedId) => (await findByPair(blockerId, blockedId)) !== null,
    listBlockedPairIds: (userId) => {
      const ids = new Set<string>();
      for (const row of rows.values()) {
        if (row.blockerId === userId) {
          ids.add(row.blockedId);
        }
        if (row.blockedId === userId) {
          ids.add(row.blockerId);
        }
      }
      return Promise.resolve([...ids]);
    },
    delete: (id) => {
      const existing = rows.get(id);
      if (!existing) {
        return Promise.reject(new Error(`block ${id} not found`));
      }
      rows.delete(id);
      return Promise.resolve(existing);
    },
    deleteByPair: async (blockerId, blockedId) => {
      const existing = await findByPair(blockerId, blockedId);
      if (!existing) {
        return null;
      }
      rows.delete(existing.id);
      return existing;
    },
  };
}
