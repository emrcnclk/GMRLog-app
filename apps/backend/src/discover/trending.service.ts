import type { GameCardResponse, TrendingEntityValue, TrendingWindowValue } from '@gmrlog/types';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../infrastructure/database/prisma.service';
import { PaginatedPayload } from '../infrastructure/http/paginated-payload';

import { toGameCardResponse } from './mappers/game-card.mapper';
import { loadDiscoverGameRecords } from './mappers/load-discover-games';

export interface TrendingEntityHit {
  id: string;
  score: number;
}

const WINDOW_MS: Record<TrendingWindowValue, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

/**
 * Windowed trending counts (D3.22 / TRENDING_ENGINE.md).
 * Ranking = event count in window, then id asc — no AI boost.
 */
@Injectable()
export class TrendingService {
  constructor(private readonly prisma: PrismaService) {}

  async listTrending(input: {
    window?: TrendingWindowValue;
    entity?: TrendingEntityValue;
    limit: number;
  }): Promise<PaginatedPayload<GameCardResponse> | PaginatedPayload<TrendingEntityHit>> {
    const window: TrendingWindowValue = input.window ?? '7d';
    const entity: TrendingEntityValue = input.entity ?? 'games';
    const since = new Date(Date.now() - WINDOW_MS[window]);

    if (entity === 'games') {
      return this.trendingGames(since, input.limit);
    }
    return this.trendingEntities(entity, since, input.limit);
  }

  private async trendingGames(
    since: Date,
    limit: number,
  ): Promise<PaginatedPayload<GameCardResponse>> {
    const [libraryAdds, reviews, wishlistAdds] = await Promise.all([
      this.prisma.libraryEntry.groupBy({
        by: ['gameId'],
        where: { createdAt: { gte: since } },
        _count: { gameId: true },
      }),
      this.prisma.review.groupBy({
        by: ['gameId'],
        where: { deletedAt: null, createdAt: { gte: since } },
        _count: { gameId: true },
      }),
      this.prisma.libraryEntry.groupBy({
        by: ['gameId'],
        where: { status: 'wishlist', createdAt: { gte: since } },
        _count: { gameId: true },
      }),
    ]);

    const scores = new Map<string, number>();
    const bump = (rows: { gameId: string; _count: { gameId: number } }[]): void => {
      for (const row of rows) {
        scores.set(row.gameId, (scores.get(row.gameId) ?? 0) + row._count.gameId);
      }
    };
    bump(libraryAdds);
    bump(reviews);
    bump(wishlistAdds);

    const ranked = [...scores.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, limit);

    if (ranked.length === 0) {
      const fallback = await this.prisma.game.findMany({
        orderBy: [{ popularity: 'desc' }, { id: 'asc' }],
        take: limit,
      });
      const records = await loadDiscoverGameRecords(
        this.prisma,
        fallback.map((game) => game.id),
      );
      return new PaginatedPayload(records.map(toGameCardResponse), { next: null }, false, limit);
    }

    const records = await loadDiscoverGameRecords(
      this.prisma,
      ranked.map(([id]) => id),
    );
    return new PaginatedPayload(records.map(toGameCardResponse), { next: null }, false, limit);
  }

  private async trendingEntities(
    entity: Exclude<TrendingEntityValue, 'games'>,
    since: Date,
    limit: number,
  ): Promise<PaginatedPayload<TrendingEntityHit>> {
    let hits: TrendingEntityHit[] = [];

    switch (entity) {
      case 'reviews': {
        const rows = await this.prisma.review.findMany({
          where: { deletedAt: null, createdAt: { gte: since } },
          select: { id: true },
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          take: limit,
        });
        hits = rows.map((row, index) => ({ id: row.id, score: limit - index }));
        break;
      }
      case 'collections': {
        const follows = await this.prisma.collectionFollower.groupBy({
          by: ['collectionId'],
          where: { createdAt: { gte: since } },
          _count: { collectionId: true },
        });
        hits = follows
          .map((row) => ({ id: row.collectionId, score: row._count.collectionId }))
          .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
        break;
      }
      case 'users': {
        const follows = await this.prisma.follow.groupBy({
          by: ['followeeId'],
          where: { createdAt: { gte: since } },
          _count: { followeeId: true },
        });
        hits = follows
          .map((row) => ({ id: row.followeeId, score: row._count.followeeId }))
          .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
        break;
      }
      case 'communities': {
        const joins = await this.prisma.communityMember.groupBy({
          by: ['communityId'],
          where: { joinedAt: { gte: since } },
          _count: { communityId: true },
        });
        hits = joins
          .map((row) => ({ id: row.communityId, score: row._count.communityId }))
          .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
        break;
      }
      default: {
        const _exhaustive: never = entity;
        void _exhaustive;
        hits = [];
      }
    }

    return new PaginatedPayload(hits.slice(0, limit), { next: null }, false, limit);
  }
}
