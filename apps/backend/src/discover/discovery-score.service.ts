import type { DiscoveryScoreResponse, GameCardResponse } from '@gmrlog/types';
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../infrastructure/database/prisma.service';
import { PaginatedPayload } from '../infrastructure/http/paginated-payload';

import { toGameCardResponse } from './mappers/game-card.mapper';
import { loadDiscoverGameRecords } from './mappers/load-discover-games';
import {
  blendDiscoveryScore,
  buildDiscoveryScoreComponents,
} from './scoring/discovery-score.engine';

export type DiscoveryScoreSort = 'discovery' | 'trending' | 'popular' | 'review';

const TRENDING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Persists formula discovery scores (D3.22 / DISCOVERY_SCORES.md).
 */
@Injectable()
export class DiscoveryScoreService {
  constructor(private readonly prisma: PrismaService) {}

  async recomputeForGame(gameId: string): Promise<DiscoveryScoreResponse> {
    const game = await this.prisma.game.findUnique({ where: { id: gameId } });
    if (game === null) {
      throw new NotFoundException('Game not found');
    }

    const since = new Date(Date.now() - TRENDING_WINDOW_MS);

    const [
      reviewAgg,
      wishlistCount,
      completedCount,
      libraryCount,
      recentLibrary,
      recentReviews,
      recentWishlist,
    ] = await Promise.all([
      this.prisma.review.aggregate({
        where: { gameId, deletedAt: null },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.libraryEntry.count({ where: { gameId, status: 'wishlist' } }),
      this.prisma.libraryEntry.count({ where: { gameId, status: 'completed' } }),
      this.prisma.libraryEntry.count({ where: { gameId } }),
      this.prisma.libraryEntry.count({ where: { gameId, createdAt: { gte: since } } }),
      this.prisma.review.count({ where: { gameId, deletedAt: null, createdAt: { gte: since } } }),
      this.prisma.libraryEntry.count({
        where: { gameId, status: 'wishlist', createdAt: { gte: since } },
      }),
    ]);

    const components = buildDiscoveryScoreComponents({
      recentEventCount: recentLibrary + recentReviews + recentWishlist,
      gamePopularity: game.popularity,
      libraryCount,
      ratingAverage: reviewAgg._avg.rating,
      reviewCount: reviewAgg._count.rating,
      wishlistCount,
      completedCount,
      releaseDate: game.releaseDate,
    });
    const discoveryScore = blendDiscoveryScore(components);
    const computedAt = new Date();

    const row = await this.prisma.discoveryScore.upsert({
      where: { gameId },
      create: {
        gameId,
        trendingScore: components.trendingScore,
        popularityScore: components.popularityScore,
        reviewScore: components.reviewScore,
        wishlistScore: components.wishlistScore,
        completionScore: components.completionScore,
        freshnessScore: components.freshnessScore,
        discoveryScore,
        computedAt,
      },
      update: {
        trendingScore: components.trendingScore,
        popularityScore: components.popularityScore,
        reviewScore: components.reviewScore,
        wishlistScore: components.wishlistScore,
        completionScore: components.completionScore,
        freshnessScore: components.freshnessScore,
        discoveryScore,
        computedAt,
      },
    });

    return toDiscoveryScoreResponse(row);
  }

  async listByScore(
    sort: DiscoveryScoreSort,
    limit: number,
  ): Promise<PaginatedPayload<GameCardResponse>> {
    const orderField = resolveOrderField(sort);
    const rows = await this.prisma.discoveryScore.findMany({
      orderBy: [{ [orderField]: 'desc' }, { gameId: 'asc' }],
      take: limit,
      select: { gameId: true },
    });
    const gameIds = rows.map((row) => row.gameId);
    const records = await loadDiscoverGameRecords(this.prisma, gameIds);
    return new PaginatedPayload(records.map(toGameCardResponse), { next: null }, false, limit);
  }

  /**
   * High reviewScore · low popularityScore (hidden gems).
   * Falls back to ratingAvg high + libraryCount low when scores table is empty.
   */
  async listHiddenGems(limit: number): Promise<PaginatedPayload<GameCardResponse>> {
    const scored = await this.prisma.discoveryScore.findMany({
      where: {
        reviewScore: { gte: 40 },
        popularityScore: { lte: 45 },
      },
      orderBy: [{ reviewScore: 'desc' }, { popularityScore: 'asc' }, { gameId: 'asc' }],
      take: limit,
      select: { gameId: true },
    });

    if (scored.length > 0) {
      const records = await loadDiscoverGameRecords(
        this.prisma,
        scored.map((row) => row.gameId),
      );
      return new PaginatedPayload(records.map(toGameCardResponse), { next: null }, false, limit);
    }

    const games = await this.prisma.game.findMany({
      take: Math.max(limit * 4, 40),
      orderBy: [{ popularity: 'asc' }, { id: 'asc' }],
    });
    const records = await loadDiscoverGameRecords(
      this.prisma,
      games.map((game) => game.id),
    );
    const gems = records
      .filter(
        (row) => (row.ratingAverage ?? 0) >= 7 && row.ratingCount >= 1 && row.libraryCount <= 25,
      )
      .sort((a, b) => {
        const ratingDelta = (b.ratingAverage ?? 0) - (a.ratingAverage ?? 0);
        if (ratingDelta !== 0) {
          return ratingDelta;
        }
        if (a.libraryCount !== b.libraryCount) {
          return a.libraryCount - b.libraryCount;
        }
        return a.game.id.localeCompare(b.game.id);
      })
      .slice(0, limit);

    return new PaginatedPayload(gems.map(toGameCardResponse), { next: null }, false, limit);
  }
}

function resolveOrderField(
  sort: DiscoveryScoreSort,
): 'discoveryScore' | 'trendingScore' | 'popularityScore' | 'reviewScore' {
  switch (sort) {
    case 'trending':
      return 'trendingScore';
    case 'popular':
      return 'popularityScore';
    case 'review':
      return 'reviewScore';
    default:
      return 'discoveryScore';
  }
}

function toDiscoveryScoreResponse(row: {
  gameId: string;
  trendingScore: number;
  popularityScore: number;
  reviewScore: number;
  wishlistScore: number;
  completionScore: number;
  freshnessScore: number;
  discoveryScore: number;
  computedAt: Date;
}): DiscoveryScoreResponse {
  return {
    gameId: row.gameId,
    trendingScore: row.trendingScore,
    popularityScore: row.popularityScore,
    reviewScore: row.reviewScore,
    wishlistScore: row.wishlistScore,
    completionScore: row.completionScore,
    freshnessScore: row.freshnessScore,
    discoveryScore: row.discoveryScore,
    computedAt: row.computedAt.toISOString(),
  };
}
