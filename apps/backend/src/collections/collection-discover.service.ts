import type { FollowRepository, Prisma } from '@gmrlog/database';
import type { CollectionResponse } from '@gmrlog/types';
import type { CollectionsDiscoverQueryInput } from '@gmrlog/validators';
import { DISCOVER_LIST_DEFAULT_LIMIT } from '@gmrlog/validators';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { FOLLOW_REPOSITORY } from '../follows/follows.tokens';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { PaginatedPayload } from '../infrastructure/http/paginated-payload';

import { toCollectionResponse } from './mappers/collection.mapper';

const TRENDING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const CANDIDATE_POOL_MULTIPLIER = 3;
const CANDIDATE_POOL_MIN = 60;

type CollectionWithRelations = Prisma.CollectionGetPayload<{
  include: {
    owner: true;
    entries: true;
    _count: { select: { followers: true } };
  };
}>;

/**
 * Collection Hub (D3.24 / COLLECTION_HUB.md). Collections are discoverable
 * culture objects, not profile-only shelves. Reuses D3.22 `collectionFollower`
 * (top · trending) — no `KEYS`/`FLUSHALL`-style scans, top-N projections only.
 */
@Injectable()
export class CollectionDiscoverService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(FOLLOW_REPOSITORY) private readonly follows: FollowRepository,
  ) {}

  async discover(
    query: CollectionsDiscoverQueryInput = {},
    viewerId: string | null = null,
  ): Promise<PaginatedPayload<CollectionResponse>> {
    const limit = query.limit ?? DISCOVER_LIST_DEFAULT_LIMIT;
    const sort = query.sort ?? 'top';

    if (sort === 'following') {
      if (viewerId === null) {
        throw new UnauthorizedException('Authentication required for following collections');
      }
      return this.discoverFollowing(viewerId, limit, query.tag);
    }

    if (sort === 'trending') {
      return this.discoverTrending(limit, query.tag);
    }

    const rows = await this.prisma.collection.findMany({
      where: {
        visibility: 'public',
        deletedAt: null,
        ...(query.tag !== undefined ? { tags: { has: query.tag } } : {}),
      },
      include: {
        owner: true,
        entries: { orderBy: { position: 'asc' } },
        _count: { select: { followers: true } },
      },
      orderBy:
        sort === 'newest'
          ? [{ createdAt: 'desc' }, { id: 'desc' }]
          : [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: Math.max(limit * CANDIDATE_POOL_MULTIPLIER, CANDIDATE_POOL_MIN),
    });

    const ranked =
      sort === 'newest'
        ? [...rows].sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime() || a.id.localeCompare(b.id),
          )
        : [...rows].sort(
            (a, b) =>
              b._count.followers - a._count.followers ||
              b.updatedAt.getTime() - a.updatedAt.getTime() ||
              a.id.localeCompare(b.id),
          );

    return this.project(ranked.slice(0, limit), limit);
  }

  /** Collections owned by users the viewer follows. */
  private async discoverFollowing(
    viewerId: string,
    limit: number,
    tag: string | undefined,
  ): Promise<PaginatedPayload<CollectionResponse>> {
    const following = await this.follows.listFollowing(viewerId);
    const ownerIds = following.map((row) => row.followeeId);
    if (ownerIds.length === 0) {
      return new PaginatedPayload([], { next: null }, false, limit);
    }

    const rows = await this.prisma.collection.findMany({
      where: {
        ownerId: { in: ownerIds },
        visibility: 'public',
        deletedAt: null,
        ...(tag !== undefined ? { tags: { has: tag } } : {}),
      },
      include: {
        owner: true,
        entries: { orderBy: { position: 'asc' } },
        _count: { select: { followers: true } },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: Math.max(limit * CANDIDATE_POOL_MULTIPLIER, CANDIDATE_POOL_MIN),
    });

    const ranked = [...rows].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime() || a.id.localeCompare(b.id),
    );
    return this.project(ranked.slice(0, limit), limit);
  }

  /** Windowed follows (D3.22 trending style) — falls back to `top` when no window activity exists. */
  private async discoverTrending(
    limit: number,
    tag: string | undefined,
  ): Promise<PaginatedPayload<CollectionResponse>> {
    const since = new Date(Date.now() - TRENDING_WINDOW_MS);
    const trendingFollows = await this.prisma.collectionFollower.groupBy({
      by: ['collectionId'],
      where: { createdAt: { gte: since } },
      _count: { collectionId: true },
    });

    const scoreByCollectionId = new Map(
      trendingFollows.map((row) => [row.collectionId, row._count.collectionId]),
    );
    if (scoreByCollectionId.size === 0) {
      return this.discover({ sort: 'top', limit, ...(tag !== undefined ? { tag } : {}) });
    }

    const rows = await this.prisma.collection.findMany({
      where: {
        id: { in: [...scoreByCollectionId.keys()] },
        visibility: 'public',
        deletedAt: null,
        ...(tag !== undefined ? { tags: { has: tag } } : {}),
      },
      include: {
        owner: true,
        entries: { orderBy: { position: 'asc' } },
        _count: { select: { followers: true } },
      },
    });

    const ranked = [...rows].sort((a, b) => {
      const scoreDelta =
        (scoreByCollectionId.get(b.id) ?? 0) - (scoreByCollectionId.get(a.id) ?? 0);
      if (scoreDelta !== 0) {
        return scoreDelta;
      }
      return a.id.localeCompare(b.id);
    });

    return this.project(ranked.slice(0, limit), limit);
  }

  private async project(
    rows: CollectionWithRelations[],
    limit: number,
  ): Promise<PaginatedPayload<CollectionResponse>> {
    const gameIds = [...new Set(rows.flatMap((row) => row.entries.map((entry) => entry.gameId)))];
    const games =
      gameIds.length === 0
        ? []
        : await this.prisma.game.findMany({ where: { id: { in: gameIds } } });
    const gamesById = new Map(games.map((game) => [game.id, game]));
    const items = rows.map((row) =>
      toCollectionResponse(row, row.owner, row.entries, gamesById, row._count.followers),
    );
    return new PaginatedPayload(items, { next: null }, false, limit);
  }
}
