/**
 * RAWG metadata provider (D3.25 — docs/18_CATALOG/METADATA_PROVIDERS.md §7).
 *
 * IMPLEMENTED BUT DISABLED BY DEFAULT.
 *
 * The sprint instruction is "RAWG fallback only if licensing requires."
 * Licensing does not currently require it — see
 * docs/18_CATALOG/METADATA_LICENSING.md §4 for the decision record and the
 * three conditions that would flip it. Enabling requires BOTH
 * `RAWG_ENABLED=true` AND a non-empty `RAWG_API_KEY`; setting one alone is a
 * no-op. Priority is last in the chain.
 */

import { EXACT_ID_CONFIDENCE, pickBestMatch } from '../metadata-match';
import {
  absoluteImageUrl,
  clampText,
  dedupeBySlug,
  normalizeRating,
  parseReleaseYear,
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

const RAWG_BASE_URL = 'https://api.rawg.io/api';
const SEARCH_LIMIT = 10;
const SUMMARY_MAX = 1_000;
const DESCRIPTION_MAX = 8_000;
const MAX_TAGS = 20;

export const RAWG_ATTRIBUTION = 'Game data provided by RAWG (rawg.io)';

interface RawgNamed {
  id?: number;
  name?: string;
  slug?: string;
}

interface RawgGame {
  id?: number;
  name?: string;
  slug?: string;
  description_raw?: string;
  description?: string;
  released?: string;
  rating?: number;
  ratings_count?: number;
  metacritic?: number;
  background_image?: string;
  background_image_additional?: string;
  genres?: RawgNamed[];
  tags?: RawgNamed[];
  platforms?: { platform?: RawgNamed }[];
  developers?: RawgNamed[];
  publishers?: RawgNamed[];
  clip?: { clip?: string };
}

interface RawgSearchResponse {
  results?: RawgGame[];
}

export interface RawgProviderOptions {
  enabled: boolean;
  apiKey: string;
  ratePerSecond?: number;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

export class RawgMetadataProvider implements GameMetadataProvider {
  readonly name = 'rawg' as const;
  readonly priority = 30;

  private readonly fetchImpl: typeof fetch;
  private readonly limiter: TokenBucketRateLimiter;

  constructor(private readonly options: RawgProviderOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.limiter = new TokenBucketRateLimiter(
      options.ratePerSecond ?? 2,
      undefined,
      options.now ?? (() => Date.now()),
    );
  }

  /** Both the flag and the key are required — one alone is a no-op. */
  isEnabled(): boolean {
    return this.options.enabled && this.options.apiKey.length > 0;
  }

  dispose(): void {
    this.limiter.dispose();
  }

  async lookup(query: ProviderLookupQuery): Promise<ProviderGameMetadata | null> {
    if (!this.isEnabled()) {
      return null;
    }

    if (query.rawgId != null) {
      const game = await this.getJson<RawgGame>(`/games/${String(query.rawgId)}`);
      return game === null ? null : toMetadata(game, EXACT_ID_CONFIDENCE);
    }

    const search = await this.getJson<RawgSearchResponse>('/games', {
      search: query.title,
      page_size: String(SEARCH_LIMIT),
    });
    const results = search?.results ?? [];
    if (results.length === 0) {
      return null;
    }

    const best = pickBestMatch(
      { title: query.title, releaseYear: query.releaseYear ?? null },
      results.map((game) => ({
        title: game.name ?? '',
        releaseYear: parseReleaseYear(parseReleased(game.released)),
        game,
      })),
    );
    if (best === null) {
      return null;
    }

    // The search projection omits descriptions; fetch the detail record.
    const detail =
      best.candidate.game.id == null
        ? null
        : await this.getJson<RawgGame>(`/games/${String(best.candidate.game.id)}`);

    return toMetadata(detail ?? best.candidate.game, best.confidence);
  }

  private async getJson<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
    await this.limiter.acquire();

    const url = new URL(`${RAWG_BASE_URL}${path}`);
    url.searchParams.set('key', this.options.apiKey);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await this.fetchImpl(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`RAWG HTTP ${String(response.status)}`);
    }
    return (await response.json()) as T;
  }
}

function toMetadata(game: RawgGame, confidence: number): ProviderGameMetadata {
  const base = emptyProviderMetadata('rawg', RAWG_ATTRIBUTION);
  const description =
    game.description_raw ?? (game.description == null ? null : stripHtml(game.description));

  return {
    ...base,
    confidence,
    externalIds: { rawgId: game.id ?? null },
    title: game.name ?? null,
    summary: clampText(description, SUMMARY_MAX),
    description: clampText(description, DESCRIPTION_MAX),
    releaseDate: parseReleased(game.released),
    // RAWG's own `rating` is 0–5; `metacritic` is already 0–100 and preferred.
    externalRating:
      game.metacritic != null
        ? normalizeRating(game.metacritic, 100)
        : normalizeRating(game.rating ?? null, 5),
    externalRatingCount: game.ratings_count ?? null,
    genres: toRefs(game.genres),
    tags: toTagRefs(game.tags),
    platforms: toRefs((game.platforms ?? []).map((entry) => entry.platform)),
    companies: toCompanyRefs(game.developers, game.publishers),
    franchise: null,
    series: null,
    similarGames: [],
    media: toMediaRefs(game),
    trailerUrl: game.clip?.clip == null ? null : absoluteImageUrl(game.clip.clip),
  };
}

function toRefs(values: (RawgNamed | undefined)[] | undefined): ProviderNamedRef[] {
  const refs: ProviderNamedRef[] = [];
  for (const value of values ?? []) {
    if (value?.name == null || value.name.trim().length === 0) {
      continue;
    }
    refs.push({ name: value.name.trim(), slug: value.slug ?? slugifyRef(value.name) });
  }
  return dedupeBySlug(refs);
}

function toTagRefs(tags: RawgNamed[] | undefined): ProviderTagRef[] {
  return toRefs(tags)
    .slice(0, MAX_TAGS)
    .map((ref) => ({ ...ref, kind: 'keyword' as const }));
}

function toCompanyRefs(
  developers: RawgNamed[] | undefined,
  publishers: RawgNamed[] | undefined,
): ProviderCompanyRef[] {
  return [
    ...toRefs(developers).map((ref) => ({ ...ref, role: 'developer' as const })),
    ...toRefs(publishers).map((ref) => ({ ...ref, role: 'publisher' as const })),
  ];
}

function toMediaRefs(game: RawgGame): ProviderMediaRef[] {
  const media: ProviderMediaRef[] = [];
  if (game.background_image != null) {
    const url = absoluteImageUrl(game.background_image);
    if (url !== null) {
      media.push({ kind: 'cover', url, width: null, height: null, sortOrder: 0 });
    }
  }
  if (game.background_image_additional != null) {
    const url = absoluteImageUrl(game.background_image_additional);
    if (url !== null) {
      media.push({ kind: 'hero', url, width: null, height: null, sortOrder: 0 });
    }
  }
  return media;
}

function parseReleased(released: string | undefined): Date | null {
  if (released == null || released.length === 0) {
    return null;
  }
  const parsed = new Date(released);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
