import type { User } from '@gmrlog/database';
import type { DnaMatchResponse } from '@gmrlog/types';
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../infrastructure/database/prisma.service';
import { toUserPublicResponse } from '../posts/mappers/post.mapper';

import { toGameCardResponse } from './mappers/game-card.mapper';
import { loadDiscoverGameRecords } from './mappers/load-discover-games';
import { loadUserSimilaritySignals } from './mappers/load-user-signals';
import { buildDnaVerdict, DNA_THIN_DATA_VERDICT } from './scoring/dna-verdict';
import {
  buildDnaDimensions,
  clamp01,
  computeUserSimilarityBreakdown,
  dnaBandForPercent,
  type UserSimilarityComponents,
} from './scoring/similarity.engine';

/** §4's own example threshold: below this, never headline a real percent. */
const MIN_SHARED_GAMES = 3;
const SHARED_GAMES_CAP = 8;

const ZERO_COMPONENTS: UserSimilarityComponents = {
  library: 0,
  genre: 0,
  reviewRating: 0,
  wishlist: 0,
  completion: 0,
};

/**
 * 5.4 (`BACKEND_CHANGES.md` §4) — `GET /users/:id/dna-match`. Breakdown +
 * verdict + shared games, on top of 5.1-5.3's engine. `traits` is always `[]`
 * here — reusing the archetype engine for real labels is 5.5's own task, not
 * bundled into this diff.
 */
@Injectable()
export class DnaMatchService {
  constructor(private readonly prisma: PrismaService) {}

  async getDnaMatch(viewerId: string, targetId: string): Promise<DnaMatchResponse> {
    const [, target] = await Promise.all([
      this.requireActiveUser(viewerId),
      this.requireActiveUser(targetId),
    ]);
    await this.assertNotBlockedEitherDirection(viewerId, targetId);

    if (target.accountKind !== 'individual') {
      return {
        user: toUserPublicResponse(target),
        applicable: false,
        percent: 0,
        band: 'different',
        dimensions: buildDnaDimensions(ZERO_COMPONENTS),
        verdict: 'DNA match is not available for organisation accounts.',
        traits: [],
        sharedGames: [],
      };
    }

    const [source, other] = await Promise.all([
      loadUserSimilaritySignals(this.prisma, viewerId),
      loadUserSimilaritySignals(this.prisma, targetId),
    ]);
    if (source === null || other === null) {
      throw new NotFoundException('User not found');
    }

    const breakdown = computeUserSimilarityBreakdown(source, other);
    const components: UserSimilarityComponents = {
      library: breakdown.library,
      genre: breakdown.genre,
      reviewRating: breakdown.reviewRating,
      wishlist: breakdown.wishlist,
      completion: breakdown.completion,
    };

    const sharedGameIds = [...source.libraryGameIds].filter((id) => other.libraryGameIds.has(id));
    const sharedReviewedCount = [...source.reviewRatings.keys()].filter((id) =>
      other.reviewRatings.has(id),
    ).length;

    const sharedGames = await this.loadSharedGames(viewerId, sharedGameIds);
    const dimensions = buildDnaDimensions(components);
    const user = toUserPublicResponse(target);

    if (sharedGameIds.length < MIN_SHARED_GAMES && sharedReviewedCount === 0) {
      return {
        user,
        applicable: true,
        percent: 0,
        band: 'different',
        dimensions,
        verdict: DNA_THIN_DATA_VERDICT,
        traits: [],
        sharedGames,
      };
    }

    const percent = Math.round(clamp01(breakdown.total) * 100);
    return {
      user,
      applicable: true,
      percent,
      band: dnaBandForPercent(percent),
      dimensions,
      verdict: buildDnaVerdict(components),
      traits: [],
      sharedGames,
    };
  }

  private async requireActiveUser(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.deletedAt !== null) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /** Consistent with `getSimilarUsers`, which already filters blocked ids either direction. */
  private async assertNotBlockedEitherDirection(viewerId: string, targetId: string): Promise<void> {
    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: viewerId, blockedId: targetId },
          { blockerId: targetId, blockedId: viewerId },
        ],
      },
      select: { id: true },
    });
    if (block !== null) {
      throw new NotFoundException('User not found');
    }
  }

  /**
   * §4: "ordered by the viewer's playtime". No per-game playtime field exists
   * anywhere in the schema (only aggregate `hoursPlayed` on
   * `UserStatisticsResponse`, and Steam-import `ExternalGame.playtimeForeverMin`,
   * which isn't reliably joined to every user's internal library rows) — the
   * same class of spec-vs-schema gap 3.1's `holderPercent` and 3.9's per-entry
   * fields already documented, not invented here. The closest real signal is
   * the viewer's own `LibraryEntry.updatedAt`: most-recently-touched first.
   */
  private async loadSharedGames(
    viewerId: string,
    sharedGameIds: string[],
  ): Promise<DnaMatchResponse['sharedGames']> {
    if (sharedGameIds.length === 0) {
      return [];
    }

    const entries = await this.prisma.libraryEntry.findMany({
      where: { userId: viewerId, gameId: { in: sharedGameIds } },
      select: { gameId: true, updatedAt: true },
    });
    const updatedAtByGame = new Map(entries.map((row) => [row.gameId, row.updatedAt.getTime()]));

    const ordered = [...sharedGameIds].sort((a, b) => {
      const byRecency = (updatedAtByGame.get(b) ?? 0) - (updatedAtByGame.get(a) ?? 0);
      return byRecency !== 0 ? byRecency : a.localeCompare(b);
    });

    const records = await loadDiscoverGameRecords(this.prisma, ordered.slice(0, SHARED_GAMES_CAP));
    return records.map(toGameCardResponse);
  }
}
