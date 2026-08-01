import type {
  Company,
  CompanyRole,
  Franchise,
  GameCatalogMetadataRecord,
  GameDetailRecord,
  GameMedia,
  LibraryEntry,
  Tag,
} from '@gmrlog/database';
import type {
  GameCompanySummary,
  GameLibraryProjection,
  GameMediaResponse,
  GameMetadataProjection,
  GameRelatedGameResponse,
  GameResponse,
  GameTagSummary,
  LibrarySourceValue,
  OwnershipIndicatorValue,
} from '@gmrlog/types';

import {
  resolveMediaUrl,
  toResponsiveImage,
  type ResponsiveImageVariants,
} from '../../infrastructure/media/resolve-media-url';
import { providerAttribution } from '../metadata/metadata-attribution';

function asVariants(value: unknown): ResponsiveImageVariants | null {
  if (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as Record<string, unknown>).thumb === 'string' &&
    typeof (value as Record<string, unknown>).standard === 'string' &&
    typeof (value as Record<string, unknown>).hero === 'string'
  ) {
    return value as ResponsiveImageVariants;
  }
  return null;
}

function toOwnershipIndicator(source: LibrarySourceValue): OwnershipIndicatorValue {
  if (source === 'manual') {
    return 'manual';
  }
  return 'imported';
}

function toGameLibraryProjection(entry: LibraryEntry): GameLibraryProjection {
  return {
    status: entry.status,
    source: entry.source,
    ownershipIndicator: toOwnershipIndicator(entry.source),
  };
}

export function toGameMediaResponse(media: GameMedia): GameMediaResponse {
  return {
    id: media.id,
    kind: media.kind,
    url: resolveMediaUrl(media.storageKey),
    image: toResponsiveImage(
      media.storageKey,
      media.blurhash,
      asVariants(media.variants),
      media.width,
      media.height,
    ),
    width: media.width,
    height: media.height,
    sortOrder: media.sortOrder,
  };
}

export function toGameTagSummary(tag: Tag): GameTagSummary {
  return { id: tag.id, name: tag.name, slug: tag.slug, kind: tag.kind };
}

function toCompanySummaries(
  companies: readonly (Company & { role: CompanyRole })[],
  role: CompanyRole,
): GameCompanySummary[] {
  return companies
    .filter((company) => company.role === role)
    .map((company) => ({ id: company.id, name: company.name, slug: company.slug }));
}

/** D3.25 — catalog metadata block, always present so clients need no null check. */
export function toGameMetadataProjection(game: {
  metadataStatus: GameMetadataProjection['status'];
  metadataProvider: GameMetadataProjection['provider'];
  metadataRefreshedAt: Date | null;
}): GameMetadataProjection {
  return {
    status: game.metadataStatus,
    provider: game.metadataProvider,
    refreshedAt: game.metadataRefreshedAt?.toISOString() ?? null,
    attribution: providerAttribution(game.metadataProvider),
  };
}

/**
 * Persistence → S1 §15.3 GameResponse, extended with D3.25 catalog metadata.
 * `catalog` is null when the caller only loaded the base detail record; the
 * metadata fields then project as empty rather than being omitted.
 */
export function toGameResponse(
  record: GameDetailRecord,
  libraryEntry: LibraryEntry | null,
  catalog: (GameCatalogMetadataRecord & { franchise?: Franchise | null }) | null = null,
): GameResponse {
  const game = record.game;
  const companies = catalog?.companies ?? [];

  return {
    id: game.id,
    title: game.title,
    slug: game.slug,
    coverUrl: resolveMediaUrl(game.coverKey),
    coverImage: toResponsiveImage(
      game.coverKey,
      game.coverBlurhash,
      asVariants(game.coverVariants),
      null,
      null,
    ),
    platforms: record.platforms.map((platform) => ({
      id: platform.id,
      name: platform.name,
      slug: platform.slug,
    })),
    library: libraryEntry !== null ? toGameLibraryProjection(libraryEntry) : null,
    stats: {
      ratingAverage: record.ratingAverage,
      ratingCount: record.ratingCount,
      libraryCount: record.libraryCount,
    },

    // --- D3.25 catalog metadata ---
    heroUrl: resolveMediaUrl(game.heroKey),
    heroImage: toResponsiveImage(
      game.heroKey,
      game.heroBlurhash,
      asVariants(game.heroVariants),
      null,
      null,
    ),
    summary: game.summary,
    description: game.description,
    trailerUrl: game.trailerUrl,
    externalRating: game.externalRating,
    externalRatingCount: game.externalRatingCount,
    releaseDate: game.releaseDate?.toISOString() ?? null,
    genres:
      catalog?.genres.map((genre) => ({
        id: genre.id,
        name: genre.name,
        slug: genre.slug,
      })) ?? [],
    tags: catalog?.tags.map(toGameTagSummary) ?? [],
    developers: toCompanySummaries(companies, 'developer'),
    publishers: toCompanySummaries(companies, 'publisher'),
    franchise:
      catalog?.franchise == null
        ? null
        : {
            id: catalog.franchise.id,
            name: catalog.franchise.name,
            slug: catalog.franchise.slug,
          },
    series:
      catalog?.series == null
        ? null
        : { id: catalog.series.id, name: catalog.series.name, slug: catalog.series.slug },
    screenshots:
      catalog?.media.filter((media) => media.kind === 'screenshot').map(toGameMediaResponse) ?? [],
    metadata: toGameMetadataProjection(game),
  };
}

/** D3.25 — provider-declared relationships, resolved to catalog rows when known. */
export function toGameRelatedGameResponse(
  related: {
    relatedGameId: string | null;
    relatedTitle: string | null;
    kind: GameRelatedGameResponse['kind'];
  },
  resolved: { id: string; title: string; slug: string; coverKey: string | null } | null,
): GameRelatedGameResponse {
  return {
    gameId: resolved?.id ?? related.relatedGameId,
    title: resolved?.title ?? related.relatedTitle,
    slug: resolved?.slug ?? null,
    coverImageUrl: resolveMediaUrl(resolved?.coverKey ?? null),
    kind: related.kind,
  };
}
