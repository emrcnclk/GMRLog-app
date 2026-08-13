import type { DnaBand, DnaMatch } from '@gmrlog/types';

/**
 * Pure similarity helpers (D3.22 / SIMILARITY_ENGINE.md).
 * Weighted Jaccard / equality overlap — no AI.
 */

export const GAME_SIMILARITY_WEIGHTS = {
  genre: 0.22,
  theme: 0.12,
  mechanics: 0.1,
  franchise: 0.14,
  publisher: 0.08,
  platform: 0.12,
  ratingBand: 0.12,
  popularityBand: 0.1,
} as const;

export const USER_SIMILARITY_WEIGHTS = {
  library: 0.28,
  genre: 0.22,
  reviewRating: 0.18,
  wishlist: 0.18,
  completion: 0.14,
} as const;

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return 1;
  }
  return value;
}

/**
 * Jaccard index over two identifier sets: |A ∩ B| / |A ∪ B|.
 * Empty union → 0.
 */
export function jaccardSimilarity(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 && b.size === 0) {
    return 0;
  }
  let intersection = 0;
  for (const value of a) {
    if (b.has(value)) {
      intersection += 1;
    }
  }
  const union = a.size + b.size - intersection;
  if (union === 0) {
    return 0;
  }
  return clamp01(intersection / union);
}

export function equalityOverlap(a: string | null, b: string | null): number {
  if (a === null || b === null || a.length === 0 || b.length === 0) {
    return 0;
  }
  return a === b ? 1 : 0;
}

/** Rating band buckets (0–10 scale → coarse bands). */
export function ratingBand(average: number | null): string | null {
  if (average === null || !Number.isFinite(average)) {
    return null;
  }
  if (average < 4) {
    return 'low';
  }
  if (average < 7) {
    return 'mid';
  }
  if (average < 9) {
    return 'high';
  }
  return 'elite';
}

/** Popularity band buckets. */
export function popularityBand(popularity: number): string {
  if (!Number.isFinite(popularity) || popularity < 10) {
    return 'niche';
  }
  if (popularity < 100) {
    return 'rising';
  }
  if (popularity < 1_000) {
    return 'popular';
  }
  return 'mainstream';
}

export interface GameSimilaritySignals {
  genreIds: ReadonlySet<string>;
  platformIds: ReadonlySet<string>;
  franchiseId: string | null;
  /**
   * Publisher proxy — franchise when publisher absent.
   * D3.25: real publisher ids arrive via `publisherIds`; this stays as the
   * fallback for games the catalog has not enriched yet.
   */
  publisherProxyId: string | null;
  ratingAverage: number | null;
  popularity: number;

  // --- D3.25 catalog metadata signals (docs/18_CATALOG/) ---
  /** Theme tags — real IGDB themes, replacing the genre proxy when present. */
  themeTagIds?: ReadonlySet<string>;
  /** Game-mode / perspective / keyword tags — the mechanics signal. */
  mechanicsTagIds?: ReadonlySet<string>;
  publisherIds?: ReadonlySet<string>;
  developerIds?: ReadonlySet<string>;
  /** Provider series/collection — a stronger grouping than franchise alone. */
  seriesId?: string | null;
}

/** Real tag data when the catalog has it; the pre-D3.25 proxy otherwise. */
function themeSignal(
  left: GameSimilaritySignals,
  right: GameSimilaritySignals,
  genre: number,
  franchise: number,
): number {
  if (
    left.themeTagIds !== undefined &&
    right.themeTagIds !== undefined &&
    (left.themeTagIds.size > 0 || right.themeTagIds.size > 0)
  ) {
    return jaccardSimilarity(left.themeTagIds, right.themeTagIds);
  }
  return clamp01(0.7 * genre + 0.3 * franchise);
}

function mechanicsSignal(
  left: GameSimilaritySignals,
  right: GameSimilaritySignals,
  genre: number,
): number {
  if (
    left.mechanicsTagIds !== undefined &&
    right.mechanicsTagIds !== undefined &&
    (left.mechanicsTagIds.size > 0 || right.mechanicsTagIds.size > 0)
  ) {
    return jaccardSimilarity(left.mechanicsTagIds, right.mechanicsTagIds);
  }
  return genre;
}

/**
 * Publisher overlap. Prefers real company ids; falls back to the franchise
 * proxy that predates D3.25. Developer overlap counts at half weight — shared
 * studios signal similarity, but less strongly than a shared publisher.
 */
function publisherSignal(left: GameSimilaritySignals, right: GameSimilaritySignals): number {
  const hasPublishers =
    left.publisherIds !== undefined &&
    right.publisherIds !== undefined &&
    (left.publisherIds.size > 0 || right.publisherIds.size > 0);
  const hasDevelopers =
    left.developerIds !== undefined &&
    right.developerIds !== undefined &&
    (left.developerIds.size > 0 || right.developerIds.size > 0);

  if (!hasPublishers && !hasDevelopers) {
    return equalityOverlap(left.publisherProxyId, right.publisherProxyId);
  }

  const publisher = hasPublishers
    ? jaccardSimilarity(left.publisherIds ?? new Set(), right.publisherIds ?? new Set())
    : 0;
  const developer = hasDevelopers
    ? jaccardSimilarity(left.developerIds ?? new Set(), right.developerIds ?? new Set())
    : 0;

  return clamp01(Math.max(publisher, 0.5 * developer));
}

/**
 * Franchise overlap, strengthened by a shared provider series when the catalog
 * knows one. Two games in the same series but different franchise rows still
 * register as related.
 */
function franchiseSignal(left: GameSimilaritySignals, right: GameSimilaritySignals): number {
  const franchise = equalityOverlap(left.franchiseId, right.franchiseId);
  const series = equalityOverlap(left.seriesId ?? null, right.seriesId ?? null);
  return clamp01(Math.max(franchise, series));
}

/**
 * Weighted game similarity in [0, 1].
 *
 * D3.25: theme / mechanics / publisher read real catalog metadata when it
 * exists, and fall back to the original genre-and-franchise proxies for games
 * that have not been enriched yet. Weights are unchanged, so scores stay
 * comparable across a partially-enriched catalog.
 */
export function computeGameSimilarityScore(
  left: GameSimilaritySignals,
  right: GameSimilaritySignals,
): number {
  const genre = jaccardSimilarity(left.genreIds, right.genreIds);
  const platform = jaccardSimilarity(left.platformIds, right.platformIds);
  const franchise = franchiseSignal(left, right);
  const publisher = publisherSignal(left, right);
  const theme = themeSignal(left, right, genre, franchise);
  const mechanics = mechanicsSignal(left, right, genre);
  const rating = equalityOverlap(ratingBand(left.ratingAverage), ratingBand(right.ratingAverage));
  const popularity = equalityOverlap(
    popularityBand(left.popularity),
    popularityBand(right.popularity),
  );

  const score =
    GAME_SIMILARITY_WEIGHTS.genre * genre +
    GAME_SIMILARITY_WEIGHTS.theme * theme +
    GAME_SIMILARITY_WEIGHTS.mechanics * mechanics +
    GAME_SIMILARITY_WEIGHTS.franchise * franchise +
    GAME_SIMILARITY_WEIGHTS.publisher * publisher +
    GAME_SIMILARITY_WEIGHTS.platform * platform +
    GAME_SIMILARITY_WEIGHTS.ratingBand * rating +
    GAME_SIMILARITY_WEIGHTS.popularityBand * popularity;

  return clamp01(score);
}

export interface UserSimilaritySignals {
  libraryGameIds: ReadonlySet<string>;
  genreIds: ReadonlySet<string>;
  wishlistGameIds: ReadonlySet<string>;
  completedGameIds: ReadonlySet<string>;
  /** Map of gameId → rating for shared reviews. */
  reviewRatings: ReadonlyMap<string, number>;
}

/**
 * Review rating similarity — average absolute agreement on shared games → [0,1].
 * Ratings assumed 0–10.
 */
export function reviewRatingSimilarity(
  left: ReadonlyMap<string, number>,
  right: ReadonlyMap<string, number>,
): number {
  let shared = 0;
  let agreementSum = 0;
  for (const [gameId, leftRating] of left) {
    const rightRating = right.get(gameId);
    if (rightRating === undefined) {
      continue;
    }
    shared += 1;
    const delta = Math.abs(leftRating - rightRating);
    agreementSum += 1 - Math.min(1, delta / 10);
  }
  if (shared === 0) {
    return 0;
  }
  return clamp01(agreementSum / shared);
}

/**
 * 5.1 (`BACKEND_CHANGES.md` §1) — the five sub-scores the DNA-match
 * breakdown bars need. `computeUserSimilarityScore` used to compute these
 * and discard them; now it's a thin wrapper over this so the total can never
 * drift from the parts.
 */
export interface UserSimilarityBreakdown {
  library: number;
  genre: number;
  reviewRating: number;
  wishlist: number;
  completion: number;
  total: number;
}

export function computeUserSimilarityBreakdown(
  left: UserSimilaritySignals,
  right: UserSimilaritySignals,
): UserSimilarityBreakdown {
  const library = jaccardSimilarity(left.libraryGameIds, right.libraryGameIds);
  const genre = jaccardSimilarity(left.genreIds, right.genreIds);
  const wishlist = jaccardSimilarity(left.wishlistGameIds, right.wishlistGameIds);
  const completion = jaccardSimilarity(left.completedGameIds, right.completedGameIds);
  const reviewRating = reviewRatingSimilarity(left.reviewRatings, right.reviewRatings);

  const total =
    USER_SIMILARITY_WEIGHTS.library * library +
    USER_SIMILARITY_WEIGHTS.genre * genre +
    USER_SIMILARITY_WEIGHTS.reviewRating * reviewRating +
    USER_SIMILARITY_WEIGHTS.wishlist * wishlist +
    USER_SIMILARITY_WEIGHTS.completion * completion;

  return { library, genre, reviewRating, wishlist, completion, total: clamp01(total) };
}

/**
 * Weighted user similarity in [0, 1]. Kept for existing callers — the total
 * alone, from the breakdown above.
 */
export function computeUserSimilarityScore(
  left: UserSimilaritySignals,
  right: UserSimilaritySignals,
): number {
  return computeUserSimilarityBreakdown(left, right).total;
}

/**
 * 5.3 (`BACKEND_CHANGES.md` §3) — server-owned band thresholds, one place
 * only, so every surface (list token, panel) agrees. `percent` is 0-100.
 */
export function dnaBandForPercent(percent: number): DnaBand {
  if (percent >= 85) {
    return 'near-identical';
  }
  if (percent >= 70) {
    return 'strong';
  }
  if (percent >= 55) {
    return 'partial';
  }
  return 'different';
}

export type UserSimilarityComponents = Omit<UserSimilarityBreakdown, 'total'>;

/**
 * Builds the `match` field of `SimilarUserResponse` (and, once 5.4 lands,
 * `DnaMatchResponse`) from a persisted or freshly-computed breakdown. Never
 * recomputes — the caller supplies the components it already has.
 *
 * §2's rule: a cached row from before the breakdown columns existed has
 * `total > 0` with all five components still at their `0` default. Emitting
 * that as a real breakdown would be a lie, so it's omitted entirely rather
 * than shown as five zero bars.
 */
export function buildDnaMatch(
  components: UserSimilarityComponents,
  total: number,
): DnaMatch | undefined {
  const clampedTotal = clamp01(total);
  const clamped = {
    library: clamp01(components.library),
    genre: clamp01(components.genre),
    reviewRating: clamp01(components.reviewRating),
    wishlist: clamp01(components.wishlist),
    completion: clamp01(components.completion),
  };
  const allZero =
    clamped.library === 0 &&
    clamped.genre === 0 &&
    clamped.reviewRating === 0 &&
    clamped.wishlist === 0 &&
    clamped.completion === 0;
  if (clampedTotal > 0 && allZero) {
    return undefined;
  }

  const percent = Math.round(clampedTotal * 100);
  return {
    percent,
    band: dnaBandForPercent(percent),
    dimensions: [
      { key: 'library', score: Math.round(clamped.library * 100) },
      { key: 'genre', score: Math.round(clamped.genre * 100) },
      { key: 'reviewRating', score: Math.round(clamped.reviewRating * 100) },
      { key: 'wishlist', score: Math.round(clamped.wishlist * 100) },
      { key: 'completion', score: Math.round(clamped.completion * 100) },
    ],
  };
}
