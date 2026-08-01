import type { Mute, MuteRepository, Prisma } from '@gmrlog/database';

/**
 * In-memory Mute repository fake — test support only (build-excluded).
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

export function makeMute(overrides: Partial<Mute> = {}): Mute {
  return {
    id: 'mute-1',
    muterId: 'user-1',
    mutedId: 'user-2',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export interface FakeMuteRepository extends MuteRepository {
  rows: Map<string, Mute>;
}

export function createFakeMuteRepository(seed: Mute[] = []): FakeMuteRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));

  const findByPair = (muterId: string, mutedId: string): Promise<Mute | null> =>
    Promise.resolve(
      [...rows.values()].find((row) => row.muterId === muterId && row.mutedId === mutedId) ?? null,
    );

  return {
    rows,
    create: (data: Prisma.MuteCreateInput) => {
      const muterId = connectId(data.muter);
      const mutedId = connectId(data.muted);
      if (!muterId || !mutedId) {
        return Promise.reject(new Error('muter and muted required'));
      }
      const mute = makeMute({
        id: nextId('mute'),
        muterId,
        mutedId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      rows.set(mute.id, mute);
      return Promise.resolve(mute);
    },
    findByPair,
    exists: async (muterId, mutedId) => (await findByPair(muterId, mutedId)) !== null,
    listMutedIds: (muterId) =>
      Promise.resolve(
        [...rows.values()].filter((row) => row.muterId === muterId).map((row) => row.mutedId),
      ),
    delete: (id) => {
      const existing = rows.get(id);
      if (!existing) {
        return Promise.reject(new Error(`mute ${id} not found`));
      }
      rows.delete(id);
      return Promise.resolve(existing);
    },
    deleteByPair: async (muterId, mutedId) => {
      const existing = await findByPair(muterId, mutedId);
      if (!existing) {
        return null;
      }
      rows.delete(existing.id);
      return existing;
    },
  };
}
