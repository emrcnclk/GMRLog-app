import type { CompanyRole, GameMediaKind, GameRelatedKind, TagKind } from '@gmrlog/database';

/**
 * Metadata provider abstraction (D3.25 — docs/18_CATALOG/METADATA_PROVIDERS.md).
 * Nothing provider-specific escapes a provider implementation: every provider
 * returns the same normalized `ProviderGameMetadata`.
 */

export type MetadataProviderName = 'igdb' | 'steam' | 'rawg';

/** Identity hints. A provider takes the cheapest path it can. */
export interface ProviderLookupQuery {
  title: string;
  slug: string;
  igdbId?: number | null;
  steamAppId?: number | null;
  rawgId?: number | null;
  releaseYear?: number | null;
}

export interface ProviderNamedRef {
  name: string;
  slug: string;
}

export interface ProviderTagRef extends ProviderNamedRef {
  kind: TagKind;
}

export interface ProviderCompanyRef extends ProviderNamedRef {
  role: CompanyRole;
}

export interface ProviderSimilarRef {
  externalId: string;
  title: string | null;
  kind: GameRelatedKind;
  sortOrder: number;
}

export interface ProviderMediaRef {
  kind: GameMediaKind;
  url: string;
  width: number | null;
  height: number | null;
  sortOrder: number;
}

export interface ProviderExternalIds {
  igdbId?: number | null;
  steamAppId?: number | null;
  rawgId?: number | null;
}

/** Normalized provider result. `confidence` describes match quality, not data quality. */
export interface ProviderGameMetadata {
  provider: MetadataProviderName;
  confidence: number;
  externalIds: ProviderExternalIds;
  title: string | null;
  summary: string | null;
  description: string | null;
  releaseDate: Date | null;
  externalRating: number | null;
  externalRatingCount: number | null;
  genres: ProviderNamedRef[];
  tags: ProviderTagRef[];
  platforms: ProviderNamedRef[];
  companies: ProviderCompanyRef[];
  franchise: ProviderNamedRef | null;
  series: ProviderNamedRef | null;
  similarGames: ProviderSimilarRef[];
  media: ProviderMediaRef[];
  trailerUrl: string | null;
  attribution: string;
}

/**
 * `lookup` returns `null` for "no match" and throws for "transport failed".
 * The distinction matters: no-match falls through to the next provider,
 * a throw is retried by BullMQ.
 */
export interface GameMetadataProvider {
  readonly name: MetadataProviderName;
  /** Lower wins. Determines chain order and no-downgrade comparisons. */
  readonly priority: number;
  isEnabled(): boolean;
  lookup(query: ProviderLookupQuery): Promise<ProviderGameMetadata | null>;
}

export const GAME_METADATA_PROVIDERS = Symbol('GAME_METADATA_PROVIDERS');

/** Empty normalized result — providers build on this so new fields default safely. */
export function emptyProviderMetadata(
  provider: MetadataProviderName,
  attribution: string,
): ProviderGameMetadata {
  return {
    provider,
    confidence: 0,
    externalIds: {},
    title: null,
    summary: null,
    description: null,
    releaseDate: null,
    externalRating: null,
    externalRatingCount: null,
    genres: [],
    tags: [],
    platforms: [],
    companies: [],
    franchise: null,
    series: null,
    similarGames: [],
    media: [],
    trailerUrl: null,
    attribution,
  };
}
