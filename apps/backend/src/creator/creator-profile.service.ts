import type { FollowRepository, Game, GameRepository, UserRepository } from '@gmrlog/database';
import type { CreatorProfileResponse } from '@gmrlog/types';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { toCollectionResponse } from '../collections/mappers/collection.mapper';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { toPostResponse } from '../posts/mappers/post.mapper';

import { CreatorEligibilityService } from './creator-eligibility.service';
import {
  CREATOR_FOLLOW_REPOSITORY,
  CREATOR_GAME_REPOSITORY,
  CREATOR_USER_REPOSITORY,
} from './creator.tokens';

const FEATURED_POST_CAP = 5;
const CREATOR_GUIDE_CAP = 20;
const CREATOR_COLLECTION_CAP = 20;

/**
 * Creator Profile surface (D3.24 / CREATOR_PROFILE.md). Default profile stays
 * player-first; this additively projects featured posts · guides · collections
 * · follower count when the deterministic eligibility check clears.
 */
@Injectable()
export class CreatorProfileService {
  constructor(
    @Inject(CREATOR_USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(CREATOR_GAME_REPOSITORY) private readonly games: GameRepository,
    @Inject(CREATOR_FOLLOW_REPOSITORY) private readonly follows: FollowRepository,
    private readonly prisma: PrismaService,
    private readonly eligibility: CreatorEligibilityService,
  ) {}

  async getProfile(userId: string): Promise<CreatorProfileResponse> {
    const user = await this.users.findById(userId);
    if (user == null || user.deletedAt != null) {
      throw new NotFoundException('User not found');
    }

    const [eligible, featuredPostRows, guideRows, collectionRows, followerCount] =
      await Promise.all([
        this.eligibility.isEligible(userId),
        this.prisma.post.findMany({
          where: { authorId: userId, deletedAt: null, pinnedAt: { not: null } },
          orderBy: [{ pinnedAt: 'desc' }],
          take: FEATURED_POST_CAP,
        }),
        this.prisma.post.findMany({
          where: { authorId: userId, postKind: 'guide', deletedAt: null },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: CREATOR_GUIDE_CAP,
        }),
        this.prisma.collection.findMany({
          where: { ownerId: userId, deletedAt: null, visibility: 'public' },
          include: {
            entries: { orderBy: { position: 'asc' } },
            _count: { select: { followers: true } },
          },
          orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
          take: CREATOR_COLLECTION_CAP,
        }),
        this.prisma.follow.count({ where: { followeeId: userId } }),
      ]);

    if (!eligible) {
      return {
        eligible: false,
        creatorBadge: false,
        followerCount,
        featuredPosts: [],
        guides: [],
        collections: [],
      };
    }

    const gameIds = [
      ...new Set(
        [...featuredPostRows, ...guideRows].flatMap((row) =>
          row.gameId != null ? [row.gameId] : [],
        ),
      ),
    ];
    const gamesById = await this.loadGamesById(gameIds);

    const entryGameIds = [
      ...new Set(collectionRows.flatMap((row) => row.entries.map((entry) => entry.gameId))),
    ];
    const entryGamesById = await this.loadGamesById(entryGameIds);

    if (!user.creatorFeatured) {
      await this.users.update(userId, { creatorFeatured: true });
    }

    return {
      eligible: true,
      creatorBadge: true,
      followerCount,
      featuredPosts: featuredPostRows.map((row) =>
        toPostResponse(row, user, gamesById.get(row.gameId ?? '') ?? undefined),
      ),
      guides: guideRows.map((row) =>
        toPostResponse(row, user, gamesById.get(row.gameId ?? '') ?? undefined),
      ),
      collections: collectionRows.map((row) =>
        toCollectionResponse(row, user, row.entries, entryGamesById, row._count.followers),
      ),
    };
  }

  private async loadGamesById(gameIds: string[]): Promise<Map<string, Game>> {
    if (gameIds.length === 0) {
      return new Map();
    }
    const loaded = await this.games.findManyByIds(gameIds);
    return new Map(loaded.map((game) => [game.id, game]));
  }
}
