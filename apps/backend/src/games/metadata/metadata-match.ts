/**
 * Title-match confidence scoring (D3.25 — docs/18_CATALOG/METADATA_PROVIDERS.md §3).
 * Pure. Providers use it to score search results; the applier uses the result to
 * decide between `complete`, `partial` and `failed`.
 */

import { normalizeTitle, titleTokens } from './metadata-normalize';

/** Exact external-id lookups bypass scoring entirely. */
export const EXACT_ID_CONFIDENCE = 1;

const EXACT_TITLE_BASE = 0.9;
const PREFIX_TITLE_BASE = 0.7;
const TOKEN_JACCARD_WEIGHT = 0.4;
const RELEASE_YEAR_BONUS = 0.08;
const RELEASE_YEAR_PENALTY = 0.25;

export interface MatchCandidate {
  title: string;
  releaseYear?: number | null;
}

export interface MatchTarget {
  title: string;
  releaseYear?: number | null;
}

function jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 || b.size === 0) {
    return 0;
  }
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) {
      intersection += 1;
    }
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return value >= 1 ? 1 : value;
}

/**
 * Score how well `candidate` (a provider search result) matches `target`
 * (the catalog game we are trying to enrich). Range [0, 1].
 */
export function scoreTitleMatch(target: MatchTarget, candidate: MatchCandidate): number {
  const targetTitle = normalizeTitle(target.title);
  const candidateTitle = normalizeTitle(candidate.title);

  if (targetTitle.length === 0 || candidateTitle.length === 0) {
    return 0;
  }

  let base: number;
  if (targetTitle === candidateTitle) {
    base = EXACT_TITLE_BASE;
  } else if (
    candidateTitle.startsWith(`${targetTitle} `) ||
    targetTitle.startsWith(`${candidateTitle} `)
  ) {
    base = PREFIX_TITLE_BASE;
  } else {
    base = TOKEN_JACCARD_WEIGHT * jaccard(titleTokens(target.title), titleTokens(candidate.title));
  }

  const targetYear = target.releaseYear ?? null;
  const candidateYear = candidate.releaseYear ?? null;
  if (targetYear !== null && candidateYear !== null) {
    base += targetYear === candidateYear ? RELEASE_YEAR_BONUS : -RELEASE_YEAR_PENALTY;
  }

  return clamp01(base);
}

/** Highest-scoring candidate, or null when every candidate scores 0. */
export function pickBestMatch<T extends MatchCandidate>(
  target: MatchTarget,
  candidates: readonly T[],
): { candidate: T; confidence: number } | null {
  let best: { candidate: T; confidence: number } | null = null;
  for (const candidate of candidates) {
    const confidence = scoreTitleMatch(target, candidate);
    if (confidence <= 0) {
      continue;
    }
    if (best === null || confidence > best.confidence) {
      best = { candidate, confidence };
    }
  }
  return best;
}
