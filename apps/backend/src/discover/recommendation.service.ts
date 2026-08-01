import type { RecommendedGameResponse } from '@gmrlog/types';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../infrastructure/database/prisma.service';

import { toGameCardResponse } from './mappers/game-card.mapper';
import { loadDiscoverGameRecords } from './mappers/load-discover-games';
import { computeFreshnessScore } from './scoring/discovery-score.engine';
import {
  applyRuleBoost,
  blendRecommendationScore,
  guestRecommendationScore,
  normalizePopularity01,
} from './scoring/recommendation.engine';
import { jaccardSimilarity } from './scoring/similarity.engine';

/**
 * Rule + formula recommendations (D3.22 / RECOMMENDATION_RULES.md).
 * Guest → popular + freshness; auth → library seeds + rules + blend.
 */
@Injectable()
export class RecommendationService {
  constructor(private readonly prisma: PrismaService) {}

  async recommendForUser(userId: string | null, limit: number): Promise<RecommendedGameResponse[]> {
    if (userId === null) {
      return this.recommendForGuest(limit);
    }
    return this.recommendForAuthenticated(userId, limit);
  }

  private async recommendForGuest(limit: number): Promise<RecommendedGameResponse[]> {
    const scores = await this.prisma.discoveryScore.findMany({
      orderBy: [{ discoveryScore: 'desc' }, { gameId: 'asc' }],
      take: limit,
      select: {
        gameId: true,
        popularityScore: true,
        freshnessScore: true,
        discoveryScore: true,
      },
    });

    if (scores.length > 0) {
      const records = await loadDiscoverGameRecords(
        this.prisma,
        scores.map((row) => row.gameId),
      );
      const byId = new Map(records.map((record) => [record.game.id, record]));
      return scores.flatMap((row) => {
        const record = byId.get(row.gameId);
        if (record === undefined) {
          return [];
        }
        const score = guestRecommendationScore(row.popularityScore / 100, row.freshnessScore / 100);
        return [
          {
            game: toGameCardResponse(record),
            score,
            reasonKey: 'popular_fresh',
          },
        ];
      });
    }

    const games = await this.prisma.game.findMany({
      orderBy: [{ popularity: 'desc' }, { id: 'asc' }],
      take: limit,
    });
    const records = await loadDiscoverGameRecords(
      this.prisma,
      games.map((game) => game.id),
    );
    const now = new Date();
    return records.map((record) => ({
      game: toGameCardResponse(record),
      score: guestRecommendationScore(
        normalizePopularity01(record.game.popularity),
        computeFreshnessScore(record.game.releaseDate, now) / 100,
      ),
      reasonKey: 'popular_fresh',
    }));
  }

  private async recommendForAuthenticated(
    userId: string,
    limit: number,
  ): Promise<RecommendedGameResponse[]> {
    const library = await this.prisma.libraryEntry.findMany({
      where: { userId },
      select: { gameId: true, status: true },
    });
    const seedGameIds = library.map((row) => row.gameId);
    const ownedSet = new Set(seedGameIds);
    const wishlistSet = new Set(
      library.filter((row) => row.status === 'wishlist').map((row) => row.gameId),
    );

    const [userGenreIds, userTagIds] = await Promise.all([
      this.loadGenreIds(seedGameIds),
      // D3.25 — real tags; empty until the catalog enriches the user's library.
      this.loadTagIds(seedGameIds),
    ]);

    const rules =
      seedGameIds.length === 0
        ? []
        : await this.prisma.recommendationRule.findMany({
            where: { seedGameId: { in: seedGameIds }, isActive: true },
            orderBy: [{ weight: 'desc' }, { id: 'asc' }],
          });

    const ruleByTarget = new Map<string, { weight: number; reasonKey: string }>();
    for (const rule of rules) {
      if (ownedSet.has(rule.targetGameId)) {
        continue;
      }
      const existing = ruleByTarget.get(rule.targetGameId);
      if (existing === undefined || rule.weight > existing.weight) {
        ruleByTarget.set(rule.targetGameId, {
          weight: rule.weight,
          reasonKey: rule.reasonKey,
        });
      }
    }

    const candidateIds = new Set<string>(ruleByTarget.keys());

    if (userGenreIds.size > 0) {
      const genreMatches = await this.prisma.game.findMany({
        where: {
          id: { notIn: [...ownedSet] },
          genres: { some: { genreId: { in: [...userGenreIds] } } },
        },
        take: 80,
        orderBy: [{ popularity: 'desc' }, { id: 'asc' }],
        select: { id: true },
      });
      for (const row of genreMatches) {
        candidateIds.add(row.id);
      }
    }

    if (candidateIds.size === 0) {
      return this.recommendForGuest(limit);
    }

    const candidates = [...candidateIds].slice(0, 100);
    const [records, friendActivity, candidateTags] = await Promise.all([
      loadDiscoverGameRecords(this.prisma, candidates),
      this.loadFriendsActivityScores(userId, candidates),
      this.loadTagsByGame(candidates),
    ]);

    const scored: RecommendedGameResponse[] = [];
    for (const record of records) {
      const genreOverlap = jaccardSimilarity(
        userGenreIds,
        new Set(record.genres.map((genre) => genre.id)),
      );
      // D3.25 — real tag overlap when both sides are enriched; the pre-D3.25
      // genre proxy otherwise, so scores stay comparable mid-backfill.
      const candidateTagIds = candidateTags.get(record.game.id) ?? new Set<string>();
      const tagSimilarity =
        userTagIds.size > 0 && candidateTagIds.size > 0
          ? jaccardSimilarity(userTagIds, candidateTagIds)
          : genreOverlap;
      const wishlistSimilarity = wishlistSet.has(record.game.id) ? 1 : 0;
      const friendsActivity = friendActivity.get(record.game.id) ?? 0;
      const reviewSimilarity =
        record.ratingAverage === null ? 0 : Math.min(1, record.ratingAverage / 10);
      const popularity = normalizePopularity01(record.game.popularity);

      let score = blendRecommendationScore({
        genreSimilarity: genreOverlap,
        tagSimilarity,
        wishlistSimilarity,
        friendsActivity,
        reviewSimilarity,
        popularity,
      });

      const rule = ruleByTarget.get(record.game.id);
      let reasonKey = 'because_you_played';
      if (rule !== undefined) {
        score = applyRuleBoost(score, rule.weight);
        reasonKey = rule.reasonKey;
      } else if (genreOverlap > 0) {
        reasonKey = 'genre_overlap';
      } else {
        reasonKey = 'popularity';
      }

      scored.push({
        game: toGameCardResponse(record),
        score,
        reasonKey,
      });
    }

    scored.sort((a, b) => b.score - a.score || a.game.id.localeCompare(b.game.id));
    return scored.slice(0, limit);
  }

  private async loadGenreIds(gameIds: string[]): Promise<Set<string>> {
    if (gameIds.length === 0) {
      return new Set();
    }
    const links = await this.prisma.gameGenre.findMany({
      where: { gameId: { in: gameIds } },
      select: { genreId: true },
    });
    return new Set(links.map((row) => row.genreId));
  }

  /** D3.25 — the user's tag profile from real catalog tags. */
  private async loadTagIds(gameIds: string[]): Promise<Set<string>> {
    if (gameIds.length === 0) {
      return new Set();
    }
    const links = await this.prisma.gameTag.findMany({
      where: { gameId: { in: gameIds } },
      select: { tagId: true },
    });
    return new Set(links.map((row) => row.tagId));
  }

  /** D3.25 — candidate tag sets, one query for the whole candidate page. */
  private async loadTagsByGame(gameIds: string[]): Promise<Map<string, Set<string>>> {
    const byGame = new Map<string, Set<string>>();
    if (gameIds.length === 0) {
      return byGame;
    }
    const links = await this.prisma.gameTag.findMany({
      where: { gameId: { in: gameIds } },
      select: { gameId: true, tagId: true },
    });
    for (const link of links) {
      const set = byGame.get(link.gameId) ?? new Set<string>();
      set.add(link.tagId);
      byGame.set(link.gameId, set);
    }
    return byGame;
  }

  private async loadFriendsActivityScores(
    userId: string,
    gameIds: string[],
  ): Promise<Map<string, number>> {
    const scores = new Map<string, number>();
    if (gameIds.length === 0) {
      return scores;
    }

    const friendships = await this.prisma.friendRequest.findMany({
      where: {
        status: 'accepted',
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      select: { senderId: true, receiverId: true },
    });
    const friendIds = friendships.map((row) =>
      row.senderId === userId ? row.receiverId : row.senderId,
    );
    if (friendIds.length === 0) {
      return scores;
    }

    const entries = await this.prisma.libraryEntry.groupBy({
      by: ['gameId'],
      where: {
        userId: { in: friendIds },
        gameId: { in: gameIds },
      },
      _count: { gameId: true },
    });

    const max = Math.max(1, ...entries.map((row) => row._count.gameId));
    for (const row of entries) {
      scores.set(row.gameId, row._count.gameId / max);
    }
    return scores;
  }
}
