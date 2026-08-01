/**
 * Pure recommendation blend (D3.22 / RECOMMENDATION_RULES.md).
 * Rule-engine boost + formula blend — no AI.
 */

import { clamp01 } from './similarity.engine';

export const RECOMMENDATION_BLEND_WEIGHTS = {
  genreSimilarity: 0.25,
  tagSimilarity: 0.2,
  wishlistSimilarity: 0.15,
  friendsActivity: 0.15,
  reviewSimilarity: 0.15,
  popularity: 0.1,
} as const;

export interface RecommendationBlendInput {
  genreSimilarity: number;
  tagSimilarity: number;
  wishlistSimilarity: number;
  friendsActivity: number;
  reviewSimilarity: number;
  /** Normalized popularity signal in [0, 1]. */
  popularity: number;
}

/**
 * Formula score for GET /discover/recommended (before rule boost).
 */
export function blendRecommendationScore(input: RecommendationBlendInput): number {
  const score =
    RECOMMENDATION_BLEND_WEIGHTS.genreSimilarity * clamp01(input.genreSimilarity) +
    RECOMMENDATION_BLEND_WEIGHTS.tagSimilarity * clamp01(input.tagSimilarity) +
    RECOMMENDATION_BLEND_WEIGHTS.wishlistSimilarity * clamp01(input.wishlistSimilarity) +
    RECOMMENDATION_BLEND_WEIGHTS.friendsActivity * clamp01(input.friendsActivity) +
    RECOMMENDATION_BLEND_WEIGHTS.reviewSimilarity * clamp01(input.reviewSimilarity) +
    RECOMMENDATION_BLEND_WEIGHTS.popularity * clamp01(input.popularity);

  return clamp01(score);
}

/**
 * Applies active recommendation-rule weight as an additive boost, clamped to [0, 1].
 */
export function applyRuleBoost(baseScore: number, ruleWeight: number): number {
  const boost = Number.isFinite(ruleWeight) ? Math.max(0, ruleWeight) : 0;
  return clamp01(baseScore + boost * 0.25);
}

/**
 * Guest fallback: popular + freshness in [0, 1].
 */
export function guestRecommendationScore(popularity01: number, freshness01: number): number {
  return clamp01(0.6 * clamp01(popularity01) + 0.4 * clamp01(freshness01));
}

export function normalizePopularity01(popularity: number, ref = 1_000): number {
  if (!Number.isFinite(popularity) || popularity <= 0 || ref <= 0) {
    return 0;
  }
  return clamp01(Math.log1p(popularity) / Math.log1p(ref));
}
