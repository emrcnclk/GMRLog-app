import type { Game, Genre, Platform, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

/** S1.2 §13.5 — discover games sort modes. */
export type DiscoverGamesSort = 'default' | 'popular' | 'recent' | 'featured';

export interface DiscoverGamesDefaultCursor {
  mode: 'default';
  featured: boolean;
  popularity: number;
  releaseDate: Date | null;
  id: string;
}

export interface DiscoverGamesPopularCursor {
  mode: 'popular';
  popularity: number;
  id: string;
}

export interface DiscoverGamesRecentCursor {
  mode: 'recent';
  releaseDate: Date | null;
  id: string;
}

export interface DiscoverGamesFeaturedCursor {
  mode: 'featured';
  featured: boolean;
  id: string;
}

export type DiscoverGamesListCursor =
  | DiscoverGamesDefaultCursor
  | DiscoverGamesPopularCursor
  | DiscoverGamesRecentCursor
  | DiscoverGamesFeaturedCursor;

export interface DiscoverGamesListParams {
  limit: number;
  cursor?: DiscoverGamesListCursor;
  sort: DiscoverGamesSort;
  genreId?: string;
  platformId?: string;
  franchiseId?: string;
}

export interface DiscoverGameRecord {
  game: Game;
  genres: Genre[];
  platforms: Platform[];
  ratingAverage: number | null;
  ratingCount: number;
  libraryCount: number;
}

export async function listDiscoverGames(
  db: DatabaseClient,
  params: DiscoverGamesListParams,
): Promise<DiscoverGameRecord[]> {
  const where = buildDiscoverGamesWhere(params);
  const orderBy = buildDiscoverGamesOrderBy(params.sort);

  const games = await db.game.findMany({
    where,
    orderBy,
    take: params.limit,
  });

  return enrichDiscoverGames(db, games);
}

/** Preserve caller order when projecting GameCard rows by id. */
export async function listDiscoverGamesByIds(
  db: DatabaseClient,
  gameIds: string[],
): Promise<DiscoverGameRecord[]> {
  if (gameIds.length === 0) {
    return [];
  }
  const games = await db.game.findMany({
    where: { id: { in: gameIds } },
  });
  const byId = new Map(games.map((game) => [game.id, game]));
  const ordered = gameIds
    .map((id) => byId.get(id))
    .filter((game): game is Game => game !== undefined);
  return enrichDiscoverGames(db, ordered);
}

function buildDiscoverGamesWhere(params: DiscoverGamesListParams): Prisma.GameWhereInput {
  const filters: Prisma.GameWhereInput[] = [];

  if (params.genreId !== undefined) {
    filters.push({ genres: { some: { genreId: params.genreId } } });
  }
  if (params.platformId !== undefined) {
    filters.push({ platforms: { some: { platformId: params.platformId } } });
  }
  if (params.franchiseId !== undefined) {
    filters.push({ franchiseId: params.franchiseId });
  }

  const cursorWhere =
    params.cursor !== undefined ? buildDiscoverGamesCursorWhere(params.cursor) : undefined;

  if (filters.length === 0 && cursorWhere === undefined) {
    return {};
  }

  return {
    AND: [...filters, ...(cursorWhere !== undefined ? [cursorWhere] : [])],
  };
}

function buildDiscoverGamesOrderBy(sort: DiscoverGamesSort): Prisma.GameOrderByWithRelationInput[] {
  switch (sort) {
    case 'popular':
      return [{ popularity: 'desc' }, { id: 'asc' }];
    case 'recent':
      return [{ releaseDate: { sort: 'desc', nulls: 'last' } }, { id: 'asc' }];
    case 'featured':
      return [{ featured: 'desc' }, { id: 'asc' }];
    default:
      return [
        { featured: 'desc' },
        { popularity: 'desc' },
        { releaseDate: { sort: 'desc', nulls: 'last' } },
        { id: 'asc' },
      ];
  }
}

function buildDiscoverGamesCursorWhere(cursor: DiscoverGamesListCursor): Prisma.GameWhereInput {
  switch (cursor.mode) {
    case 'popular':
      return {
        OR: [
          { popularity: { lt: cursor.popularity } },
          { popularity: cursor.popularity, id: { gt: cursor.id } },
        ],
      };
    case 'recent':
      return buildRecentCursorWhere(cursor);
    case 'featured':
      return buildFeaturedCursorWhere(cursor);
    default:
      return buildDefaultCursorWhere(cursor);
  }
}

function buildDefaultCursorWhere(cursor: DiscoverGamesDefaultCursor): Prisma.GameWhereInput {
  const branches: Prisma.GameWhereInput[] = [];

  if (cursor.featured) {
    branches.push({ featured: false });
  }

  branches.push({
    featured: cursor.featured,
    popularity: { lt: cursor.popularity },
  });

  if (cursor.releaseDate === null) {
    branches.push({
      featured: cursor.featured,
      popularity: cursor.popularity,
      releaseDate: null,
      id: { gt: cursor.id },
    });
  } else {
    branches.push({
      featured: cursor.featured,
      popularity: cursor.popularity,
      releaseDate: { lt: cursor.releaseDate },
    });
    branches.push({
      featured: cursor.featured,
      popularity: cursor.popularity,
      releaseDate: cursor.releaseDate,
      id: { gt: cursor.id },
    });
  }

  return { OR: branches };
}

function buildRecentCursorWhere(cursor: DiscoverGamesRecentCursor): Prisma.GameWhereInput {
  if (cursor.releaseDate === null) {
    return { releaseDate: null, id: { gt: cursor.id } };
  }
  return {
    OR: [
      { releaseDate: { lt: cursor.releaseDate } },
      { releaseDate: cursor.releaseDate, id: { gt: cursor.id } },
      { releaseDate: null },
    ],
  };
}

function buildFeaturedCursorWhere(cursor: DiscoverGamesFeaturedCursor): Prisma.GameWhereInput {
  if (cursor.featured) {
    return {
      OR: [{ featured: false }, { featured: true, id: { gt: cursor.id } }],
    };
  }
  return { featured: false, id: { gt: cursor.id } };
}

export async function enrichDiscoverGames(
  db: DatabaseClient,
  games: Game[],
): Promise<DiscoverGameRecord[]> {
  if (games.length === 0) {
    return [];
  }

  const ids = games.map((row) => row.id);
  const [genreLinks, platformLinks, libraryCounts, ratingGroups] = await Promise.all([
    db.gameGenre.findMany({
      where: { gameId: { in: ids } },
      include: { genre: true },
    }),
    db.gamePlatform.findMany({
      where: { gameId: { in: ids } },
      include: { platform: true },
    }),
    db.libraryEntry.groupBy({
      by: ['gameId'],
      where: { gameId: { in: ids } },
      _count: { gameId: true },
    }),
    db.review.groupBy({
      by: ['gameId'],
      where: { gameId: { in: ids }, deletedAt: null },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  const genresByGame = new Map<string, Genre[]>();
  for (const link of genreLinks) {
    const list = genresByGame.get(link.gameId) ?? [];
    list.push(link.genre);
    genresByGame.set(link.gameId, list);
  }

  const platformsByGame = new Map<string, Platform[]>();
  for (const link of platformLinks) {
    const list = platformsByGame.get(link.gameId) ?? [];
    list.push(link.platform);
    platformsByGame.set(link.gameId, list);
  }

  const libraryCountByGame = new Map(libraryCounts.map((row) => [row.gameId, row._count.gameId]));
  const ratingByGame = new Map(
    ratingGroups.map((row) => [
      row.gameId,
      {
        average: row._avg.rating,
        count: row._count.rating,
      },
    ]),
  );

  return games.map((game) => {
    const rating = ratingByGame.get(game.id);
    return {
      game,
      genres: genresByGame.get(game.id) ?? [],
      platforms: platformsByGame.get(game.id) ?? [],
      ratingAverage: rating?.average ?? null,
      ratingCount: rating?.count ?? 0,
      libraryCount: libraryCountByGame.get(game.id) ?? 0,
    };
  });
}
