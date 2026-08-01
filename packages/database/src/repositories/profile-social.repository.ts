import type { Prisma, ProfilePin, ProfilePinKind, UserArchetype } from '@prisma/client';

import type { DatabaseClient } from './types';

export interface UserArchetypeRepository {
  listByUser(userId: string): Promise<UserArchetype[]>;
  replaceForUser(
    userId: string,
    rows: readonly { archetypeKey: string; score: number }[],
  ): Promise<UserArchetype[]>;
}

export class PrismaUserArchetypeRepository implements UserArchetypeRepository {
  constructor(private readonly db: DatabaseClient) {}

  listByUser(userId: string): Promise<UserArchetype[]> {
    return this.db.userArchetype.findMany({
      where: { userId },
      orderBy: [{ score: 'desc' }, { awardedAt: 'desc' }],
    });
  }

  async replaceForUser(
    userId: string,
    rows: readonly { archetypeKey: string; score: number }[],
  ): Promise<UserArchetype[]> {
    await this.db.userArchetype.deleteMany({ where: { userId } });
    if (rows.length === 0) {
      return [];
    }
    await this.db.userArchetype.createMany({
      data: rows.map((row) => ({
        userId,
        archetypeKey: row.archetypeKey,
        score: row.score,
      })),
    });
    return this.listByUser(userId);
  }
}

export interface ProfilePinRepository {
  listByUser(userId: string): Promise<ProfilePin[]>;
  upsert(data: {
    userId: string;
    kind: ProfilePinKind;
    objectId: string;
    position: number;
  }): Promise<ProfilePin>;
  delete(userId: string, kind: ProfilePinKind, objectId: string): Promise<ProfilePin | null>;
}

export class PrismaProfilePinRepository implements ProfilePinRepository {
  constructor(private readonly db: DatabaseClient) {}

  listByUser(userId: string): Promise<ProfilePin[]> {
    return this.db.profilePin.findMany({
      where: { userId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
  }

  upsert(data: {
    userId: string;
    kind: ProfilePinKind;
    objectId: string;
    position: number;
  }): Promise<ProfilePin> {
    return this.db.profilePin.upsert({
      where: {
        userId_kind_objectId: {
          userId: data.userId,
          kind: data.kind,
          objectId: data.objectId,
        },
      },
      create: {
        user: { connect: { id: data.userId } },
        kind: data.kind,
        objectId: data.objectId,
        position: data.position,
      },
      update: { position: data.position },
    });
  }

  async delete(userId: string, kind: ProfilePinKind, objectId: string): Promise<ProfilePin | null> {
    const existing = await this.db.profilePin.findUnique({
      where: { userId_kind_objectId: { userId, kind, objectId } },
    });
    if (existing == null) {
      return null;
    }
    return this.db.profilePin.delete({ where: { id: existing.id } });
  }
}

export type { Prisma, ProfilePinKind };
