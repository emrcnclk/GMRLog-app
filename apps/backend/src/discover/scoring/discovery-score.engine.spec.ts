import { describe, expect, it } from 'vitest';

import {
  blendDiscoveryScore,
  buildDiscoveryScoreComponents,
  clamp0to100,
  computeCompletionScore,
  computeFreshnessScore,
  computePopularityScore,
  computeReviewScore,
  computeTrendingScore,
  computeWishlistScore,
  DISCOVERY_BLEND_WEIGHTS,
  normalizeCountScore,
} from './discovery-score.engine';

describe('clamp0to100', () => {
  it('clamps below zero and above 100', () => {
    expect(clamp0to100(-5)).toBe(0);
    expect(clamp0to100(150)).toBe(100);
    expect(clamp0to100(42.5)).toBe(42.5);
  });

  it('returns 0 for non-finite values', () => {
    expect(clamp0to100(Number.NaN)).toBe(0);
    expect(clamp0to100(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('normalizeCountScore', () => {
  it('returns 0 for empty or invalid counts', () => {
    expect(normalizeCountScore(0)).toBe(0);
    expect(normalizeCountScore(-1)).toBe(0);
    expect(normalizeCountScore(10, 0)).toBe(0);
  });

  it('grows with count and caps at 100', () => {
    expect(normalizeCountScore(1)).toBeGreaterThan(0);
    expect(normalizeCountScore(1_000)).toBe(100);
    expect(normalizeCountScore(10_000)).toBe(100);
  });
});

describe('component scores', () => {
  it('computes trending from recent event velocity', () => {
    expect(computeTrendingScore(0)).toBe(0);
    expect(computeTrendingScore(50)).toBeGreaterThan(computeTrendingScore(5));
  });

  it('combines popularity and library for popularityScore', () => {
    expect(computePopularityScore(0, 0)).toBe(0);
    expect(computePopularityScore(100, 50)).toBeGreaterThan(computePopularityScore(10, 5));
  });

  it('computes reviewScore as average × log(1+count)', () => {
    expect(computeReviewScore(null, 10)).toBe(0);
    expect(computeReviewScore(8, 0)).toBe(0);
    expect(computeReviewScore(8, 10)).toBe(clamp0to100(8 * Math.log1p(10)));
  });

  it('scores wishlist and completion shelves', () => {
    expect(computeWishlistScore(0)).toBe(0);
    expect(computeCompletionScore(25)).toBe(computeWishlistScore(25));
  });

  it('decays freshness from releaseDate and zeros missing dates', () => {
    const now = new Date('2026-07-29T00:00:00.000Z');
    expect(computeFreshnessScore(null, now)).toBe(0);
    expect(computeFreshnessScore(now, now)).toBe(100);
    const yearOld = new Date('2025-07-29T00:00:00.000Z');
    expect(computeFreshnessScore(yearOld, now)).toBeCloseTo(50, 0);
    const future = new Date('2027-01-01T00:00:00.000Z');
    expect(computeFreshnessScore(future, now)).toBe(100);
  });
});

describe('blendDiscoveryScore', () => {
  it('applies documented weights and clamps', () => {
    const components = {
      trendingScore: 100,
      popularityScore: 100,
      reviewScore: 100,
      wishlistScore: 100,
      completionScore: 100,
      freshnessScore: 100,
    };
    expect(blendDiscoveryScore(components)).toBe(100);

    const weightSum =
      DISCOVERY_BLEND_WEIGHTS.trending +
      DISCOVERY_BLEND_WEIGHTS.popularity +
      DISCOVERY_BLEND_WEIGHTS.review +
      DISCOVERY_BLEND_WEIGHTS.wishlist +
      DISCOVERY_BLEND_WEIGHTS.completion +
      DISCOVERY_BLEND_WEIGHTS.freshness;
    expect(weightSum).toBeCloseTo(1, 10);

    const half = blendDiscoveryScore({
      trendingScore: 100,
      popularityScore: 0,
      reviewScore: 0,
      wishlistScore: 0,
      completionScore: 0,
      freshnessScore: 0,
    });
    expect(half).toBeCloseTo(22, 5);
  });

  it('builds components then blends end-to-end', () => {
    const now = new Date('2026-07-29T00:00:00.000Z');
    const components = buildDiscoveryScoreComponents({
      recentEventCount: 20,
      gamePopularity: 50,
      libraryCount: 10,
      ratingAverage: 9,
      reviewCount: 5,
      wishlistCount: 8,
      completedCount: 4,
      releaseDate: now,
      now,
    });
    expect(components.freshnessScore).toBe(100);
    expect(components.reviewScore).toBeGreaterThan(0);
    expect(blendDiscoveryScore(components)).toBeGreaterThan(0);
    expect(blendDiscoveryScore(components)).toBeLessThanOrEqual(100);
  });
});
