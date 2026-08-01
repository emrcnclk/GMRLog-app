import { describe, expect, it } from 'vitest';

import {
  clamp01,
  computeGameSimilarityScore,
  computeUserSimilarityScore,
  equalityOverlap,
  GAME_SIMILARITY_WEIGHTS,
  jaccardSimilarity,
  popularityBand,
  ratingBand,
  reviewRatingSimilarity,
  USER_SIMILARITY_WEIGHTS,
} from './similarity.engine';
import type { GameSimilaritySignals } from './similarity.engine';

describe('clamp01', () => {
  it('clamps and rejects non-finite', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(Number.NaN)).toBe(0);
  });
});

describe('jaccardSimilarity', () => {
  it('returns 0 for empty sets', () => {
    expect(jaccardSimilarity(new Set(), new Set())).toBe(0);
  });

  it('returns 1 for identical sets', () => {
    expect(jaccardSimilarity(new Set(['a', 'b']), new Set(['b', 'a']))).toBe(1);
  });

  it('returns partial overlap ratios', () => {
    expect(jaccardSimilarity(new Set(['a', 'b']), new Set(['b', 'c']))).toBeCloseTo(1 / 3, 5);
  });
});

describe('equalityOverlap / bands', () => {
  it('equalityOverlap handles null and mismatch', () => {
    expect(equalityOverlap(null, 'x')).toBe(0);
    expect(equalityOverlap('a', 'a')).toBe(1);
    expect(equalityOverlap('a', 'b')).toBe(0);
  });

  it('maps rating and popularity bands', () => {
    expect(ratingBand(null)).toBeNull();
    expect(ratingBand(3)).toBe('low');
    expect(ratingBand(5)).toBe('mid');
    expect(ratingBand(8)).toBe('high');
    expect(ratingBand(9.5)).toBe('elite');
    expect(popularityBand(5)).toBe('niche');
    expect(popularityBand(50)).toBe('rising');
    expect(popularityBand(500)).toBe('popular');
    expect(popularityBand(5_000)).toBe('mainstream');
  });
});

describe('computeGameSimilarityScore', () => {
  it('weights sum to 1', () => {
    const sum = Object.values(GAME_SIMILARITY_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
  });

  it('scores identical games near 1', () => {
    const signals = {
      genreIds: new Set(['g1', 'g2']),
      platformIds: new Set(['p1']),
      franchiseId: 'fr-1',
      publisherProxyId: 'fr-1',
      ratingAverage: 8,
      popularity: 200,
    };
    expect(computeGameSimilarityScore(signals, signals)).toBeGreaterThan(0.9);
  });

  it('scores disjoint games near 0', () => {
    const left = {
      genreIds: new Set(['g1']),
      platformIds: new Set(['p1']),
      franchiseId: 'fr-1',
      publisherProxyId: 'fr-1',
      ratingAverage: 9,
      popularity: 5_000,
    };
    const right = {
      genreIds: new Set(['g9']),
      platformIds: new Set(['p9']),
      franchiseId: 'fr-9',
      publisherProxyId: 'fr-9',
      ratingAverage: 2,
      popularity: 5,
    };
    expect(computeGameSimilarityScore(left, right)).toBeLessThan(0.15);
  });
});

describe('reviewRatingSimilarity / computeUserSimilarityScore', () => {
  it('returns 0 without shared reviews', () => {
    expect(reviewRatingSimilarity(new Map([['g1', 8]]), new Map([['g2', 8]]))).toBe(0);
  });

  it('rewards agreeing ratings on shared games', () => {
    const left = new Map([
      ['g1', 8],
      ['g2', 9],
    ]);
    const right = new Map([
      ['g1', 8],
      ['g2', 7],
    ]);
    expect(reviewRatingSimilarity(left, right)).toBeGreaterThan(0.8);
  });

  it('weights user dimensions to 1 and scores library overlap', () => {
    const sum = Object.values(USER_SIMILARITY_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);

    const left = {
      libraryGameIds: new Set(['a', 'b', 'c']),
      genreIds: new Set(['rpg']),
      wishlistGameIds: new Set(['w1']),
      completedGameIds: new Set(['a']),
      reviewRatings: new Map([['a', 9]]),
    };
    const right = {
      libraryGameIds: new Set(['b', 'c', 'd']),
      genreIds: new Set(['rpg']),
      wishlistGameIds: new Set(['w1']),
      completedGameIds: new Set(['a']),
      reviewRatings: new Map([['a', 9]]),
    };
    const score = computeUserSimilarityScore(left, right);
    expect(score).toBeGreaterThan(0.4);
    expect(score).toBeLessThanOrEqual(1);
  });
});

// D3.25 — real catalog signals (docs/18_CATALOG/GAME_METADATA_ARCHITECTURE.md §6)
describe('computeGameSimilarityScore with D3.25 catalog signals', () => {
  const base: GameSimilaritySignals = {
    genreIds: new Set(['g1']),
    platformIds: new Set(['p1']),
    franchiseId: null,
    publisherProxyId: null,
    ratingAverage: null,
    popularity: 0,
  };

  it('falls back to the pre-D3.25 proxies when no catalog metadata exists', () => {
    const withProxy = computeGameSimilarityScore(
      { ...base, franchiseId: 'f1', publisherProxyId: 'f1' },
      { ...base, franchiseId: 'f1', publisherProxyId: 'f1' },
    );
    expect(withProxy).toBeGreaterThan(0);
  });

  it('uses real theme tags in place of the genre proxy when both sides have them', () => {
    const shared = computeGameSimilarityScore(
      { ...base, themeTagIds: new Set(['t1', 't2']) },
      { ...base, themeTagIds: new Set(['t1', 't2']) },
    );
    const disjoint = computeGameSimilarityScore(
      { ...base, themeTagIds: new Set(['t1']) },
      { ...base, themeTagIds: new Set(['t9']) },
    );
    expect(shared).toBeGreaterThan(disjoint);
  });

  it('uses real mechanics tags to separate otherwise identical games', () => {
    const shared = computeGameSimilarityScore(
      { ...base, mechanicsTagIds: new Set(['m1']) },
      { ...base, mechanicsTagIds: new Set(['m1']) },
    );
    const disjoint = computeGameSimilarityScore(
      { ...base, mechanicsTagIds: new Set(['m1']) },
      { ...base, mechanicsTagIds: new Set(['m2']) },
    );
    expect(shared).toBeGreaterThan(disjoint);
  });

  it('scores a shared publisher above a shared developer alone', () => {
    const publisher = computeGameSimilarityScore(
      { ...base, publisherIds: new Set(['c1']) },
      { ...base, publisherIds: new Set(['c1']) },
    );
    const developer = computeGameSimilarityScore(
      { ...base, developerIds: new Set(['c1']) },
      { ...base, developerIds: new Set(['c1']) },
    );
    expect(publisher).toBeGreaterThan(developer);
    expect(developer).toBeGreaterThan(0);
  });

  it('treats a shared series as equivalent to a shared franchise', () => {
    const viaSeries = computeGameSimilarityScore(
      { ...base, seriesId: 's1' },
      { ...base, seriesId: 's1' },
    );
    const viaFranchise = computeGameSimilarityScore(
      { ...base, franchiseId: 'f1' },
      { ...base, franchiseId: 'f1' },
    );
    expect(viaSeries).toBeCloseTo(viaFranchise);
  });

  it('links two games in one series even when their franchise rows differ', () => {
    const score = computeGameSimilarityScore(
      { ...base, franchiseId: 'f1', seriesId: 's1' },
      { ...base, franchiseId: 'f2', seriesId: 's1' },
    );
    const without = computeGameSimilarityScore(
      { ...base, franchiseId: 'f1' },
      { ...base, franchiseId: 'f2' },
    );
    expect(score).toBeGreaterThan(without);
  });

  it('ignores empty catalog sets so a half-enriched pair still scores', () => {
    const score = computeGameSimilarityScore(
      { ...base, themeTagIds: new Set(['t1']), publisherIds: new Set(['c1']) },
      { ...base, themeTagIds: new Set(), publisherIds: new Set() },
    );
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('stays within [0, 1] with every signal populated', () => {
    const full: GameSimilaritySignals = {
      genreIds: new Set(['g1', 'g2']),
      platformIds: new Set(['p1']),
      franchiseId: 'f1',
      publisherProxyId: 'f1',
      ratingAverage: 9,
      popularity: 5000,
      themeTagIds: new Set(['t1']),
      mechanicsTagIds: new Set(['m1']),
      publisherIds: new Set(['c1']),
      developerIds: new Set(['c2']),
      seriesId: 's1',
    };
    const score = computeGameSimilarityScore(full, full);
    expect(score).toBeGreaterThan(0.9);
    expect(score).toBeLessThanOrEqual(1);
  });
});
