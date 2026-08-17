/**
 * Provider result merging (D3.25 — docs/18_CATALOG/METADATA_PROVIDERS.md §4).
 *
 * Rules, in order:
 *   1. The first provider at/above the confidence floor is the PRIMARY. Its
 *      name is what gets persisted on the game.
 *   2. Secondary providers only FILL fields the primary left null/empty.
 *      They never overwrite a primary value.
 *   3. Scalars fill-forward on null. Collections fill-forward only when the
 *      primary's collection is EMPTY — taxonomies are never interleaved,
 *      because mixing them produces incoherent tag sets.
 *   4. externalIds always union.
 *
 * Pure functions only. No I/O.
 */

import type { ApplyGameMetadataInput, GameMetadataStatus } from '@gmrlog/database';

import type { ProviderGameMetadata } from './providers/metadata-provider.port';

function fillScalar<T>(primary: T | null, secondary: T | null): T | null {
  return primary ?? secondary;
}

function fillCollection<T>(primary: readonly T[], secondary: readonly T[]): T[] {
  return primary.length > 0 ? [...primary] : [...secondary];
}

function fillText(primary: string | null, secondary: string | null): string | null {
  if (primary !== null && primary.trim().length > 0) {
    return primary;
  }
  return secondary !== null && secondary.trim().length > 0 ? secondary : null;
}

/**
 * Merge one secondary result into an accumulated primary.
 * `primary` is never mutated.
 */
export function mergeProviderMetadata(
  primary: ProviderGameMetadata,
  secondary: ProviderGameMetadata,
): ProviderGameMetadata {
  return {
    // Identity of the merged record stays with the primary.
    provider: primary.provider,
    confidence: primary.confidence,
    attribution: primary.attribution,

    // External ids always union — learning a steamAppId is strictly useful.
    externalIds: {
      igdbId: fillScalar(primary.externalIds.igdbId ?? null, secondary.externalIds.igdbId ?? null),
      steamAppId: fillScalar(
        primary.externalIds.steamAppId ?? null,
        secondary.externalIds.steamAppId ?? null,
      ),
      rawgId: fillScalar(primary.externalIds.rawgId ?? null, secondary.externalIds.rawgId ?? null),
    },

    title: fillText(primary.title, secondary.title),
    summary: fillText(primary.summary, secondary.summary),
    description: fillText(primary.description, secondary.description),
    releaseDate: fillScalar(primary.releaseDate, secondary.releaseDate),

    // Rating and its sample size move together — a count without its average
    // (or vice versa) is meaningless.
    ...mergeRating(primary, secondary),

    genres: fillCollection(primary.genres, secondary.genres),
    tags: fillCollection(primary.tags, secondary.tags),
    platforms: fillCollection(primary.platforms, secondary.platforms),
    companies: fillCollection(primary.companies, secondary.companies),
    similarGames: fillCollection(primary.similarGames, secondary.similarGames),
    media: fillCollection(primary.media, secondary.media),

    franchise: fillScalar(primary.franchise, secondary.franchise),
    series: fillScalar(primary.series, secondary.series),
    trailerUrl: fillText(primary.trailerUrl, secondary.trailerUrl),
  };
}

function mergeRating(
  primary: ProviderGameMetadata,
  secondary: ProviderGameMetadata,
): Pick<ProviderGameMetadata, 'externalRating' | 'externalRatingCount'> {
  if (primary.externalRating !== null) {
    return {
      externalRating: primary.externalRating,
      externalRatingCount: primary.externalRatingCount,
    };
  }
  return {
    externalRating: secondary.externalRating,
    externalRatingCount: secondary.externalRatingCount,
  };
}

/**
 * Fold an ordered list of provider results into one record.
 * `results[0]` is the primary; the rest fill gaps in chain order.
 */
export function foldProviderResults(
  results: readonly ProviderGameMetadata[],
): ProviderGameMetadata | null {
  const [primary, ...rest] = results;
  if (primary === undefined) {
    return null;
  }
  return rest.reduce<ProviderGameMetadata>(
    (accumulated, next) => mergeProviderMetadata(accumulated, next),
    primary,
  );
}

/** How many catalog fields a merged record would actually populate. */
export function countPopulatedFields(metadata: ProviderGameMetadata): number {
  let count = 0;
  const scalars = [
    metadata.title,
    metadata.summary,
    metadata.description,
    metadata.releaseDate,
    metadata.externalRating,
    metadata.franchise,
    metadata.series,
    metadata.trailerUrl,
    metadata.externalIds.igdbId ?? null,
    metadata.externalIds.steamAppId ?? null,
    metadata.externalIds.rawgId ?? null,
  ];
  for (const value of scalars) {
    if (value !== null) {
      count += 1;
    }
  }
  const collections = [
    metadata.genres,
    metadata.tags,
    metadata.platforms,
    metadata.companies,
    metadata.similarGames,
    metadata.media,
  ];
  for (const collection of collections) {
    if (collection.length > 0) {
      count += 1;
    }
  }
  return count;
}

/**
 * Core-field completeness gate. A record missing all of summary/description,
 * or carrying no genres and no media, is `partial` however confident the
 * title match was.
 */
export function hasCoreFields(metadata: ProviderGameMetadata): boolean {
  const hasText =
    (metadata.summary !== null && metadata.summary.length > 0) ||
    (metadata.description !== null && metadata.description.length > 0);
  const hasTaxonomy = metadata.genres.length > 0;
  const hasArtwork = metadata.media.length > 0;
  return hasText && hasTaxonomy && hasArtwork;
}

/**
 * `complete` demands both a confident title match and the core field set.
 * Everything else that matched at all is `partial` — still useful, still
 * eligible for a later refresh.
 *
 * Single source of truth for this gate: `GameMetadataService.enrich` (the
 * per-game worker path) and `GameCatalogSyncService` (the D11.1 bulk mirror,
 * which writes via `applyMetadata` directly rather than re-running enrich)
 * both call this — never duplicate the threshold check.
 */
export function resolveMetadataStatus(
  metadata: ProviderGameMetadata,
  completeConfidence: number,
): GameMetadataStatus {
  const confident = metadata.confidence >= completeConfidence;
  return confident && hasCoreFields(metadata) ? 'complete' : 'partial';
}

/**
 * Shape one provider result into the exact input `GameMetadataRepository.applyMetadata`
 * expects. Single source of truth for both callers described above — the bulk
 * mirror path must never invent a second, ad hoc `Game` update that bypasses
 * `applyMetadata`'s "never overwrite a non-empty primary field" transaction.
 */
export function toApplyGameMetadataInput(
  gameId: string,
  metadata: ProviderGameMetadata,
  status: GameMetadataStatus,
  refreshedAt: Date,
): ApplyGameMetadataInput {
  return {
    gameId,
    scalars: {
      summary: metadata.summary,
      description: metadata.description,
      releaseDate: metadata.releaseDate,
      trailerUrl: metadata.trailerUrl,
      externalRating: metadata.externalRating,
      externalRatingCount: metadata.externalRatingCount,
      igdbId: metadata.externalIds.igdbId ?? undefined,
      steamAppId: metadata.externalIds.steamAppId ?? undefined,
      rawgId: metadata.externalIds.rawgId ?? undefined,
    },
    genres: metadata.genres,
    tags: metadata.tags,
    platforms: metadata.platforms,
    companies: metadata.companies,
    franchise: metadata.franchise,
    series: metadata.series,
    relatedGames: metadata.similarGames.map((similar) => ({
      provider: metadata.provider,
      relatedExternalId: similar.externalId,
      relatedTitle: similar.title,
      kind: similar.kind,
      sortOrder: similar.sortOrder,
    })),
    status,
    provider: metadata.provider,
    confidence: metadata.confidence,
    refreshedAt,
  };
}
