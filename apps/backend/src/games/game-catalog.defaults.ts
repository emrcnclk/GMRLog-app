import type { Game } from '@gmrlog/database';

/**
 * Default values for the D3.25 catalog metadata columns — an un-enriched
 * skeleton game, the state every game starts in.
 *
 * Two consumers:
 *  - projections that synthesise a `Game` from a non-Prisma source (search
 *    documents), which must still satisfy the full row shape;
 *  - every `makeGame` test fixture, so a new catalog column is added here once
 *    rather than in six duplicated builders.
 */
export const GAME_CATALOG_DEFAULTS = {
  igdbId: null,
  steamAppId: null,
  rawgId: null,
  summary: null,
  description: null,
  heroKey: null,
  trailerUrl: null,
  externalRating: null,
  externalRatingCount: null,
  seriesId: null,
  metadataStatus: 'pending',
  metadataProvider: null,
  metadataConfidence: null,
  metadataVersion: 0,
  metadataRefreshedAt: null,
  metadataAttempts: 0,
  metadataError: null,
  coverBlurhash: null,
  coverVariants: null,
  heroBlurhash: null,
  heroVariants: null,
} satisfies Partial<Game>;
