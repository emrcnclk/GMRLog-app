import type { SimilarGameResponse, SimilarUserResponse } from '@gmrlog/types';
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../infrastructure/database/prisma.service';
import { toUserPublicResponse } from '../posts/mappers/post.mapper';

import { toGameCardResponse } from './mappers/game-card.mapper';
import { loadDiscoverGameRecords } from './mappers/load-discover-games';
import { loadUserSimilaritySignals } from './mappers/load-user-signals';
import {
  buildDnaMatch,
  computeGameSimilarityScore,
  computeUserSimilarityBreakdown,
  type GameSimilaritySignals,
  type UserSimilarityBreakdown,
  type UserSimilarityComponents,
} from './scoring/similarity.engine';

const CANDIDATE_CAP = 120;

/**
 * Similar games / users (D3.22 / SIMILARITY_ENGINE.md).
 * Reads cached pairs or computes overlap on the fly and upserts.
 */
@Injectable()
export class SimilarityService {
  constructor(private readonly prisma: PrismaService) {}

  async getSimilarGames(gameId: string, limit: number): Promise<SimilarGameResponse[]> {
    const game = await this.prisma.game.findUnique({ where: { id: gameId } });
    if (game === null) {
      throw new NotFoundException('Game not found');
    }

    const cached = await this.prisma.gameSimilarity.findMany({
      where: {
        OR: [{ gameAId: gameId }, { gameBId: gameId }],
      },
      orderBy: [{ score: 'desc' }, { id: 'asc' }],
      take: limit,
    });

    let pairs: { otherId: string; score: number }[] =
      cached.length > 0
        ? cached.map((row) => ({
            otherId: row.gameAId === gameId ? row.gameBId : row.gameAId,
            score: row.score,
          }))
        : await this.computeAndCacheGamePairs(gameId, limit);

    pairs = pairs.filter((row) => row.otherId !== gameId).slice(0, limit);
    const records = await loadDiscoverGameRecords(
      this.prisma,
      pairs.map((row) => row.otherId),
    );
    const byId = new Map(records.map((record) => [record.game.id, record]));

    return pairs.flatMap((pair) => {
      const record = byId.get(pair.otherId);
      if (record === undefined) {
        return [];
      }
      return [{ game: toGameCardResponse(record), score: pair.score }];
    });
  }

  async getSimilarUsers(userId: string, limit: number): Promise<SimilarUserResponse[]> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.deletedAt !== null) {
      throw new NotFoundException('User not found');
    }

    const blocked = await this.loadBlockedUserIds(userId);

    const cached = await this.prisma.userSimilarity.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      orderBy: [{ score: 'desc' }, { id: 'asc' }],
      take: limit + blocked.size,
    });

    let pairs: { otherId: string; score: number; components: UserSimilarityComponents }[] =
      cached.length > 0
        ? cached.map((row) => ({
            otherId: row.userAId === userId ? row.userBId : row.userAId,
            score: row.score,
            components: {
              library: row.library,
              genre: row.genre,
              reviewRating: row.reviewRating,
              wishlist: row.wishlist,
              completion: row.completion,
            },
          }))
        : await this.computeAndCacheUserPairs(userId, limit + blocked.size);

    pairs = pairs
      .filter((row) => row.otherId !== userId && !blocked.has(row.otherId))
      .slice(0, limit);

    const users = await this.prisma.user.findMany({
      where: { id: { in: pairs.map((row) => row.otherId) }, deletedAt: null },
    });
    const byId = new Map(users.map((row) => [row.id, row]));

    return pairs.flatMap((pair) => {
      const other = byId.get(pair.otherId);
      if (other === undefined) {
        return [];
      }
      const match =
        other.accountKind === 'individual' ? buildDnaMatch(pair.components, pair.score) : undefined;
      return [
        {
          user: toUserPublicResponse(other),
          score: pair.score,
          ...(match !== undefined ? { match } : {}),
        },
      ];
    });
  }

  private async computeAndCacheGamePairs(
    gameId: string,
    limit: number,
  ): Promise<{ otherId: string; score: number }[]> {
    const source = await this.loadGameSignals(gameId);
    if (source === null) {
      return [];
    }

    const genreIds = [...source.genreIds];
    const candidates =
      genreIds.length === 0
        ? await this.prisma.game.findMany({
            where: { id: { not: gameId } },
            take: CANDIDATE_CAP,
            orderBy: [{ popularity: 'desc' }, { id: 'asc' }],
          })
        : await this.prisma.game.findMany({
            where: {
              id: { not: gameId },
              genres: { some: { genreId: { in: genreIds } } },
            },
            take: CANDIDATE_CAP,
            orderBy: [{ popularity: 'desc' }, { id: 'asc' }],
          });

    const scored: { otherId: string; score: number }[] = [];
    for (const candidate of candidates) {
      const signals = await this.loadGameSignals(candidate.id);
      if (signals === null) {
        continue;
      }
      const score = computeGameSimilarityScore(source, signals);
      if (score <= 0) {
        continue;
      }
      scored.push({ otherId: candidate.id, score });
    }

    scored.sort((a, b) => b.score - a.score || a.otherId.localeCompare(b.otherId));
    const top = scored.slice(0, limit);

    await Promise.all(
      top.map((pair) => {
        const [gameAId, gameBId] =
          gameId < pair.otherId ? [gameId, pair.otherId] : [pair.otherId, gameId];
        return this.prisma.gameSimilarity.upsert({
          where: { gameAId_gameBId: { gameAId, gameBId } },
          create: { gameAId, gameBId, score: pair.score },
          update: { score: pair.score },
        });
      }),
    );

    return top;
  }

  private async computeAndCacheUserPairs(
    userId: string,
    limit: number,
  ): Promise<{ otherId: string; score: number; components: UserSimilarityComponents }[]> {
    const source = await loadUserSimilaritySignals(this.prisma, userId);
    if (source === null) {
      return [];
    }

    const libraryIds = [...source.libraryGameIds].slice(0, 40);
    const candidateIds = new Set<string>();

    if (libraryIds.length > 0) {
      const overlaps = await this.prisma.libraryEntry.findMany({
        where: {
          gameId: { in: libraryIds },
          userId: { not: userId },
        },
        select: { userId: true },
        take: CANDIDATE_CAP * 2,
      });
      for (const row of overlaps) {
        candidateIds.add(row.userId);
      }
    }

    if (candidateIds.size === 0) {
      const users = await this.prisma.user.findMany({
        where: { id: { not: userId }, deletedAt: null },
        take: CANDIDATE_CAP,
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      for (const row of users) {
        candidateIds.add(row.id);
      }
    }

    // 10.6 — was a sequential for-of, one candidate's queries awaited before
    // the next started: up to CANDIDATE_CAP (120) round trips end to end,
    // measured at ~1.6s on a cold cache against a real 250-owner overlap.
    // loadUserSimilaritySignals per candidate is independent (own userId),
    // so running them concurrently is a correctness-neutral latency fix,
    // not a behavior change — scoring and the sort below are unaffected by
    // resolution order.
    const capped = [...candidateIds].slice(0, CANDIDATE_CAP);
    const candidateSignals = await Promise.all(
      capped.map(
        async (otherId) =>
          [otherId, await loadUserSimilaritySignals(this.prisma, otherId)] as const,
      ),
    );
    const scored: { otherId: string; score: number; breakdown: UserSimilarityBreakdown }[] = [];
    for (const [otherId, signals] of candidateSignals) {
      if (signals === null) {
        continue;
      }
      const breakdown = computeUserSimilarityBreakdown(source, signals);
      if (breakdown.total <= 0) {
        continue;
      }
      scored.push({ otherId, score: breakdown.total, breakdown });
    }

    scored.sort((a, b) => b.score - a.score || a.otherId.localeCompare(b.otherId));
    const top = scored.slice(0, limit);

    await Promise.all(
      top.map((pair) => {
        const [userAId, userBId] =
          userId < pair.otherId ? [userId, pair.otherId] : [pair.otherId, userId];
        const components = {
          library: pair.breakdown.library,
          genre: pair.breakdown.genre,
          reviewRating: pair.breakdown.reviewRating,
          wishlist: pair.breakdown.wishlist,
          completion: pair.breakdown.completion,
        };
        return this.prisma.userSimilarity.upsert({
          where: { userAId_userBId: { userAId, userBId } },
          create: { userAId, userBId, score: pair.score, ...components },
          update: { score: pair.score, ...components },
        });
      }),
    );

    return top.map(({ otherId, score, breakdown }) => ({
      otherId,
      score,
      components: {
        library: breakdown.library,
        genre: breakdown.genre,
        reviewRating: breakdown.reviewRating,
        wishlist: breakdown.wishlist,
        completion: breakdown.completion,
      },
    }));
  }

  private async loadGameSignals(gameId: string): Promise<GameSimilaritySignals | null> {
    const game = await this.prisma.game.findUnique({ where: { id: gameId } });
    if (game === null) {
      return null;
    }
    // D3.25 — tags and companies are real catalog metadata now
    // (docs/18_CATALOG/GAME_METADATA_ARCHITECTURE.md §6). Games not yet
    // enriched return empty sets, and the engine falls back to its proxies.
    const [genres, platforms, rating, tags, companies] = await Promise.all([
      this.prisma.gameGenre.findMany({ where: { gameId }, select: { genreId: true } }),
      this.prisma.gamePlatform.findMany({ where: { gameId }, select: { platformId: true } }),
      this.prisma.review.aggregate({
        where: { gameId, deletedAt: null },
        _avg: { rating: true },
      }),
      this.prisma.gameTag.findMany({
        where: { gameId },
        select: { tagId: true, tag: { select: { kind: true } } },
      }),
      this.prisma.gameCompany.findMany({
        where: { gameId },
        select: { companyId: true, role: true },
      }),
    ]);

    const themeTagIds = new Set(
      tags.filter((row) => row.tag.kind === 'theme').map((row) => row.tagId),
    );
    const mechanicsTagIds = new Set(
      tags.filter((row) => row.tag.kind !== 'theme').map((row) => row.tagId),
    );

    return {
      genreIds: new Set(genres.map((row) => row.genreId)),
      platformIds: new Set(platforms.map((row) => row.platformId)),
      franchiseId: game.franchiseId,
      publisherProxyId: game.franchiseId,
      ratingAverage: rating._avg.rating,
      popularity: game.popularity,
      themeTagIds,
      mechanicsTagIds,
      publisherIds: new Set(
        companies.filter((row) => row.role === 'publisher').map((row) => row.companyId),
      ),
      developerIds: new Set(
        companies.filter((row) => row.role === 'developer').map((row) => row.companyId),
      ),
      seriesId: game.seriesId,
    };
  }

  private async loadBlockedUserIds(userId: string): Promise<Set<string>> {
    const rows = await this.prisma.block.findMany({
      where: {
        OR: [{ blockerId: userId }, { blockedId: userId }],
      },
      select: { blockerId: true, blockedId: true },
    });
    const blocked = new Set<string>();
    for (const row of rows) {
      if (row.blockerId !== userId) {
        blocked.add(row.blockerId);
      }
      if (row.blockedId !== userId) {
        blocked.add(row.blockedId);
      }
    }
    return blocked;
  }
}
