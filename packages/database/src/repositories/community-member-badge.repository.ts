import type { CommunityBadgeKind, CommunityMemberBadge, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

/**
 * CommunityMemberBadge persistence (D3.24 · docs/07_SOCIAL/COMMUNITIES_2.md).
 * Unique per (memberId, kind) — a member earns each badge kind at most once
 * (e.g. `founder` on community creation).
 */
export interface CommunityMemberBadgeRepository {
  create(data: Prisma.CommunityMemberBadgeCreateInput): Promise<CommunityMemberBadge>;
  findByMemberAndKind(
    memberId: string,
    kind: CommunityBadgeKind,
  ): Promise<CommunityMemberBadge | null>;
  listByMember(memberId: string): Promise<CommunityMemberBadge[]>;
  listByCommunity(communityId: string): Promise<CommunityMemberBadge[]>;
  delete(id: string): Promise<CommunityMemberBadge>;
}

export class PrismaCommunityMemberBadgeRepository implements CommunityMemberBadgeRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.CommunityMemberBadgeCreateInput): Promise<CommunityMemberBadge> {
    return this.db.communityMemberBadge.create({ data });
  }

  findByMemberAndKind(
    memberId: string,
    kind: CommunityBadgeKind,
  ): Promise<CommunityMemberBadge | null> {
    return this.db.communityMemberBadge.findUnique({
      where: { memberId_kind: { memberId, kind } },
    });
  }

  listByMember(memberId: string): Promise<CommunityMemberBadge[]> {
    return this.db.communityMemberBadge.findMany({ where: { memberId } });
  }

  listByCommunity(communityId: string): Promise<CommunityMemberBadge[]> {
    return this.db.communityMemberBadge.findMany({ where: { communityId } });
  }

  delete(id: string): Promise<CommunityMemberBadge> {
    return this.db.communityMemberBadge.delete({ where: { id } });
  }
}
