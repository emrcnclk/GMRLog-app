import type {
  GameHubResponse,
  GameMediaResponse,
  GameResponse,
  LibraryStatusValue,
  ReviewResponse,
} from '@gmrlog/types';
import type { DistributionRow, SegmentedTabItem } from '@gmrlog/ui';
import { REVIEW_RATING_MAX } from '@gmrlog/validators';

/**
 * D3.27 / §5 Game Hub presentation model. Pure functions only — the screen
 * stays a thin renderer and every formatting rule below is covered by
 * `game-detail-model.spec.ts`.
 */

/**
 * §5's five tabs (About/Reviews/Community/Workshop/Players), plus
 * `recommendations` — real, working "Players also like" content the doc
 * never asks to remove, kept per the same call 3.7 made for Discover's rails.
 * `screenshots` and `videos` fold into `about`; `activity` and `collections`
 * fold into `community`.
 */
export type GameHubTabId =
  'about' | 'reviews' | 'community' | 'workshop' | 'players' | 'recommendations';

export const GAME_HUB_TAB_LABELS: Record<GameHubTabId, string> = {
  about: 'About',
  reviews: 'Reviews',
  community: 'Community',
  workshop: 'Workshop',
  players: 'Players',
  recommendations: 'More like this',
};

export const GAME_HUB_TAB_ORDER: readonly GameHubTabId[] = [
  'about',
  'reviews',
  'community',
  'workshop',
  'players',
  'recommendations',
];

export function isGameHubTabId(value: string): value is GameHubTabId {
  return (GAME_HUB_TAB_ORDER as readonly string[]).includes(value);
}

export interface GameHubTabCountInput {
  hub: GameHubResponse | null;
  recommendationCount: number;
}

/**
 * Tab strip descriptor. Counts are omitted rather than shown as `0` while the
 * underlying read is still pending — a flash of "Reviews 0" reads as "none exist".
 */
export function buildGameHubTabs({
  hub,
  recommendationCount,
}: GameHubTabCountInput): SegmentedTabItem<GameHubTabId>[] {
  const counts = hub?.tabCounts;

  return GAME_HUB_TAB_ORDER.map((id) => {
    const label = GAME_HUB_TAB_LABELS[id];
    switch (id) {
      case 'reviews':
        return { id, label, count: counts?.reviews };
      case 'workshop':
        return { id, label, count: counts?.guides };
      case 'players':
        return { id, label, count: counts?.players };
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
  'about',
  'community',
  'recommendations',
];

export function isGameHubBlockTab(tab: GameHubTabId): boolean {
  return GAME_HUB_BLOCK_TABS.includes(tab);
}

/**
 * Empty-state copy for a list-bearing tab.
 *
 * An empty tab is an invitation, not a dead end: reviews and workshop name
 * the action that fills them. Block tabs are absent from this map on purpose —
 * asking for their copy is a caller bug, so they fall to the players wording
 * rather than silently rendering an empty string.
 */
export function gameHubEmptyCopy(
  tab: GameHubTabId,
  gameTitle: string,
): { icon: string; description: string } {
  switch (tab) {
    case 'reviews':
      return { icon: 'star', description: `Be the first to write about ${gameTitle}.` };
    case 'workshop':
      return { icon: 'folder', description: `No one has posted a guide for ${gameTitle} yet.` };
    default:
      return {
        icon: 'users',
        description: `Nobody in the catalog has logged ${gameTitle} yet.`,
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

/**
 * How far the cover pulls up into the key art (§5's literal "-74px") — an
 * off-grid compositional constant in the same class as `RARITY_PLATE_MIN`,
 * not a spacing token.
 */
export const COVER_OVERLAP = 74;

/** Fixed key-art height (§5's literal "330px full-bleed key art"). */
export const GAME_HUB_HERO_HEIGHT = 330;

const RATING_BANDS: readonly { label: string; min: number; max: number }[] = [
  { label: '9–10', min: 9, max: 10 },
  { label: '7–8', min: 7, max: 8 },
  { label: '5–6', min: 5, max: 6 },
  { label: '3–4', min: 3, max: 4 },
  { label: '1–2', min: 1, max: 2 },
];

/**
 * Five-row rating histogram (§5's Reviews tab) built client-side from the real
 * per-review `rating` field — there is no server-computed distribution
 * endpoint, so this buckets `reviews.items` the same way a profile's own
 * distribution would. Ratings round to the nearest whole point before binning.
 */
export function bucketReviewDistribution(
  reviews: readonly Pick<ReviewResponse, 'rating'>[],
): DistributionRow[] {
  return RATING_BANDS.map((band) => ({
    label: band.label,
    count: reviews.filter((review) => {
      const rounded = Math.round(review.rating);
      return rounded >= band.min && rounded <= band.max;
    }).length,
  }));
}
