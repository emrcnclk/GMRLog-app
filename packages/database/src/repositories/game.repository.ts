import type { Game, Platform, Prisma } from '@prisma/client';

import type { DatabaseClient } from './types';

export interface GameDetailRecord {
  game: Game;
  platforms: Platform[];
  ratingAverage: number | null;
  ratingCount: number;
  libraryCount: number;
}

/** Game catalog persistence (S2 §10.2). Catalog-managed reference entity. */
export interface GameRepository {
  create(data: Prisma.GameCreateInput): Promise<Game>;
  findById(id: string): Promise<Game | null>;
  findDetailById(id: string): Promise<GameDetailRecord | null>;
  findManyByIds(ids: readonly string[]): Promise<Game[]>;
  findBySlug(slug: string): Promise<Game | null>;
  list(params?: { skip?: number; take?: number }): Promise<Game[]>;
  update(id: string, data: Prisma.GameUpdateInput): Promise<Game>;
  delete(id: string): Promise<Game>;
}

export class PrismaGameRepository implements GameRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(data: Prisma.GameCreateInput): Promise<Game> {
    return this.db.game.create({ data });
  }

  findById(id: string): Promise<Game | null> {
    return this.db.game.findUnique({ where: { id } });
  }

  async findDetailById(id: string): Promise<GameDetailRecord | null> {
    const game = await this.db.game.findUnique({ where: { id } });
    if (game == null) {
      return null;
    }

    const [platformLinks, libraryCount, ratingGroup] = await Promise.all([
      this.db.gamePlatform.findMany({
        where: { gameId: id },
        include: { platform: true },
      }),
      this.db.libraryEntry.count({ where: { gameId: id } }),
      this.db.review.groupBy({
        by: ['gameId'],
        where: { gameId: id, deletedAt: null },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    const rating = ratingGroup[0];
    return {
      game,
      platforms: platformLinks.map((link) => link.platform),
      ratingAverage: rating?._avg.rating ?? null,
      ratingCount: rating?._count.rating ?? 0,
      libraryCount,
    };
  }

  findManyByIds(ids: readonly string[]): Promise<Game[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    return this.db.game.findMany({ where: { id: { in: [...ids] } } });
  }

  findBySlug(slug: string): Promise<Game | null> {
    return this.db.game.findUnique({ where: { slug } });
  }

  list(params: { skip?: number; take?: number } = {}): Promise<Game[]> {
    return this.db.game.findMany({
      skip: params.skip,
      take: params.take,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  update(id: string, data: Prisma.GameUpdateInput): Promise<Game> {
    return this.db.game.update({ where: { id }, data });
  }

  delete(id: string): Promise<Game> {
    return this.db.game.delete({ where: { id } });
  }
}
