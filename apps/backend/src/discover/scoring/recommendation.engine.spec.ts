import { describe, expect, it } from 'vitest';

import {
  applyRuleBoost,
  blendRecommendationScore,
  guestRecommendationScore,
  normalizePopularity01,
  RECOMMENDATION_BLEND_WEIGHTS,
} from './recommendation.engine';

describe('RECOMMENDATION_BLEND_WEIGHTS', () => {
  it('sums to 1', () => {
    const sum = Object.values(RECOMMENDATION_BLEND_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
  });
});

describe('blendRecommendationScore', () => {
  it('returns 1 when all signals are maxed', () => {
    expect(
      blendRecommendationScore({
        genreSimilarity: 1,
        tagSimilarity: 1,
        wishlistSimilarity: 1,
        friendsActivity: 1,
        reviewSimilarity: 1,
        popularity: 1,
      }),
    ).toBe(1);
  });

  it('returns 0 when all signals are zero', () => {
    expect(
      blendRecommendationScore({
        genreSimilarity: 0,
        tagSimilarity: 0,
        wishlistSimilarity: 0,
        friendsActivity: 0,
        reviewSimilarity: 0,
        popularity: 0,
      }),
    ).toBe(0);
  });

  it('weights genre more heavily than popularity', () => {
    const genreOnly = blendRecommendationScore({
      genreSimilarity: 1,
      tagSimilarity: 0,
      wishlistSimilarity: 0,
      friendsActivity: 0,
      reviewSimilarity: 0,
      popularity: 0,
    });
    const popularityOnly = blendRecommendationScore({
      genreSimilarity: 0,
      tagSimilarity: 0,
      wishlistSimilarity: 0,
      friendsActivity: 0,
      reviewSimilarity: 0,
      popularity: 1,
    });
    expect(genreOnly).toBeCloseTo(0.25, 5);
    expect(popularityOnly).toBeCloseTo(0.1, 5);
    expect(genreOnly).toBeGreaterThan(popularityOnly);
  });
});

describe('applyRuleBoost / guest / normalize', () => {
  it('applies rule weight boost and clamps', () => {
    expect(applyRuleBoost(0.4, 1)).toBeCloseTo(0.65, 5);
    expect(applyRuleBoost(0.9, 10)).toBe(1);
    expect(applyRuleBoost(0.2, Number.NaN)).toBe(0.2);
  });

  it('blends guest popular + freshness and normalizes popularity', () => {
    expect(guestRecommendationScore(1, 1)).toBe(1);
    expect(guestRecommendationScore(0, 0)).toBe(0);
    expect(guestRecommendationScore(1, 0)).toBeCloseTo(0.6, 5);
    expect(normalizePopularity01(0)).toBe(0);
    expect(normalizePopularity01(1_000)).toBe(1);
    expect(normalizePopularity01(10)).toBeGreaterThan(0);
  });
});
