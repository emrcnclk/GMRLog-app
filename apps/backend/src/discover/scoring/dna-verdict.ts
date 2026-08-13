import type { UserSimilarityComponents } from './similarity.engine';

/**
 * 5.4 (`BACKEND_CHANGES.md` §4, "The verdict sentence") — one plain sentence
 * naming the strongest and weakest signal. Template-based, no LLM call on the
 * read path; copy lives in this one file so it can be edited without
 * touching the scoring.
 */
const DIMENSION_ORDER = ['library', 'genre', 'reviewRating', 'wishlist', 'completion'] as const;
type DimensionKey = (typeof DIMENSION_ORDER)[number];

const STRONG_PHRASES: Record<DimensionKey, string> = {
  library: 'your shared library is unusually large',
  genre: 'your genre tastes line up closely',
  reviewRating: 'you agree on almost everything you have both played',
  wishlist: 'your wishlists point at the same games',
  completion: 'you finish games the same way',
};

const WEAK_PHRASES: Record<DimensionKey, string> = {
  library: 'Smaller shared shelf',
  genre: 'Different genre instincts',
  reviewRating: 'You rate things differently',
  wishlist: 'Different wishlists',
  completion: 'Different completion habits',
};

/** Below §4's minimum shared-data threshold — never a fabricated number. */
export const DNA_THIN_DATA_VERDICT =
  'Not enough shared library or reviews yet to say how you compare.';

export function buildDnaVerdict(components: UserSimilarityComponents): string {
  let strongest: DimensionKey = DIMENSION_ORDER[0];
  let weakest: DimensionKey = DIMENSION_ORDER[0];
  for (const key of DIMENSION_ORDER) {
    if (components[key] > components[strongest]) {
      strongest = key;
    }
    if (components[key] < components[weakest]) {
      weakest = key;
    }
  }

  if (strongest === weakest) {
    return 'Your play patterns line up evenly across the board — no single signal stands out yet.';
  }

  return `${WEAK_PHRASES[weakest]}, but ${STRONG_PHRASES[strongest]}.`;
}
