import type { DiscoverGameRecord } from '@gmrlog/database';
import type { Game, Genre, Platform } from '@gmrlog/database';

import type { PrismaService } from '../../infrastructure/database/prisma.service';

/**
 * Load DiscoverGameRecord rows for arbitrary game IDs (order preserved).
 * Reuses the same enrichment shape as DiscoverRepository.listDiscoverGames.
 */
export async function loadDiscoverGameRecords(
  prisma: PrismaService,
  gameIds: readonly string[],
): Promise<DiscoverGameRecord[]> {
  if (gameIds.length === 0) {
    return [];
  }

  const games = await prisma.game.findMany({
    where: { id: { in: [...gameIds] } },
  });
  const byId = new Map(games.map((game) => [game.id, game]));
  const ordered = gameIds
    .map((id) => byId.get(id))
    .filter((game): game is Game => game !== undefined);

  if (ordered.length === 0) {
    return [];
  }

  const ids = ordered.map((game) => game.id);
  const [genreLinks, platformLinks, libraryCounts, ratingGroups] = await Promise.all([
    prisma.gameGenre.findMany({
      where: { gameId: { in: ids } },
      include: { genre: true },
    }),
    prisma.gamePlatform.findMany({
      where: { gameId: { in: ids } },
      include: { platform: true },
    }),
    prisma.libraryEntry.groupBy({
      by: ['gameId'],
      where: { gameId: { in: ids } },
      _count: { gameId: true },
    }),
    prisma.review.groupBy({
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

  return ordered.map((game) => {
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
