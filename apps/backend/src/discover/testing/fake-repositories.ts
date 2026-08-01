import type {
  Community,
  DiscoverGameRecord,
  DiscoverGamesListCursor,
  DiscoverGamesListParams,
  DiscoverListParams,
  DiscoverRepository,
  Event,
} from '@gmrlog/database';

/**
 * In-memory discover repository fake — test support only (build-excluded).
 */

export interface FakeDiscoverRepository extends DiscoverRepository {
  communities: Community[];
  events: Event[];
  games: DiscoverGameRecord[];
}

export function createFakeDiscoverRepository(
  seed: {
    communities?: Community[];
    events?: Event[];
    games?: DiscoverGameRecord[];
  } = {},
): FakeDiscoverRepository {
  const communities = [...(seed.communities ?? [])];
  const events = [...(seed.events ?? [])];
  const games = [...(seed.games ?? [])];

  const filterWithCursor = <T extends { id: string }>(
    rows: T[],
    getOrderedAt: (row: T) => Date,
    params: DiscoverListParams,
  ): T[] => {
    let list = [...rows].sort((a, b) => {
      const byTime = getOrderedAt(b).getTime() - getOrderedAt(a).getTime();
      return byTime !== 0 ? byTime : b.id.localeCompare(a.id);
    });
    if (params.cursor !== undefined) {
      const cursor = params.cursor;
      const cursorTime = cursor.orderedAt.getTime();
      list = list.filter((row) => {
        const time = getOrderedAt(row).getTime();
        return time < cursorTime || (time === cursorTime && row.id < cursor.id);
      });
    }
    return list.slice(0, params.limit);
  };

  const repo: FakeDiscoverRepository = {
    communities,
    events,
    games,
    listDiscoverCommunities: (params) =>
      Promise.resolve(
        filterWithCursor(
          communities.filter((row) => row.deletedAt == null && row.visibility === 'public'),
          (row) => row.updatedAt,
          params,
        ),
      ),
    listDiscoverEvents: (params) =>
      Promise.resolve(
        filterWithCursor(
          events.filter((row) => row.deletedAt == null),
          (row) => row.startsAt,
          params,
        ),
      ),
    listDiscoverGames: (params) =>
      Promise.resolve(filterDiscoverGames(repo.games, params).slice(0, params.limit)),
    listDiscoverGamesByIds: (gameIds) => {
      const byId = new Map(repo.games.map((row) => [row.game.id, row]));
      return Promise.resolve(
        gameIds
          .map((id) => byId.get(id))
          .filter((row): row is DiscoverGameRecord => row !== undefined),
      );
    },
  };
  return repo;
}

function filterDiscoverGames(
  rows: DiscoverGameRecord[],
  params: DiscoverGamesListParams,
): DiscoverGameRecord[] {
  let list = [...rows];

  if (params.genreId !== undefined) {
    list = list.filter((row) => row.genres.some((genre) => genre.id === params.genreId));
  }
  if (params.platformId !== undefined) {
    list = list.filter((row) =>
      row.platforms.some((platform) => platform.id === params.platformId),
    );
  }
  if (params.franchiseId !== undefined) {
    list = list.filter((row) => row.game.franchiseId === params.franchiseId);
  }

  list.sort((a, b) => compareGames(a.game, b.game, params.sort));

  if (params.cursor !== undefined) {
    const cursor = params.cursor;
    list = list.filter((row) => isGameAfterCursor(row.game, cursor));
  }

  return list;
}

function compareGames(
  a: DiscoverGameRecord['game'],
  b: DiscoverGameRecord['game'],
  sort: DiscoverGamesListParams['sort'],
): number {
  switch (sort) {
    case 'popular':
      return comparePopular(a, b);
    case 'recent':
      return compareRecent(a, b);
    case 'featured':
      return compareFeatured(a, b);
    default:
      return compareDefault(a, b);
  }
}

function compareDefault(a: DiscoverGameRecord['game'], b: DiscoverGameRecord['game']): number {
  const featured = compareFeatured(a, b);
  if (featured !== 0) {
    return featured;
  }
  const popular = comparePopular(a, b);
  if (popular !== 0) {
    return popular;
  }
  return compareRecent(a, b);
}

function comparePopular(a: DiscoverGameRecord['game'], b: DiscoverGameRecord['game']): number {
  if (a.popularity !== b.popularity) {
    return b.popularity - a.popularity;
  }
  return a.id.localeCompare(b.id);
}

function compareRecent(a: DiscoverGameRecord['game'], b: DiscoverGameRecord['game']): number {
  const aTime = a.releaseDate?.getTime() ?? Number.NEGATIVE_INFINITY;
  const bTime = b.releaseDate?.getTime() ?? Number.NEGATIVE_INFINITY;
  if (aTime !== bTime) {
    return bTime - aTime;
  }
  return a.id.localeCompare(b.id);
}

function compareFeatured(a: DiscoverGameRecord['game'], b: DiscoverGameRecord['game']): number {
  if (a.featured !== b.featured) {
    return a.featured ? -1 : 1;
  }
  return a.id.localeCompare(b.id);
}

function isGameAfterCursor(
  game: DiscoverGameRecord['game'],
  cursor: DiscoverGamesListCursor,
): boolean {
  switch (cursor.mode) {
    case 'popular':
      return (
        game.popularity < cursor.popularity ||
        (game.popularity === cursor.popularity && game.id > cursor.id)
      );
    case 'recent': {
      const gameTime = game.releaseDate?.getTime() ?? Number.NEGATIVE_INFINITY;
      const cursorTime = cursor.releaseDate?.getTime() ?? Number.NEGATIVE_INFINITY;
      return (
        gameTime < cursorTime ||
        (gameTime === cursorTime && game.id > cursor.id) ||
        (cursor.releaseDate === null && game.releaseDate === null && game.id > cursor.id)
      );
    }
    case 'featured':
      if (cursor.featured && !game.featured) {
        return true;
      }
      if (cursor.featured === game.featured) {
        return game.id > cursor.id;
      }
      return false;
    default:
      return isDefaultAfterCursor(game, cursor);
  }
}

function isDefaultAfterCursor(
  game: DiscoverGameRecord['game'],
  cursor: {
    mode: 'default';
    featured: boolean;
    popularity: number;
    releaseDate: Date | null;
    id: string;
  },
): boolean {
  if (cursor.featured && !game.featured) {
    return true;
  }
  if (game.featured !== cursor.featured) {
    return false;
  }
  if (game.popularity < cursor.popularity) {
    return true;
  }
  if (game.popularity > cursor.popularity) {
    return false;
  }
  const gameTime = game.releaseDate?.getTime() ?? Number.NEGATIVE_INFINITY;
  const cursorTime = cursor.releaseDate?.getTime() ?? Number.NEGATIVE_INFINITY;
  if (gameTime < cursorTime) {
    return true;
  }
  if (gameTime > cursorTime) {
    return false;
  }
  return game.id > cursor.id;
}
