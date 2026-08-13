import type { PrismaService } from '../../infrastructure/database/prisma.service';
import type { UserSimilaritySignals } from '../scoring/similarity.engine';

/**
 * Loads the raw signals `computeUserSimilarityBreakdown` needs for one user.
 * Extracted out of `SimilarityService` so 5.4's `DnaMatchService` can reuse
 * the identical library/wishlist/completed/review sets it already has to
 * compute the score, instead of re-querying them (`BACKEND_CHANGES.md` §4:
 * "`libraryGameIds` is already loaded to compute the score — reuse the set
 * rather than querying again").
 */
export async function loadUserSimilaritySignals(
  prisma: PrismaService,
  userId: string,
): Promise<UserSimilaritySignals | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.deletedAt !== null) {
    return null;
  }

  const [entries, reviews] = await Promise.all([
    prisma.libraryEntry.findMany({
      where: { userId },
      select: { gameId: true, status: true },
    }),
    prisma.review.findMany({
      where: { authorId: userId, deletedAt: null, visibility: 'public' },
      select: { gameId: true, rating: true },
    }),
  ]);

  const libraryGameIds = new Set(entries.map((row) => row.gameId));
  const wishlistGameIds = new Set(
    entries.filter((row) => row.status === 'wishlist').map((row) => row.gameId),
  );
  const completedGameIds = new Set(
    entries.filter((row) => row.status === 'completed').map((row) => row.gameId),
  );

  const genreLinks =
    libraryGameIds.size === 0
      ? []
      : await prisma.gameGenre.findMany({
          where: { gameId: { in: [...libraryGameIds] } },
          select: { genreId: true },
        });

  const reviewRatings = new Map<string, number>();
  for (const review of reviews) {
    reviewRatings.set(review.gameId, review.rating);
  }

  return {
    libraryGameIds,
    genreIds: new Set(genreLinks.map((row) => row.genreId)),
    wishlistGameIds,
    completedGameIds,
    reviewRatings,
  };
}
