import type { Prisma, Reaction, ReactionTargetType } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * Reaction persistence (S2 §10.4). Polymorphic target; unique per
 * (actorId, targetType, targetId, kind) (§11). Persistence only.
 */
export interface ReactionRepository {
  create(data: Prisma.ReactionCreateInput): Promise<Reaction>;
  findById(id: string): Promise<Reaction | null>;
  findByActorAndTarget(
    actorId: string,
    targetType: ReactionTargetType,
    targetId: string,
    kind: string,
  ): Promise<Reaction | null>;
  listByTarget(targetType: ReactionTargetType, targetId: string): Promise<Reaction[]>;
  delete(id: string): Promise<Reaction>;
}

export class PrismaReactionRepository implements ReactionRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.ReactionCreateInput): Promise<Reaction> {
    return this.db.reaction.create({ data });
  }

  findById(id: string): Promise<Reaction | null> {
    return this.db.reaction.findUnique({ where: { id } });
  }

  findByActorAndTarget(
    actorId: string,
    targetType: ReactionTargetType,
    targetId: string,
    kind: string,
  ): Promise<Reaction | null> {
    return this.db.reaction.findUnique({
      where: {
        actorId_targetType_targetId_kind: { actorId, targetType, targetId, kind },
      },
    });
  }

  listByTarget(targetType: ReactionTargetType, targetId: string): Promise<Reaction[]> {
    return this.db.reaction.findMany({
      where: { targetType, targetId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  delete(id: string): Promise<Reaction> {
    return this.db.reaction.delete({ where: { id } });
  }
}
