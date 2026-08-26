import type { LibraryStatus, Review } from '@prisma/client';

import type { DatabaseClient } from './types';

export interface PlayerReviewMetric {
  id: string;
  rating: number;
  bodyLength: number;
  createdAt: Date;
}

export interface PlayerDatedRow {
  id: string;
  createdAt: Date;
}

export interface PlayerMetricSnapshot {
  libraryByStatus: ReadonlyMap<LibraryStatus, number>;
  libraryTotal: number;
  libraryEntries: readonly {
    id: string;
    gameId: string;
    status: LibraryStatus;
    platformId: string | null;
    createdAt: Date;
    /** 13.1 — null when the player has not said how far they got. */
    completionPercent: number | null;
  }[];
  sessionLogCount: number;
  /** GameLog kind=session occurredAt values (hoursPlayed proxy source). */
  sessionOccurredAts: readonly Date[];
  reviews: readonly PlayerReviewMetric[];
  posts: readonly PlayerDatedRow[];
  commentCount: number;
  followerCount: number;
  followingCount: number;
  friendCount: number;
  communityCount: number;
  collections: readonly PlayerDatedRow[];
  tierListCount: number;
  achievementAwardedCount: number;
  eventParticipationCount: number;
  genreCounts: ReadonlyMap<string, number>;
  platformCounts: ReadonlyMap<string, number>;
  franchiseCounts: ReadonlyMap<string, number>;
  /** Distinct UTC calendar days with library create or review create activity. */
  activeDayCount: number;
  hasAvatar: boolean;
  hasBio: boolean;
  hasBanner: boolean;
  joinedAt: Date;
}

/**
 * Aggregated player signals for D3.21 achievements, archetypes, and statistics.
 * Persistence/read aggregation only — scoring lives in domain services.
 */
export interface PlayerMetricsRepository {
  loadSnapshot(userId: string): Promise<PlayerMetricSnapshot | null>;
}

export class PrismaPlayerMetricsRepository implements PlayerMetricsRepository {
  constructor(private readonly db: DatabaseClient) {}

  async loadSnapshot(userId: string): Promise<PlayerMetricSnapshot | null> {
    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (user == null || user.deletedAt != null) {
      return null;
    }

    const [
      libraryEntries,
      sessionLogs,
      reviews,
      posts,
      commentCount,
      followerCount,
      followingCount,
      friendCount,
      communityIds,
      collections,
      tierLists,
      achievementAwardedCount,
      eventParticipationCount,
    ] = await Promise.all([
      this.db.libraryEntry.findMany({
        where: { userId },
        select: {
          id: true,
          gameId: true,
          status: true,
          platformId: true,
          createdAt: true,
          completionPercent: true,
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      this.db.gameLog.findMany({
        where: { kind: 'session', libraryEntry: { userId } },
        select: { occurredAt: true },
      }),
      this.db.review.findMany({
        where: { authorId: userId, deletedAt: null },
        select: { id: true, rating: true, body: true, createdAt: true },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      this.db.post.findMany({
        where: { authorId: userId, deletedAt: null },
        select: { id: true, createdAt: true },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      this.db.comment.count({ where: { authorId: userId, deletedAt: null } }),
      this.db.follow.count({ where: { followeeId: userId } }),
      this.db.follow.count({ where: { followerId: userId } }),
      this.db.friendship.count({
        where: { OR: [{ userLowId: userId }, { userHighId: userId }] },
      }),
      this.db.communityMember.findMany({
        where: { userId },
        select: { communityId: true },
      }),
      this.db.collection.findMany({
        where: { ownerId: userId, deletedAt: null },
        select: { id: true, createdAt: true },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      this.db.tierList.findMany({
        where: { ownerId: userId, deletedAt: null },
        select: { id: true },
      }),
      this.db.achievementProgress.count({
        where: { userId, state: 'awarded' },
      }),
      this.db.eventParticipation.count({ where: { userId } }),
    ]);

    const sessionOccurredAts = sessionLogs.map((row) => row.occurredAt);
    const sessionLogCount = sessionOccurredAts.length;

    const libraryByStatus = new Map<LibraryStatus, number>();
    for (const entry of libraryEntries) {
      libraryByStatus.set(entry.status, (libraryByStatus.get(entry.status) ?? 0) + 1);
    }

    const gameIds = [...new Set(libraryEntries.map((entry) => entry.gameId))];
    const [genreLinks, platformLinks, games] = await Promise.all([
      gameIds.length === 0
        ? Promise.resolve([])
        : this.db.gameGenre.findMany({
            where: { gameId: { in: gameIds } },
            include: { genre: true },
          }),
      gameIds.length === 0
        ? Promise.resolve([])
        : this.db.gamePlatform.findMany({
            where: { gameId: { in: gameIds } },
            include: { platform: true },
          }),
      gameIds.length === 0
        ? Promise.resolve([])
        : this.db.game.findMany({
            where: { id: { in: gameIds } },
            include: { franchise: true },
          }),
    ]);

    const genreCounts = new Map<string, number>();
    for (const link of genreLinks) {
      const name = link.genre.name;
      genreCounts.set(name, (genreCounts.get(name) ?? 0) + 1);
    }

    const platformCounts = new Map<string, number>();
    for (const entry of libraryEntries) {
      if (entry.platformId == null) {
        continue;
      }
      const link = platformLinks.find((row) => row.platformId === entry.platformId);
      const name = link?.platform.name;
      if (name != null) {
        platformCounts.set(name, (platformCounts.get(name) ?? 0) + 1);
      }
    }
    if (platformCounts.size === 0) {
      for (const link of platformLinks) {
        const name = link.platform.name;
        platformCounts.set(name, (platformCounts.get(name) ?? 0) + 1);
      }
    }

    const franchiseCounts = new Map<string, number>();
    for (const game of games) {
      const name = game.franchise?.name;
      if (name != null) {
        franchiseCounts.set(name, (franchiseCounts.get(name) ?? 0) + 1);
      }
    }

    const activeDays = new Set<string>();
    for (const entry of libraryEntries) {
      activeDays.add(entry.createdAt.toISOString().slice(0, 10));
    }
    for (const review of reviews) {
      activeDays.add(review.createdAt.toISOString().slice(0, 10));
    }

    return {
      libraryByStatus,
      libraryTotal: libraryEntries.length,
      libraryEntries,
      sessionLogCount,
      sessionOccurredAts,
      reviews: reviews.map((review) => toReviewMetric(review)),
      posts,
      commentCount,
      followerCount,
      followingCount,
      friendCount,
      communityCount: communityIds.length,
      collections,
      tierListCount: tierLists.length,
      achievementAwardedCount,
      eventParticipationCount,
      genreCounts,
      platformCounts,
      franchiseCounts,
      activeDayCount: activeDays.size,
      hasAvatar: user.avatarKey != null && user.avatarKey.length > 0,
      hasBio: user.bio != null && user.bio.trim().length > 0,
      hasBanner: user.bannerKey != null && user.bannerKey.length > 0,
      joinedAt: user.createdAt,
    };
  }
}

function toReviewMetric(
  review: Pick<Review, 'id' | 'rating' | 'body' | 'createdAt'>,
): PlayerReviewMetric {
  return {
    id: review.id,
    rating: review.rating,
    bodyLength: review.body?.length ?? 0,
    createdAt: review.createdAt,
  };
}
