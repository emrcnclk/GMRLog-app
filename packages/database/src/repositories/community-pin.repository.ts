import type { CommunityPin, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * CommunityPin persistence (D3.24 · docs/07_SOCIAL/COMMUNITIES_2.md).
 * Polymorphic (`objectType` + `objectId`) pin, ordered by `position` within
 * a community. Unique per (communityId, objectType, objectId).
 */
export interface CommunityPinRepository {
  create(data: Prisma.CommunityPinCreateInput): Promise<CommunityPin>;
  findById(id: string): Promise<CommunityPin | null>;
  findByObject(
    communityId: string,
    objectType: string,
    objectId: string,
  ): Promise<CommunityPin | null>;
  listByCommunity(communityId: string): Promise<CommunityPin[]>;
  countByCommunity(communityId: string): Promise<number>;
  updatePosition(id: string, position: number): Promise<CommunityPin>;
  delete(id: string): Promise<CommunityPin>;
}

export class PrismaCommunityPinRepository implements CommunityPinRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.CommunityPinCreateInput): Promise<CommunityPin> {
    return this.db.communityPin.create({ data });
  }

  findById(id: string): Promise<CommunityPin | null> {
    return this.db.communityPin.findUnique({ where: { id } });
  }

  findByObject(
    communityId: string,
    objectType: string,
    objectId: string,
  ): Promise<CommunityPin | null> {
    return this.db.communityPin.findUnique({
      where: { communityId_objectType_objectId: { communityId, objectType, objectId } },
    });
  }

  listByCommunity(communityId: string): Promise<CommunityPin[]> {
    return this.db.communityPin.findMany({
      where: { communityId },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });
  }

  countByCommunity(communityId: string): Promise<number> {
    return this.db.communityPin.count({ where: { communityId } });
  }

  updatePosition(id: string, position: number): Promise<CommunityPin> {
    return this.db.communityPin.update({ where: { id }, data: { position } });
  }

  delete(id: string): Promise<CommunityPin> {
    return this.db.communityPin.delete({ where: { id } });
  }
}
