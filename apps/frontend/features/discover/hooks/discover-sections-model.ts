import type { FeedItemResponse, GameCardResponse, LibraryEntryResponse } from '@gmrlog/types';

/**
 * D3.28 Discover rail model. Pure functions only — every ordering and filtering
 * rule below is covered by `discover-sections-model.spec.ts`, and the screen
 * stays a renderer.
 *
 * ## Where these rails come from
 *
 * The backend is under feature freeze for D3.28, so no rail may invent an
 * endpoint. Six of the ten map to a real route. The other four are **client-side
 * projections over a single fetched page of `GET /discover/games`** — they are
 * views of that page, not server rankings, and they are labelled as such in the
 * UI subtitle so nobody reads "Highest Rated" as a global leaderboard.
 *
 * | Rail | Source |
 * |---|---|
 * | Continue Playing | `GET /library/entries` (status `playing`) |
 * | Recommended For You | `GET /discover/recommended` |
 * | Friends Are Playing | `GET /feed?filter=games` |
 * | Trending | `GET /discover/trending?window=7d` |
 * | Popular This Week | `GET /discover/popular` |
 * | Hidden Gems | `GET /discover/hidden-gems` |
 * | Highest Rated | projection over `/discover/games` |
 * | Upcoming Releases | projection over `/discover/games` |
 * | Recently Released | projection over `/discover/games` |
 * | Indie Spotlight | projection over `/discover/games` |
 */

export type DiscoverRailId =
  | 'continue-playing'
  | 'recommended'
  | 'friends-playing'
  | 'trending'
  | 'popular'
  | 'highest-rated'
  | 'upcoming'
  | 'recently-released'
  | 'hidden-gems'
  | 'indie';

/**
 * Rail order. Personal context first (what you were doing, what is picked for
 * you, what your people are doing), then the wider culture, then the long tail.
 * A player opening Discover should see themselves before they see a chart.
 */
export const DISCOVER_RAIL_ORDER: readonly DiscoverRailId[] = [
  'continue-playing',
  'recommended',
  'friends-playing',
  'trending',
  'popular',
  'highest-rated',
  'upcoming',
  'recently-released',
  'hidden-gems',
  'indie',
];

export const DISCOVER_RAIL_TITLES: Record<DiscoverRailId, string> = {
  'continue-playing': 'Continue playing',
  recommended: 'Recommended for you',
  'friends-playing': 'Friends are playing',
  trending: 'Trending',
  popular: 'Popular this week',
  'highest-rated': 'Highest rated',
  upcoming: 'Upcoming releases',
  'recently-released': 'Recently released',
  'hidden-gems': 'Hidden gems',
  indie: 'Indie spotlight',
};

/**
 * Rail subtitles double as provenance. A projection says so ("from the current
 * catalog page") rather than implying a ranking the server never computed.
 */
export const DISCOVER_RAIL_SUBTITLES: Record<DiscoverRailId, string> = {
  'continue-playing': 'Still on your shelf',
  recommended: 'Shaped by what you play and rate',
  'friends-playing': 'Recent game activity from people you follow',
  trending: 'Moving fastest over the last 7 days',
  popular: 'Most added to libraries',
  'highest-rated': 'Best reviewed in the current catalog page',
  upcoming: 'Dated releases still ahead',
  'recently-released': 'Out in the last 90 days',
  'hidden-gems': 'High praise, quieter rooms',
  indie: 'Independent studios in the current catalog page',
};

/** Deep link to the dedicated list screen, where one exists. */
export const DISCOVER_RAIL_HREFS: Record<DiscoverRailId, string | null> = {
  'continue-playing': null,
  recommended: '/(app)/(tabs)/discover/recommended',
  'friends-playing': null,
  trending: '/(app)/(tabs)/discover/trending',
  popular: '/(app)/(tabs)/discover/popular',
  'highest-rated': '/(app)/(tabs)/discover/games',
  upcoming: '/(app)/(tabs)/discover/games',
  'recently-released': '/(app)/(tabs)/discover/games',
  'hidden-gems': '/(app)/(tabs)/discover/hidden-gems',
  indie: '/(app)/(tabs)/discover/games',
};

/** Rails built from a projection rather than a dedicated endpoint. */
export const DISCOVER_PROJECTED_RAILS: readonly DiscoverRailId[] = [
  'highest-rated',
  'upcoming',
  'recently-released',
  'indie',
];

export function isProjectedRail(id: DiscoverRailId): boolean {
  return DISCOVER_PROJECTED_RAILS.includes(id);
}

/** Tiles per rail. Enough to feel deep, few enough to stay one swipe. */
export const RAIL_LIMIT = 12;

/**
 * A single rating cannot carry a "highest rated" claim. Requiring a floor keeps
 * one five-star review from outranking a game with two hundred.
 */
export const MIN_RATINGS_FOR_RANKING = 3;

/** How far back "recently released" reaches. */
export const RECENT_RELEASE_WINDOW_DAYS = 90;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DiscoverRailModel {
  id: DiscoverRailId;
  title: string;
  subtitle: string;
  href: string | null;
  games: GameCardResponse[];
  /** True when the rail is a client-side view rather than a server ranking. */
  isProjection: boolean;
}

function parseReleaseMs(game: GameCardResponse): number | null {
  if (game.releaseDate === null) {
    return null;
  }
  const parsed = Date.parse(game.releaseDate);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Best-reviewed of the fetched page, among games with enough ratings to mean
 * anything. Ties break on rating count so the better-evidenced game wins.
 */
export function selectHighestRated(
  games: readonly GameCardResponse[],
  limit = RAIL_LIMIT,
): GameCardResponse[] {
  return games
    .filter(
      (game) =>
        game.ratingSummary.average !== null && game.ratingSummary.count >= MIN_RATINGS_FOR_RANKING,
    )
    .sort((a, b) => {
      const byAverage = (b.ratingSummary.average ?? 0) - (a.ratingSummary.average ?? 0);
      return byAverage !== 0 ? byAverage : b.ratingSummary.count - a.ratingSummary.count;
    })
    .slice(0, limit);
}

/** Dated releases still ahead of now, soonest first. */
export function selectUpcoming(
  games: readonly GameCardResponse[],
  nowMs: number,
  limit = RAIL_LIMIT,
): GameCardResponse[] {
  return games
    .flatMap((game) => {
      const released = parseReleaseMs(game);
      return released !== null && released > nowMs ? [{ game, released }] : [];
    })
    .sort((a, b) => a.released - b.released)
    .slice(0, limit)
    .map((row) => row.game);
}

/** Out within the window, newest first. */
export function selectRecentlyReleased(
  games: readonly GameCardResponse[],
  nowMs: number,
  limit = RAIL_LIMIT,
): GameCardResponse[] {
  const floor = nowMs - RECENT_RELEASE_WINDOW_DAYS * DAY_MS;
  return games
    .flatMap((game) => {
      const released = parseReleaseMs(game);
      return released !== null && released <= nowMs && released >= floor
        ? [{ game, released }]
        : [];
    })
    .sort((a, b) => b.released - a.released)
    .slice(0, limit)
    .map((row) => row.game);
}

/**
 * Independent titles. IGDB expresses this as a genre rather than a flag, so the
 * match is on the genre name and is deliberately case-insensitive — provider
 * casing is not something this client should depend on.
 */
export function selectIndie(
  games: readonly GameCardResponse[],
  limit = RAIL_LIMIT,
): GameCardResponse[] {
  return games
    .filter((game) => game.genres.some((genre) => genre.name.trim().toLowerCase() === 'indie'))
    .slice(0, limit);
}

/**
 * Games the viewer is part-way through, most recently touched first.
 *
 * `LibraryGameSummary` is a thinner shape than `GameCardResponse` — no genres,
 * no rating, no responsive image — so the rest is filled with empty values
 * rather than invented ones. The card renders what is present and omits the
 * rest; nothing here fabricates a rating the library read never returned.
 */
export function selectContinuePlaying(
  entries: readonly LibraryEntryResponse[],
  limit = RAIL_LIMIT,
): GameCardResponse[] {
  return entries
    .filter((entry) => entry.status === 'playing')
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, limit)
    .map((entry) => ({
      id: entry.game.id,
      slug: entry.game.slug,
      title: entry.game.title,
      coverImageUrl: entry.game.coverUrl,
      coverImage: null,
      heroImageUrl: null,
      heroImage: null,
      summary: null,
      releaseDate: null,
      genres: [],
      platforms: [],
      ratingSummary: { average: null, count: 0 },
      libraryCount: 0,
    }));
}

/**
 * Games the viewer's people have touched recently, de-duplicated.
 *
 * The feed carries object references, not game cards — it can tell us *which*
 * game was played but not what it looks like. Rather than fetch each one
 * (N requests for one rail), the ids are resolved against games already loaded
 * for other rails. A friend playing something outside that set is dropped, which
 * is the honest trade: no placeholder tiles, no request storm.
 */
export function selectFriendsPlaying(
  feed: readonly FeedItemResponse[],
  known: readonly GameCardResponse[],
  limit = RAIL_LIMIT,
): GameCardResponse[] {
  const byId = new Map(known.map((game) => [game.id, game]));
  const seen = new Set<string>();
  const picked: GameCardResponse[] = [];

  for (const item of feed) {
    if (item.object.type !== 'game' || seen.has(item.object.id)) {
      continue;
    }
    const game = byId.get(item.object.id);
    if (game === undefined) {
      continue;
    }
    seen.add(item.object.id);
    picked.push(game);
    if (picked.length >= limit) {
      break;
    }
  }

  return picked;
}

export interface DiscoverGenreChip {
  id: string;
  name: string;
}

/**
 * Genre chips (`SCREEN_REDESIGNS.md` §7) are a client-side projection over
 * whatever rail games are already loaded — there is no `/discover/genres` (or
 * any other canonical genre list) endpoint anywhere in this API, the same
 * "no rail may invent an endpoint" constraint the rails above are already
 * built under. Genres collapse by id across every rail's games; order is
 * first-seen, which in practice tracks `DISCOVER_RAIL_ORDER`.
 */
export function selectGenreChips(
  rails: readonly DiscoverRailModel[],
  limit = 10,
): DiscoverGenreChip[] {
  const seen = new Map<string, DiscoverGenreChip>();

  outer: for (const rail of rails) {
    for (const game of rail.games) {
      for (const genre of game.genres) {
        if (!seen.has(genre.id)) {
          seen.set(genre.id, { id: genre.id, name: genre.name });
        }
        if (seen.size >= limit) {
          break outer;
        }
      }
    }
  }

  return [...seen.values()];
}

export interface DiscoverRailInput {
  continuePlaying: readonly LibraryEntryResponse[];
  recommended: readonly GameCardResponse[];
  friendsFeed: readonly FeedItemResponse[];
  trending: readonly GameCardResponse[];
  popular: readonly GameCardResponse[];
  hiddenGems: readonly GameCardResponse[];
  catalog: readonly GameCardResponse[];
  nowMs: number;
}

/**
 * Assemble every rail, dropping the empty ones.
 *
 * An empty rail is worse than no rail: a titled shelf with nothing under it
 * reads as broken, and ten of them read as an empty product. Discover shows
 * only what it actually has, and the screen falls back to a single empty state
 * when it has nothing at all.
 */
export function buildDiscoverRails(input: DiscoverRailInput): DiscoverRailModel[] {
  const catalogPool = [...input.catalog, ...input.trending, ...input.popular];

  const gamesFor = (id: DiscoverRailId): GameCardResponse[] => {
    switch (id) {
      case 'continue-playing':
        return selectContinuePlaying(input.continuePlaying);
      case 'recommended':
        return input.recommended.slice(0, RAIL_LIMIT);
      case 'friends-playing':
        return selectFriendsPlaying(input.friendsFeed, catalogPool);
      case 'trending':
        return input.trending.slice(0, RAIL_LIMIT);
      case 'popular':
        return input.popular.slice(0, RAIL_LIMIT);
      case 'highest-rated':
        return selectHighestRated(input.catalog);
      case 'upcoming':
        return selectUpcoming(input.catalog, input.nowMs);
      case 'recently-released':
        return selectRecentlyReleased(input.catalog, input.nowMs);
      case 'hidden-gems':
        return input.hiddenGems.slice(0, RAIL_LIMIT);
      case 'indie':
        return selectIndie(input.catalog);
      default: {
        const _exhaustive: never = id;
        return _exhaustive;
      }
    }
  };

  return DISCOVER_RAIL_ORDER.flatMap((id) => {
    const games = gamesFor(id);
    if (games.length === 0) {
      return [];
    }
    return [
      {
        id,
        title: DISCOVER_RAIL_TITLES[id],
        subtitle: DISCOVER_RAIL_SUBTITLES[id],
        href: DISCOVER_RAIL_HREFS[id],
        games,
        isProjection: isProjectedRail(id),
      },
    ];
  });
}
