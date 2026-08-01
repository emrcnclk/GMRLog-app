import type {
  GameHubResponse,
  GameMediaResponse,
  GameResponse,
  LibraryStatusValue,
} from '@gmrlog/types';
import type { SegmentedTabItem } from '@gmrlog/ui';
import { REVIEW_RATING_MAX } from '@gmrlog/validators';

/**
 * D3.27 Game Hub presentation model. Pure functions only — the screen stays a
 * thin renderer and every formatting rule below is covered by
 * `game-detail-model.spec.ts`.
 */

export type GameHubTabId =
  | 'overview'
  | 'reviews'
  | 'activity'
  | 'screenshots'
  | 'videos'
  | 'collections'
  | 'recommendations';

export const GAME_HUB_TAB_LABELS: Record<GameHubTabId, string> = {
  overview: 'Overview',
  reviews: 'Reviews',
  activity: 'Activity',
  screenshots: 'Screenshots',
  videos: 'Videos',
  collections: 'Collections',
  recommendations: 'More like this',
};

export const GAME_HUB_TAB_ORDER: readonly GameHubTabId[] = [
  'overview',
  'reviews',
  'activity',
  'screenshots',
  'videos',
  'collections',
  'recommendations',
];

export function isGameHubTabId(value: string): value is GameHubTabId {
  return (GAME_HUB_TAB_ORDER as readonly string[]).includes(value);
}

export interface GameHubTabCountInput {
  hub: GameHubResponse | null;
  videoCount: number;
  screenshotCount: number;
  recommendationCount: number;
}

/**
 * Tab strip descriptor. Counts are omitted rather than shown as `0` while the
 * underlying read is still pending — a flash of "Reviews 0" reads as "none exist".
 */
export function buildGameHubTabs({
  hub,
  videoCount,
  screenshotCount,
  recommendationCount,
}: GameHubTabCountInput): SegmentedTabItem<GameHubTabId>[] {
  const counts = hub?.tabCounts;

  return GAME_HUB_TAB_ORDER.map((id) => {
    const label = GAME_HUB_TAB_LABELS[id];
    switch (id) {
      case 'reviews':
        return { id, label, count: counts?.reviews };
      case 'collections':
        return { id, label, count: counts?.collections };
      case 'screenshots':
        return { id, label, count: screenshotCount > 0 ? screenshotCount : undefined };
      case 'videos':
        return { id, label, count: videoCount > 0 ? videoCount : undefined };
      case 'recommendations':
        return { id, label, count: recommendationCount > 0 ? recommendationCount : undefined };
      default:
        return { id, label };
    }
  });
}

/**
 * Tabs whose body is one self-contained block — a prose column, a grid, a set
 * of rails — rather than a list of rows. They render whole and carry their own
 * empty copy, so the hub's list-level empty state must not also fire for them.
 */
export const GAME_HUB_BLOCK_TABS: readonly GameHubTabId[] = [
  'overview',
  'screenshots',
  'videos',
  'recommendations',
];

export function isGameHubBlockTab(tab: GameHubTabId): boolean {
  return GAME_HUB_BLOCK_TABS.includes(tab);
}

/**
 * Empty-state copy for a list-bearing tab.
 *
 * An empty tab is an invitation, not a dead end: reviews and collections name
 * the action that fills them. Block tabs are absent from this map on purpose —
 * asking for their copy is a caller bug, so they fall to the activity wording
 * rather than silently rendering an empty string.
 */
export function gameHubEmptyCopy(
  tab: GameHubTabId,
  gameTitle: string,
): { icon: string; description: string } {
  switch (tab) {
    case 'reviews':
      return { icon: 'star', description: `Be the first to write about ${gameTitle}.` };
    case 'collections':
      return {
        icon: 'folder',
        description: `${gameTitle} has not been added to a public collection yet.`,
      };
    default:
      return {
        icon: 'activity',
        description: `Logs, reviews, and posts about ${gameTitle} will appear here.`,
      };
  }
}

/** Release year alone — the full date is noise in a hero. */
export function formatReleaseYear(releaseDate: string | null): string | null {
  if (releaseDate === null || releaseDate.length < 4) {
    return null;
  }
  const year = Number.parseInt(releaseDate.slice(0, 4), 10);
  return Number.isNaN(year) ? null : String(year);
}

/**
 * Provider critic score. IGDB/Steam both express this 0–100, so it is rendered
 * as a whole number and never mixed into the 1–10 community scale.
 */
export function formatCriticScore(game: Pick<GameResponse, 'externalRating'>): string | null {
  if (game.externalRating === null) {
    return null;
  }
  return String(Math.round(game.externalRating));
}

/** Community average on the documented 1–10 review scale. */
export function formatCommunityRating(game: Pick<GameResponse, 'stats'>): string | null {
  const average = game.stats?.ratingAverage;
  if (average === null || average === undefined) {
    return null;
  }
  return `${average.toFixed(1)} / ${String(REVIEW_RATING_MAX)}`;
}

/**
 * Hero artwork with a documented fallback chain. Returning the cover as a last
 * resort is deliberate: a blurred, scrimmed cover still beats an empty band.
 */
export function resolveHeroArtwork(
  game: Pick<GameResponse, 'heroUrl' | 'coverUrl'> | null,
  media: readonly GameMediaResponse[],
): string | null {
  if (game?.heroUrl != null && game.heroUrl.length > 0) {
    return game.heroUrl;
  }
  const banner = media.find((item) => item.kind === 'hero' || item.kind === 'banner');
  if (banner?.url != null && banner.url.length > 0) {
    return banner.url;
  }
  const artwork = media.find((item) => item.kind === 'artwork');
  if (artwork?.url != null && artwork.url.length > 0) {
    return artwork.url;
  }
  const firstShot = media.find((item) => item.kind === 'screenshot');
  if (firstShot?.url != null && firstShot.url.length > 0) {
    return firstShot.url;
  }
  return game?.coverUrl ?? null;
}

export interface GameMediaBuckets {
  screenshots: GameMediaResponse[];
  videos: GameMediaResponse[];
}

/**
 * Split catalog media into the buckets the Screenshots and Videos tabs render.
 * Entries without a resolved URL are dropped — the ingestion pipeline can leave
 * a row behind before mirroring finishes, and a broken tile is worse than none.
 */
export function bucketGameMedia(
  media: readonly GameMediaResponse[],
  inlineScreenshots: readonly GameMediaResponse[] = [],
): GameMediaBuckets {
  const seen = new Set<string>();
  const screenshots: GameMediaResponse[] = [];
  const videos: GameMediaResponse[] = [];

  for (const item of [...media, ...inlineScreenshots]) {
    if (item.url === null || item.url.length === 0 || seen.has(item.id)) {
      continue;
    }
    seen.add(item.id);
    if (item.kind === 'screenshot' || item.kind === 'artwork') {
      screenshots.push(item);
    } else if (item.kind === 'video' || item.kind === 'trailer') {
      videos.push(item);
    }
  }

  const bySortOrder = (a: GameMediaResponse, b: GameMediaResponse): number =>
    a.sortOrder - b.sortOrder;

  return {
    screenshots: screenshots.sort(bySortOrder),
    videos: videos.sort(bySortOrder),
  };
}

/** Human label for the viewer's shelf state, used on the hero's primary action. */
export const LIBRARY_STATUS_LABELS: Record<LibraryStatusValue, string> = {
  owned: 'In library',
  playing: 'Playing',
  completed: 'Completed',
  wishlist: 'Wishlisted',
  backlog: 'In backlog',
  hidden: 'Hidden',
  dropped: 'Dropped',
};

/**
 * Metadata provenance line. Attribution is a licensing obligation for IGDB and
 * Steam (docs/18_CATALOG/METADATA_LICENSING.md), so it renders whenever present.
 */
export function formatAttribution(game: Pick<GameResponse, 'metadata'> | null): string | null {
  const attribution = game?.metadata.attribution;
  if (attribution == null || attribution.length === 0) {
    return null;
  }
  return attribution;
}

/** Comma-joined names, capped so a 12-studio credit list cannot wrap forever. */
export function formatCompanies(companies: readonly { name: string }[], limit = 3): string | null {
  if (companies.length === 0) {
    return null;
  }
  const names = companies.slice(0, limit).map((company) => company.name);
  const remainder = companies.length - names.length;
  return remainder > 0 ? `${names.join(', ')} +${String(remainder)}` : names.join(', ');
}
