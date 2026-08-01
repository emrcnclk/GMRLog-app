/**
 * IGDB metadata provider (D3.25 — docs/18_CATALOG/METADATA_PROVIDERS.md §5).
 *
 * Primary catalog source. Authenticates through Twitch client-credentials and
 * queries IGDB APIv4 with an APIcalypse body. Self-disables when either
 * credential is absent — an unconfigured chain is a valid configuration.
 */

import type { GameMediaKind, GameRelatedKind, TagKind } from '@gmrlog/database';

import { EXACT_ID_CONFIDENCE, pickBestMatch } from '../metadata-match';
import {
  absoluteImageUrl,
  clampText,
  dedupeBySlug,
  normalizeRating,
  parseReleaseYear,
  slugifyRef,
} from '../metadata-normalize';

import {
  emptyProviderMetadata,
  type GameMetadataProvider,
  type ProviderCompanyRef,
  type ProviderGameMetadata,
  type ProviderLookupQuery,
  type ProviderMediaRef,
  type ProviderNamedRef,
  type ProviderSimilarRef,
  type ProviderTagRef,
} from './metadata-provider.port';
import { TokenBucketRateLimiter } from './rate-limiter';

const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const IGDB_GAMES_URL = 'https://api.igdb.com/v4/games';
const TOKEN_REFRESH_MARGIN_MS = 60_000;
const SEARCH_LIMIT = 10;
const SUMMARY_MAX = 1_000;
const DESCRIPTION_MAX = 8_000;

export const IGDB_ATTRIBUTION = 'Game data provided by IGDB (igdb.com)';

/** IGDB image size tokens by media kind. */
const IMAGE_SIZE_BY_KIND: Partial<Record<GameMediaKind, string>> = {
  cover: 't_cover_big',
  hero: 't_1080p',
  artwork: 't_1080p',
  screenshot: 't_screenshot_huge',
  logo: 't_thumb',
};

const IGDB_FIELDS = [
  'id',
  'name',
  'summary',
  'storyline',
  'first_release_date',
  'total_rating',
  'total_rating_count',
  'genres.name',
  'themes.name',
  'game_modes.name',
  'player_perspectives.name',
  'keywords.name',
  'platforms.name',
  'involved_companies.company.name',
  'involved_companies.developer',
  'involved_companies.publisher',
  'involved_companies.porting',
  'involved_companies.supporting',
  'franchise.name',
  'collection.name',
  'similar_games.id',
  'similar_games.name',
  'cover.image_id',
  'artworks.image_id',
  'artworks.width',
  'artworks.height',
  'screenshots.image_id',
  'screenshots.width',
  'screenshots.height',
  'videos.video_id',
  'external_games.category',
  'external_games.uid',
].join(',');

interface IgdbNamed {
  id?: number;
  name?: string;
}

interface IgdbImage {
  image_id?: string;
  width?: number;
  height?: number;
}

interface IgdbInvolvedCompany {
  company?: IgdbNamed;
  developer?: boolean;
  publisher?: boolean;
  porting?: boolean;
  supporting?: boolean;
}

interface IgdbExternalGame {
  /** 1 = Steam in IGDB's external category enum. */
  category?: number;
  uid?: string;
}

interface IgdbGame {
  id?: number;
  name?: string;
  summary?: string;
  storyline?: string;
  first_release_date?: number;
  total_rating?: number;
  total_rating_count?: number;
  genres?: IgdbNamed[];
  themes?: IgdbNamed[];
  game_modes?: IgdbNamed[];
  player_perspectives?: IgdbNamed[];
  keywords?: IgdbNamed[];
  platforms?: IgdbNamed[];
  involved_companies?: IgdbInvolvedCompany[];
  franchise?: IgdbNamed;
  collection?: IgdbNamed;
  similar_games?: IgdbNamed[];
  cover?: IgdbImage;
  artworks?: IgdbImage[];
  screenshots?: IgdbImage[];
  videos?: { video_id?: string }[];
  external_games?: IgdbExternalGame[];
}

interface TwitchTokenResponse {
  access_token?: string;
  expires_in?: number;
}

export interface IgdbProviderOptions {
  clientId: string;
  clientSecret: string;
  ratePerSecond?: number;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

const IGDB_EXTERNAL_CATEGORY_STEAM = 1;

export class IgdbMetadataProvider implements GameMetadataProvider {
  readonly name = 'igdb' as const;
  readonly priority = 10;

  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private readonly limiter: TokenBucketRateLimiter;
  private token: { value: string; expiresAtMs: number } | null = null;
  private tokenRequest: Promise<string> | null = null;

  constructor(private readonly options: IgdbProviderOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.now = options.now ?? (() => Date.now());
    this.limiter = new TokenBucketRateLimiter(options.ratePerSecond ?? 4, undefined, this.now);
  }

  isEnabled(): boolean {
    return this.options.clientId.length > 0 && this.options.clientSecret.length > 0;
  }

  dispose(): void {
    this.limiter.dispose();
  }

  async lookup(query: ProviderLookupQuery): Promise<ProviderGameMetadata | null> {
    if (!this.isEnabled()) {
      return null;
    }

    if (query.igdbId != null) {
      const [game] = await this.request(
        `fields ${IGDB_FIELDS}; where id = ${String(query.igdbId)}; limit 1;`,
      );
      return game === undefined ? null : this.toMetadata(game, EXACT_ID_CONFIDENCE);
    }

    const escaped = query.title.replace(/["\\]/g, ' ').trim();
    if (escaped.length === 0) {
      return null;
    }

    const candidates = await this.request(
      `search "${escaped}"; fields ${IGDB_FIELDS}; limit ${String(SEARCH_LIMIT)};`,
    );
    if (candidates.length === 0) {
      return null;
    }

    const best = pickBestMatch(
      { title: query.title, releaseYear: query.releaseYear ?? null },
      candidates.map((game) => ({
        title: game.name ?? '',
        releaseYear: parseReleaseYear(toReleaseDate(game.first_release_date)),
        game,
      })),
    );

    return best === null ? null : this.toMetadata(best.candidate.game, best.confidence);
  }

  private async request(body: string): Promise<IgdbGame[]> {
    await this.limiter.acquire();
    const accessToken = await this.accessToken();

    const response = await this.fetchImpl(IGDB_GAMES_URL, {
      method: 'POST',
      headers: {
        'Client-ID': this.options.clientId,
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'text/plain',
      },
      body,
    });

    if (response.status === 401) {
      // Token rejected — drop it so the next attempt re-authenticates.
      this.token = null;
      throw new Error('IGDB unauthorized');
    }
    if (!response.ok) {
      throw new Error(`IGDB HTTP ${String(response.status)}`);
    }

    const json: unknown = await response.json();
    return Array.isArray(json) ? (json as IgdbGame[]) : [];
  }

  /** Cached Twitch app token; concurrent callers share one in-flight request. */
  private async accessToken(): Promise<string> {
    const cached = this.token;
    if (cached !== null && cached.expiresAtMs - TOKEN_REFRESH_MARGIN_MS > this.now()) {
      return cached.value;
    }
    this.tokenRequest ??= this.fetchToken().finally(() => {
      this.tokenRequest = null;
    });
    return this.tokenRequest;
  }

  private async fetchToken(): Promise<string> {
    const url = new URL(TWITCH_TOKEN_URL);
    url.searchParams.set('client_id', this.options.clientId);
    url.searchParams.set('client_secret', this.options.clientSecret);
    url.searchParams.set('grant_type', 'client_credentials');

    const response = await this.fetchImpl(url.toString(), {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Twitch token HTTP ${String(response.status)}`);
    }

    const json = (await response.json()) as TwitchTokenResponse;
    if (json.access_token == null || json.access_token.length === 0) {
      throw new Error('Twitch token missing access_token');
    }

    this.token = {
      value: json.access_token,
      expiresAtMs: this.now() + (json.expires_in ?? 3600) * 1000,
    };
    return json.access_token;
  }

  private toMetadata(game: IgdbGame, confidence: number): ProviderGameMetadata {
    const base = emptyProviderMetadata('igdb', IGDB_ATTRIBUTION);

    return {
      ...base,
      confidence,
      externalIds: {
        igdbId: game.id ?? null,
        steamAppId: extractSteamAppId(game.external_games),
      },
      title: game.name ?? null,
      summary: clampText(game.summary ?? null, SUMMARY_MAX),
      description: clampText(game.storyline ?? game.summary ?? null, DESCRIPTION_MAX),
      releaseDate: toReleaseDate(game.first_release_date),
      externalRating: normalizeRating(game.total_rating ?? null, 100),
      externalRatingCount: game.total_rating_count ?? null,
      genres: toNamedRefs(game.genres),
      tags: toTagRefs(game),
      platforms: toNamedRefs(game.platforms),
      companies: toCompanyRefs(game.involved_companies),
      franchise: toNamedRef(game.franchise),
      series: toNamedRef(game.collection),
      similarGames: toSimilarRefs(game.similar_games),
      media: toMediaRefs(game),
      trailerUrl: toTrailerUrl(game.videos),
    };
  }
}

function toReleaseDate(unixSeconds: number | undefined): Date | null {
  if (unixSeconds == null || !Number.isFinite(unixSeconds)) {
    return null;
  }
  const date = new Date(unixSeconds * 1000);
  return Number.isNaN(date.getTime()) ? null : date;
}

function extractSteamAppId(externals: IgdbExternalGame[] | undefined): number | null {
  for (const external of externals ?? []) {
    if (external.category !== IGDB_EXTERNAL_CATEGORY_STEAM || external.uid == null) {
      continue;
    }
    const parsed = Number.parseInt(external.uid, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
}

function toNamedRef(value: IgdbNamed | undefined): ProviderNamedRef | null {
  if (value?.name == null || value.name.trim().length === 0) {
    return null;
  }
  return { name: value.name.trim(), slug: slugifyRef(value.name) };
}

function toNamedRefs(values: IgdbNamed[] | undefined): ProviderNamedRef[] {
  const refs: ProviderNamedRef[] = [];
  for (const value of values ?? []) {
    const ref = toNamedRef(value);
    if (ref !== null) {
      refs.push(ref);
    }
  }
  return dedupeBySlug(refs);
}

function toTagRefs(game: IgdbGame): ProviderTagRef[] {
  const buckets: [IgdbNamed[] | undefined, TagKind][] = [
    [game.themes, 'theme'],
    [game.game_modes, 'mode'],
    [game.player_perspectives, 'perspective'],
    [game.keywords, 'keyword'],
  ];

  const refs: ProviderTagRef[] = [];
  for (const [values, kind] of buckets) {
    for (const ref of toNamedRefs(values)) {
      refs.push({ ...ref, kind });
    }
  }
  return dedupeBySlug(refs);
}

function toCompanyRefs(involved: IgdbInvolvedCompany[] | undefined): ProviderCompanyRef[] {
  const refs: ProviderCompanyRef[] = [];
  for (const entry of involved ?? []) {
    const ref = toNamedRef(entry.company);
    if (ref === null) {
      continue;
    }
    // One company may hold several roles on the same title.
    if (entry.developer === true) {
      refs.push({ ...ref, role: 'developer' });
    }
    if (entry.publisher === true) {
      refs.push({ ...ref, role: 'publisher' });
    }
    if (entry.porting === true) {
      refs.push({ ...ref, role: 'porting' });
    }
    if (entry.supporting === true) {
      refs.push({ ...ref, role: 'supporting' });
    }
  }
  return dedupeCompanies(refs);
}

function dedupeCompanies(refs: readonly ProviderCompanyRef[]): ProviderCompanyRef[] {
  const seen = new Set<string>();
  const out: ProviderCompanyRef[] = [];
  for (const ref of refs) {
    const key = `${ref.slug}:${ref.role}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(ref);
  }
  return out;
}

function toSimilarRefs(similar: IgdbNamed[] | undefined): ProviderSimilarRef[] {
  const refs: ProviderSimilarRef[] = [];
  let sortOrder = 0;
  for (const entry of similar ?? []) {
    if (entry.id == null) {
      continue;
    }
    refs.push({
      externalId: String(entry.id),
      title: entry.name ?? null,
      kind: 'similar' satisfies GameRelatedKind,
      sortOrder,
    });
    sortOrder += 1;
  }
  return refs;
}

function igdbImageUrl(imageId: string, kind: GameMediaKind): string | null {
  const size = IMAGE_SIZE_BY_KIND[kind] ?? 't_thumb';
  return absoluteImageUrl(`//images.igdb.com/igdb/image/upload/${size}/${imageId}.jpg`);
}

function pushImage(
  into: ProviderMediaRef[],
  image: IgdbImage | undefined,
  kind: GameMediaKind,
  sortOrder: number,
): void {
  if (image?.image_id == null || image.image_id.length === 0) {
    return;
  }
  const url = igdbImageUrl(image.image_id, kind);
  if (url === null) {
    return;
  }
  into.push({
    kind,
    url,
    width: image.width ?? null,
    height: image.height ?? null,
    sortOrder,
  });
}

function toMediaRefs(game: IgdbGame): ProviderMediaRef[] {
  const media: ProviderMediaRef[] = [];

  pushImage(media, game.cover, 'cover', 0);

  // First artwork doubles as the hero image; the rest stay artwork.
  const artworks = game.artworks ?? [];
  artworks.forEach((artwork, index) => {
    pushImage(media, artwork, index === 0 ? 'hero' : 'artwork', index);
  });

  (game.screenshots ?? []).forEach((screenshot, index) => {
    pushImage(media, screenshot, 'screenshot', index);
  });

  return media;
}

function toTrailerUrl(videos: { video_id?: string }[] | undefined): string | null {
  const videoId = videos?.find((video) => video.video_id != null)?.video_id;
  if (videoId == null || videoId.length === 0) {
    return null;
  }
  return `https://www.youtube.com/watch?v=${videoId}`;
}
