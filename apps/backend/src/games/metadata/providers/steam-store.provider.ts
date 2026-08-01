/**
 * Steam Store metadata provider (D3.25 — docs/18_CATALOG/METADATA_PROVIDERS.md §6).
 *
 * Fallback source. Requires a known `steamAppId` — the store `appdetails`
 * endpoint has no title search, and screen-scraping the store search page is a
 * deliberate non-goal. Off unless STEAM_STORE_METADATA_ENABLED=true
 * (docs/18_CATALOG/METADATA_LICENSING.md §3).
 */

import type { CompanyRole } from '@gmrlog/database';

import { EXACT_ID_CONFIDENCE } from '../metadata-match';
import {
  absoluteImageUrl,
  clampText,
  dedupeBySlug,
  normalizeRating,
  slugifyRef,
  stripHtml,
} from '../metadata-normalize';

import {
  emptyProviderMetadata,
  type GameMetadataProvider,
  type ProviderCompanyRef,
  type ProviderGameMetadata,
  type ProviderLookupQuery,
  type ProviderMediaRef,
  type ProviderNamedRef,
  type ProviderTagRef,
} from './metadata-provider.port';
import { TokenBucketRateLimiter } from './rate-limiter';

const APPDETAILS_URL = 'https://store.steampowered.com/api/appdetails';
const SUMMARY_MAX = 1_000;
const DESCRIPTION_MAX = 8_000;
const MAX_SCREENSHOTS = 12;

export const STEAM_ATTRIBUTION = 'Store data provided by Steam (store.steampowered.com)';

interface SteamAppDetailsEntry {
  success?: boolean;
  data?: SteamAppData;
}

interface SteamAppData {
  steam_appid?: number;
  name?: string;
  short_description?: string;
  detailed_description?: string;
  about_the_game?: string;
  header_image?: string;
  background_raw?: string;
  capsule_imagev5?: string;
  developers?: string[];
  publishers?: string[];
  genres?: { description?: string }[];
  categories?: { description?: string }[];
  platforms?: Record<string, boolean>;
  metacritic?: { score?: number };
  release_date?: { coming_soon?: boolean; date?: string };
  screenshots?: { path_full?: string; path_thumbnail?: string }[];
  movies?: { mp4?: { max?: string }; webm?: { max?: string } }[];
}

export interface SteamStoreProviderOptions {
  enabled: boolean;
  ratePerSecond?: number;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

export class SteamStoreMetadataProvider implements GameMetadataProvider {
  readonly name = 'steam' as const;
  readonly priority = 20;

  private readonly fetchImpl: typeof fetch;
  private readonly limiter: TokenBucketRateLimiter;

  constructor(private readonly options: SteamStoreProviderOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.limiter = new TokenBucketRateLimiter(
      options.ratePerSecond ?? 1,
      undefined,
      options.now ?? (() => Date.now()),
    );
  }

  isEnabled(): boolean {
    return this.options.enabled;
  }

  dispose(): void {
    this.limiter.dispose();
  }

  async lookup(query: ProviderLookupQuery): Promise<ProviderGameMetadata | null> {
    if (!this.isEnabled() || query.steamAppId == null) {
      return null;
    }

    await this.limiter.acquire();

    const url = new URL(APPDETAILS_URL);
    url.searchParams.set('appids', String(query.steamAppId));
    url.searchParams.set('l', 'english');

    const response = await this.fetchImpl(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Steam Store HTTP ${String(response.status)}`);
    }

    const json = (await response.json()) as Record<string, SteamAppDetailsEntry> | null;
    const entry = json?.[String(query.steamAppId)];
    if (entry?.success !== true || entry.data === undefined) {
      return null;
    }

    return toMetadata(entry.data, query.steamAppId);
  }
}

function toMetadata(data: SteamAppData, appId: number): ProviderGameMetadata {
  const base = emptyProviderMetadata('steam', STEAM_ATTRIBUTION);
  const detailed = data.detailed_description ?? data.about_the_game ?? null;

  return {
    ...base,
    // An appid lookup is exact by construction.
    confidence: EXACT_ID_CONFIDENCE,
    externalIds: { steamAppId: data.steam_appid ?? appId },
    title: data.name ?? null,
    summary: clampText(data.short_description ?? null, SUMMARY_MAX),
    description: clampText(detailed === null ? null : stripHtml(detailed), DESCRIPTION_MAX),
    releaseDate: parseSteamReleaseDate(data.release_date),
    externalRating: normalizeRating(data.metacritic?.score ?? null, 100),
    externalRatingCount: null,
    genres: toRefs(data.genres?.map((genre) => genre.description)),
    tags: toCategoryTags(data.categories),
    platforms: toPlatformRefs(data.platforms),
    companies: toCompanyRefs(data.developers, data.publishers),
    franchise: null,
    series: null,
    similarGames: [],
    media: toMediaRefs(data),
    trailerUrl: toTrailerUrl(data.movies),
  };
}

function toRefs(names: (string | undefined)[] | undefined): ProviderNamedRef[] {
  const refs: ProviderNamedRef[] = [];
  for (const name of names ?? []) {
    if (name == null || name.trim().length === 0) {
      continue;
    }
    refs.push({ name: name.trim(), slug: slugifyRef(name) });
  }
  return dedupeBySlug(refs);
}

function toCategoryTags(categories: { description?: string }[] | undefined): ProviderTagRef[] {
  return toRefs(categories?.map((category) => category.description)).map((ref) => ({
    ...ref,
    kind: 'mode' as const,
  }));
}

/** Steam reports platforms as `{ windows: true, mac: false, linux: true }`. */
function toPlatformRefs(platforms: Record<string, boolean> | undefined): ProviderNamedRef[] {
  const labels: Record<string, string> = {
    windows: 'PC (Microsoft Windows)',
    mac: 'macOS',
    linux: 'Linux',
  };
  const refs: ProviderNamedRef[] = [];
  for (const [key, supported] of Object.entries(platforms ?? {})) {
    if (!supported) {
      continue;
    }
    const name = labels[key] ?? key;
    refs.push({ name, slug: slugifyRef(name) });
  }
  return dedupeBySlug(refs);
}

function toCompanyRefs(
  developers: string[] | undefined,
  publishers: string[] | undefined,
): ProviderCompanyRef[] {
  const refs: ProviderCompanyRef[] = [];
  const push = (names: string[] | undefined, role: CompanyRole): void => {
    for (const ref of toRefs(names)) {
      refs.push({ ...ref, role });
    }
  };
  push(developers, 'developer');
  push(publishers, 'publisher');

  const seen = new Set<string>();
  return refs.filter((ref) => {
    const key = `${ref.slug}:${ref.role}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function toMediaRefs(data: SteamAppData): ProviderMediaRef[] {
  const media: ProviderMediaRef[] = [];

  const cover = data.capsule_imagev5 ?? data.header_image;
  if (cover != null) {
    const url = absoluteImageUrl(cover);
    if (url !== null) {
      media.push({ kind: 'cover', url, width: null, height: null, sortOrder: 0 });
    }
  }

  if (data.background_raw != null) {
    const url = absoluteImageUrl(data.background_raw);
    if (url !== null) {
      media.push({ kind: 'hero', url, width: null, height: null, sortOrder: 0 });
    }
  }

  (data.screenshots ?? []).slice(0, MAX_SCREENSHOTS).forEach((screenshot, index) => {
    const url = screenshot.path_full == null ? null : absoluteImageUrl(screenshot.path_full);
    if (url !== null) {
      media.push({ kind: 'screenshot', url, width: null, height: null, sortOrder: index });
    }
  });

  return media;
}

/**
 * Steam serves trailers as direct video files rather than an embed page.
 * Stored as-is; video is never mirrored (METADATA_LICENSING.md §5).
 */
function toTrailerUrl(movies: SteamAppData['movies']): string | null {
  const first = movies?.[0];
  const raw = first?.mp4?.max ?? first?.webm?.max ?? null;
  return raw === null ? null : absoluteImageUrl(raw);
}

function parseSteamReleaseDate(release: SteamAppData['release_date']): Date | null {
  if (release?.coming_soon === true || release?.date == null) {
    return null;
  }
  const parsed = new Date(release.date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
