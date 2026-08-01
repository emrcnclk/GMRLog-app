/**
 * Pure discovery score formulas (D3.22 / DISCOVERY_SCORES.md).
 * Deterministic only — no AI / ML.
 */

export const DISCOVERY_BLEND_WEIGHTS = {
  trending: 0.22,
  popularity: 0.18,
  review: 0.18,
  wishlist: 0.14,
  completion: 0.1,
  freshness: 0.18,
} as const;

/** Reference count for log-normalization to 0–100. */
export const DISCOVERY_COUNT_REF = 1_000;

/** Popularity axis reference (Game.popularity + library). */
export const DISCOVERY_POPULARITY_REF = 10_000;

/** Freshness half-life in days (newer → higher). */
export const DISCOVERY_FRESHNESS_HALF_LIFE_DAYS = 365;

export interface DiscoveryScoreComponents {
  trendingScore: number;
  popularityScore: number;
  reviewScore: number;
  wishlistScore: number;
  completionScore: number;
  freshnessScore: number;
}

export function clamp0to100(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value <= 0) {
    return 0;
  }
  if (value >= 100) {
    return 100;
  }
  return value;
}

/** Maps a non-negative count onto 0–100 via log1p. */
export function normalizeCountScore(count: number, ref: number = DISCOVERY_COUNT_REF): number {
  if (!Number.isFinite(count) || count <= 0) {
    return 0;
  }
  if (!Number.isFinite(ref) || ref <= 0) {
    return 0;
  }
  return clamp0to100((Math.log1p(count) / Math.log1p(ref)) * 100);
}

/**
 * Recent activity velocity — sum of qualifying event counts in the window,
 * log-normalized to 0–100.
 */
export function computeTrendingScore(recentEventCount: number): number {
  return normalizeCountScore(recentEventCount);
}

/**
 * Normalized Game.popularity + library count.
 */
export function computePopularityScore(gamePopularity: number, libraryCount: number): number {
  const combined = Math.max(0, gamePopularity) + Math.max(0, libraryCount);
  return normalizeCountScore(combined, DISCOVERY_POPULARITY_REF);
}

/**
 * Rating average × log(1+count), clamped to 0–100.
 * Ratings are treated as 0–10 scale (product convention).
 */
export function computeReviewScore(ratingAverage: number | null, reviewCount: number): number {
  if (ratingAverage === null || !Number.isFinite(ratingAverage) || reviewCount <= 0) {
    return 0;
  }
  const raw = ratingAverage * Math.log1p(reviewCount);
  return clamp0to100(raw);
}

export function computeWishlistScore(wishlistCount: number): number {
  return normalizeCountScore(wishlistCount);
}

export function computeCompletionScore(completedCount: number): number {
  return normalizeCountScore(completedCount);
}

/**
 * Exponential decay from releaseDate — newer → higher.
 * Missing release date → 0.
 */
export function computeFreshnessScore(releaseDate: Date | null, now: Date = new Date()): number {
  if (releaseDate === null) {
    return 0;
  }
  const ageMs = now.getTime() - releaseDate.getTime();
  if (!Number.isFinite(ageMs)) {
    return 0;
  }
  if (ageMs <= 0) {
    return 100;
  }
  const ageDays = ageMs / (24 * 60 * 60 * 1000);
  const score = 100 * Math.pow(0.5, ageDays / DISCOVERY_FRESHNESS_HALF_LIFE_DAYS);
  return clamp0to100(score);
}

/**
 * Weighted blend per DISCOVERY_SCORES.md.
 */
export function blendDiscoveryScore(components: DiscoveryScoreComponents): number {
  const {
    trendingScore,
    popularityScore,
    reviewScore,
    wishlistScore,
    completionScore,
    freshnessScore,
  } = components;

  const blended =
    DISCOVERY_BLEND_WEIGHTS.trending * clamp0to100(trendingScore) +
    DISCOVERY_BLEND_WEIGHTS.popularity * clamp0to100(popularityScore) +
    DISCOVERY_BLEND_WEIGHTS.review * clamp0to100(reviewScore) +
    DISCOVERY_BLEND_WEIGHTS.wishlist * clamp0to100(wishlistScore) +
    DISCOVERY_BLEND_WEIGHTS.completion * clamp0to100(completionScore) +
    DISCOVERY_BLEND_WEIGHTS.freshness * clamp0to100(freshnessScore);

  return clamp0to100(blended);
}

export function buildDiscoveryScoreComponents(input: {
  recentEventCount: number;
  gamePopularity: number;
  libraryCount: number;
  ratingAverage: number | null;
  reviewCount: number;
  wishlistCount: number;
  completedCount: number;
  releaseDate: Date | null;
  now?: Date;
}): DiscoveryScoreComponents {
  return {
    trendingScore: computeTrendingScore(input.recentEventCount),
    popularityScore: computePopularityScore(input.gamePopularity, input.libraryCount),
    reviewScore: computeReviewScore(input.ratingAverage, input.reviewCount),
    wishlistScore: computeWishlistScore(input.wishlistCount),
    completionScore: computeCompletionScore(input.completedCount),
    freshnessScore: computeFreshnessScore(input.releaseDate, input.now ?? new Date()),
  };
}
