import type { Mute, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * Mute persistence (D3.24 · docs/07_SOCIAL/SOCIAL_GRAPH.md). Directed edge;
 * unique per (muterId, mutedId). Soft exclude from viewer feed only — never
 * notifies the muted party. Relationship rows hard-delete.
 */
export interface MuteRepository {
  create(data: Prisma.MuteCreateInput): Promise<Mute>;
  findByPair(muterId: string, mutedId: string): Promise<Mute | null>;
  exists(muterId: string, mutedId: string): Promise<boolean>;
  /** All userIds muted by `muterId` — used by feed exclusion. */
  listMutedIds(muterId: string): Promise<string[]>;
  delete(id: string): Promise<Mute>;
  deleteByPair(muterId: string, mutedId: string): Promise<Mute | null>;
}

export class PrismaMuteRepository implements MuteRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.MuteCreateInput): Promise<Mute> {
    return this.db.mute.create({ data });
  }

  findByPair(muterId: string, mutedId: string): Promise<Mute | null> {
    return this.db.mute.findUnique({
      where: { muterId_mutedId: { muterId, mutedId } },
    });
  }

  async exists(muterId: string, mutedId: string): Promise<boolean> {
    const row = await this.findByPair(muterId, mutedId);
    return row !== null;
  }

  async listMutedIds(muterId: string): Promise<string[]> {
    const rows = await this.db.mute.findMany({
      where: { muterId },
      select: { mutedId: true },
    });
    return rows.map((row) => row.mutedId);
  }

  delete(id: string): Promise<Mute> {
    return this.db.mute.delete({ where: { id } });
  }

  async deleteByPair(muterId: string, mutedId: string): Promise<Mute | null> {
    const existing = await this.findByPair(muterId, mutedId);
    if (!existing) {
      return null;
    }
    return this.delete(existing.id);
  }
}
