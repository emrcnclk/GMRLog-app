import type { DiscoverGameRecord } from '@gmrlog/database';
import type { GameCardResponse } from '@gmrlog/types';

import {
  resolveMediaUrl,
  toResponsiveImage,
  type ResponsiveImageVariants,
} from '../../infrastructure/media/resolve-media-url';

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

/**
 * D3.25 — cover keys are now populated by catalog media ingestion
 * (docs/18_CATALOG/MEDIA_INGESTION.md §5), so this resolves a real URL.
 * Before D3.25 it returned a hardcoded `null` because nothing wrote `coverKey`.
 */
export function resolveCoverImageUrl(key: string | null): string | null {
  return resolveMediaUrl(key);
}

export function toGameCardResponse(record: DiscoverGameRecord): GameCardResponse {
  return {
    id: record.game.id,
    slug: record.game.slug,
    title: record.game.title,
    coverImageUrl: resolveCoverImageUrl(record.game.coverKey),
    coverImage: toResponsiveImage(
      record.game.coverKey,
      record.game.coverBlurhash,
      asVariants(record.game.coverVariants),
      null,
      null,
    ),
    heroImageUrl: resolveMediaUrl(record.game.heroKey),
    heroImage: toResponsiveImage(
      record.game.heroKey,
      record.game.heroBlurhash,
      asVariants(record.game.heroVariants),
      null,
      null,
    ),
    summary: record.game.summary,
    releaseDate: record.game.releaseDate?.toISOString() ?? null,
    genres: record.genres.map((genre) => ({
      id: genre.id,
      name: genre.name,
      slug: genre.slug,
    })),
    platforms: record.platforms.map((platform) => ({
      id: platform.id,
      name: platform.name,
      slug: platform.slug,
    })),
    ratingSummary: {
      average: record.ratingAverage,
      count: record.ratingCount,
    },
    libraryCount: record.libraryCount,
  };
}
