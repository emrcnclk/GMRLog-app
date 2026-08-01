import { PaginatedPayload } from '../../infrastructure/http/paginated-payload';
import type { BecauseYouPlayedService } from '../because-you-played.service';
import type { DiscoveryScoreService } from '../discovery-score.service';
import type { RecommendationService } from '../recommendation.service';
import type { SimilarityService } from '../similarity.service';
import type { TrendingService } from '../trending.service';

/**
 * Lightweight fakes for D3.22 discovery collaborators (test support only).
 */

export function createFakeDiscoveryScoreService(
  overrides: Partial<DiscoveryScoreService> = {},
): DiscoveryScoreService {
  return {
    recomputeForGame: async () => ({
      gameId: 'game-1',
      trendingScore: 0,
      popularityScore: 0,
      reviewScore: 0,
      wishlistScore: 0,
      completionScore: 0,
      freshnessScore: 0,
      discoveryScore: 0,
      computedAt: new Date().toISOString(),
    }),
    listByScore: async (_sort, limit) => new PaginatedPayload([], { next: null }, false, limit),
    listHiddenGems: async (limit) => new PaginatedPayload([], { next: null }, false, limit),
    ...overrides,
  } as DiscoveryScoreService;
}

export function createFakeSimilarityService(
  overrides: Partial<SimilarityService> = {},
): SimilarityService {
  return {
    getSimilarGames: async () => [],
    getSimilarUsers: async () => [],
    ...overrides,
  } as SimilarityService;
}

export function createFakeRecommendationService(
  overrides: Partial<RecommendationService> = {},
): RecommendationService {
  return {
    recommendForUser: async () => [],
    ...overrides,
  } as RecommendationService;
}

export function createFakeTrendingService(
  overrides: Partial<TrendingService> = {},
): TrendingService {
  return {
    listTrending: async (input) => new PaginatedPayload([], { next: null }, false, input.limit),
    ...overrides,
  } as TrendingService;
}

export function createFakeBecauseYouPlayedService(
  overrides: Partial<{ build: BecauseYouPlayedService['build'] }> = {},
): BecauseYouPlayedService {
  return {
    build: async () => ({
      sourceGameId: '',
      sourceGameTitle: '',
      reasonKey: 'because_you_played',
      recommended: [],
      relatedReviews: [],
      collections: [],
      communities: [],
      events: [],
      guides: [],
      nextCursor: null,
    }),
    ...overrides,
  } as BecauseYouPlayedService;
}

export function createFakePrismaForDiscover(overrides: Record<string, unknown> = {}): {
  collection: {
    findMany: (...args: unknown[]) => Promise<unknown[]>;
  };
  game: {
    findMany: (...args: unknown[]) => Promise<unknown[]>;
  };
} {
  return {
    collection: {
      findMany: async () => [],
    },
    game: {
      findMany: async () => [],
    },
    ...overrides,
  };
}
