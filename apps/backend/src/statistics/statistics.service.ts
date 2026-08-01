import type {
  PlayerDatedRow,
  PlayerMetricSnapshot,
  PlayerMetricsRepository,
  PlayerReviewMetric,
  UserRepository,
} from '@gmrlog/database';
import type {
  StatisticsHistoryResponse,
  StatisticsSeriesPoint,
  UserStatisticsResponse,
} from '@gmrlog/types';
import type { StatisticsPeriodInput } from '@gmrlog/validators';
import { Inject, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';

import { ArchetypeEngineService } from '../archetypes/archetype-engine.service';

import { STATISTICS_METRICS_REPOSITORY, STATISTICS_USER_REPOSITORY } from './statistics.tokens';

/**
 * User statistics aggregation (D3.21).
 * hoursPlayed = GameLog kind=session count (honest hours proxy; no playtime column).
 * Public stats for non-deleted users (no privacy entity beyond soft-delete).
 */
@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);

  constructor(
    @Inject(STATISTICS_METRICS_REPOSITORY) private readonly metrics: PlayerMetricsRepository,
    @Inject(STATISTICS_USER_REPOSITORY) private readonly users: UserRepository,
    @Optional() private readonly archetypes?: ArchetypeEngineService,
  ) {}

  async build(
    userId: string,
    period: StatisticsPeriodInput = 'lifetime',
    options: { refreshArchetypes: boolean } = { refreshArchetypes: false },
  ): Promise<UserStatisticsResponse> {
    await this.requireActiveUser(userId);
    const snapshot = await this.metrics.loadSnapshot(userId);
    if (snapshot == null) {
      throw new NotFoundException('User not found');
    }

    if (options.refreshArchetypes && this.archetypes != null) {
      try {
        await this.archetypes.recalculate(userId);
      } catch (error: unknown) {
        this.logger.warn(
          `Archetype refresh on statistics failed for ${userId}: ${
            error instanceof Error ? error.message : 'unknown'
          }`,
        );
      }
    }

    const windowStart = periodWindowStart(period);
    const libraryEntries = filterByCreatedAt(snapshot.libraryEntries, windowStart);
    const reviews = filterByCreatedAt(snapshot.reviews, windowStart);
    const posts = filterByCreatedAt(snapshot.posts, windowStart);
    const collections = filterByCreatedAt(snapshot.collections, windowStart);

    const statusCount = (status: string): number =>
      libraryEntries.filter((entry) => entry.status === status).length;

    const gamesLogged = libraryEntries.length;
    const gamesCompleted = statusCount('completed');
    const gamesDropped = statusCount('dropped');
    const backlogSize = statusCount('backlog');
    const wishlistSize = statusCount('wishlist');
    const gamesPlayed = statusCount('playing') + gamesCompleted + gamesDropped;

    const hoursPlayed =
      windowStart == null
        ? snapshot.sessionLogCount
        : snapshot.sessionOccurredAts.filter((at) => at >= windowStart).length;

    const averageRating =
      reviews.length === 0
        ? null
        : Number(
            (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(2),
          );

    const completionPercent =
      gamesLogged === 0 ? 0 : Math.round((gamesCompleted / gamesLogged) * 100);

    const profileCompletionPercent = computeProfileCompletionPercent(snapshot);

    return {
      gamesLogged,
      gamesPlayed,
      gamesCompleted,
      gamesDropped,
      backlogSize,
      wishlistSize,
      hoursPlayed,
      averageRating,
      completionPercent,
      reviewCount: reviews.length,
      postCount: posts.length,
      commentCount: period === 'lifetime' ? snapshot.commentCount : 0,
      followerCount: snapshot.followerCount,
      followingCount: snapshot.followingCount,
      friendCount: snapshot.friendCount,
      communityCount: snapshot.communityCount,
      collectionCount: collections.length,
      tierListCount: period === 'lifetime' ? snapshot.tierListCount : 0,
      achievementCount: snapshot.achievementAwardedCount,
      favoriteGenres: topKeys(snapshot.genreCounts, 3),
      favoritePlatform: topKeys(snapshot.platformCounts, 1)[0] ?? null,
      favoriteDeveloper: topKeys(snapshot.franchiseCounts, 1)[0] ?? null,
      favoritePublisher: null,
      profileCompletionPercent,
      period,
      joinedAt: snapshot.joinedAt.toISOString(),
    };
  }

  async history(
    userId: string,
    period: Exclude<StatisticsPeriodInput, 'lifetime'> | 'lifetime' = 'monthly',
  ): Promise<StatisticsHistoryResponse> {
    await this.requireActiveUser(userId);
    const snapshot = await this.metrics.loadSnapshot(userId);
    if (snapshot == null) {
      throw new NotFoundException('User not found');
    }

    const bucketPeriod: StatisticsHistoryResponse['period'] =
      period === 'lifetime' ? 'monthly' : period;

    const completedEntries = snapshot.libraryEntries.filter(
      (entry) => entry.status === 'completed',
    );
    const completions = bucketSeries(
      completedEntries.map((entry) => entry.createdAt),
      bucketPeriod,
    );
    const ratings = bucketSeries(
      snapshot.reviews.map((review) => review.createdAt),
      bucketPeriod,
      snapshot.reviews.map((review) => review.rating),
    );
    const collectionGrowth = bucketSeries(
      snapshot.collections.map((row) => row.createdAt),
      bucketPeriod,
    );
    const reviewGrowth = bucketSeries(
      snapshot.reviews.map((review) => review.createdAt),
      bucketPeriod,
    );

    return {
      period: bucketPeriod,
      completions,
      ratings,
      collectionGrowth,
      reviewGrowth,
    };
  }

  private async requireActiveUser(userId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (user == null || user.deletedAt != null) {
      throw new NotFoundException('User not found');
    }
  }
}

function periodWindowStart(period: StatisticsPeriodInput): Date | null {
  if (period === 'lifetime') {
    return null;
  }
  const now = Date.now();
  const ms =
    period === 'daily'
      ? 24 * 60 * 60 * 1000
      : period === 'weekly'
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;
  return new Date(now - ms);
}

function filterByCreatedAt<T extends { createdAt: Date }>(
  rows: readonly T[],
  windowStart: Date | null,
): T[] {
  if (windowStart == null) {
    return [...rows];
  }
  return rows.filter((row) => row.createdAt >= windowStart);
}

function computeProfileCompletionPercent(snapshot: PlayerMetricSnapshot): number {
  let filled = 1; // handle always present for active users
  if (snapshot.hasAvatar) filled += 1;
  if (snapshot.hasBio) filled += 1;
  if (snapshot.hasBanner) filled += 1;
  return Math.round((filled / 4) * 100);
}

function topKeys(map: ReadonlyMap<string, number>, limit: number): string[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key]) => key);
}

function bucketSeries(
  dates: readonly Date[],
  period: 'daily' | 'weekly' | 'monthly',
  values?: readonly number[],
): StatisticsSeriesPoint[] {
  const buckets = new Map<string, { sum: number; count: number }>();
  dates.forEach((date, index) => {
    const key = bucketKey(date, period);
    const current = buckets.get(key) ?? { sum: 0, count: 0 };
    const value = values?.[index] ?? 1;
    buckets.set(key, { sum: current.sum + value, count: current.count + 1 });
  });

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, agg]) => ({
      date,
      value: values == null ? agg.count : Number((agg.sum / Math.max(1, agg.count)).toFixed(2)),
    }));
}

function bucketKey(date: Date, period: 'daily' | 'weekly' | 'monthly'): string {
  const iso = date.toISOString();
  if (period === 'daily') {
    return iso.slice(0, 10);
  }
  if (period === 'monthly') {
    return iso.slice(0, 7);
  }
  // weekly — ISO week start (Monday) as date key
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() - day + 1);
  return utc.toISOString().slice(0, 10);
}

export type { PlayerDatedRow, PlayerReviewMetric };
