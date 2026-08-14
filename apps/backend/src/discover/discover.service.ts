import type {
  Community,
  CommunityMemberRepository,
  CommunityRepository,
  DiscoverGamesListCursor,
  DiscoverGamesSort,
  DiscoverListCursor,
  DiscoverRepository,
  EventParticipationRepository,
} from '@gmrlog/database';
import type {
  BecauseYouPlayedResponse,
  CollectionResponse,
  CommunityResponse,
  DiscoverHubResponse,
  EventResponse,
  GameCardResponse,
  RecommendedGameResponse,
  SimilarGameResponse,
  SimilarUserResponse,
} from '@gmrlog/types';
import type {
  BecauseYouPlayedQueryInput,
  DiscoverGamesListQueryInput,
  DiscoverListQueryInput,
  DiscoverTrendingQueryInput,
} from '@gmrlog/validators';
import { DISCOVER_LIST_DEFAULT_LIMIT } from '@gmrlog/validators';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { isAuthenticatedIdentity, type RequestIdentity } from '../auth/interfaces/identity';
import { toCollectionResponse } from '../collections/mappers/collection.mapper';
import {
  toCommunityMembershipSummary,
  toCommunityResponse,
} from '../communities/mappers/community.mapper';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { PaginatedPayload } from '../infrastructure/http/paginated-payload';

import { BecauseYouPlayedService } from './because-you-played.service';
import {
  DISCOVER_COMMUNITY_MEMBER_REPOSITORY,
  DISCOVER_COMMUNITY_REPOSITORY,
  DISCOVER_EVENT_PARTICIPATION_REPOSITORY,
  DISCOVER_REPOSITORY,
} from './discover.tokens';
import { DiscoveryScoreService } from './discovery-score.service';
import { toDiscoverHubResponse } from './mappers/discover.mapper';
import { loadEventResponseExtras, toEventResponse } from './mappers/event.mapper';
import { toGameCardResponse } from './mappers/game-card.mapper';
import { RecommendationService } from './recommendation.service';
import { SimilarityService } from './similarity.service';
import { TrendingService, type TrendingEntityHit } from './trending.service';

/**
 * Discover domain service (F6.3 / D2.14 + D3.22 + D3.24).
 * Public projection lists + deterministic discovery ranking (scores · similarity ·
 * recommendations · trending · Because You Played). No AI personalization.
 */
@Injectable()
export class DiscoverService {
  constructor(
    @Inject(DISCOVER_REPOSITORY) private readonly discover: DiscoverRepository,
    @Inject(DISCOVER_COMMUNITY_MEMBER_REPOSITORY)
    private readonly communityMembers: CommunityMemberRepository,
    @Inject(DISCOVER_COMMUNITY_REPOSITORY) private readonly communities: CommunityRepository,
    @Inject(DISCOVER_EVENT_PARTICIPATION_REPOSITORY)
    private readonly eventParticipations: EventParticipationRepository,
    private readonly prisma: PrismaService,
    private readonly discoveryScores: DiscoveryScoreService,
    private readonly similarity: SimilarityService,
    private readonly recommendations: RecommendationService,
    private readonly trending: TrendingService,
    private readonly becauseYouPlayed: BecauseYouPlayedService,
  ) {}

  getHub(): DiscoverHubResponse {
    return toDiscoverHubResponse();
  }

  async listCommunities(
    identity: RequestIdentity,
    query: DiscoverListQueryInput = {},
  ): Promise<PaginatedPayload<CommunityResponse>> {
    return this.paginateCommunities(query, viewerIdOf(identity));
  }

  async listEvents(query: DiscoverListQueryInput = {}): Promise<PaginatedPayload<EventResponse>> {
    const limit = query.limit ?? DISCOVER_LIST_DEFAULT_LIMIT;
    const cursor = query.cursor !== undefined ? decodeCursor(query.cursor) : undefined;

    const rows = await this.discover.listDiscoverEvents({
      limit: limit + 1,
      ...(cursor !== undefined ? { cursor } : {}),
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const next =
      hasMore && last !== undefined
        ? encodeCursor({ orderedAt: last.startsAt, id: last.id })
        : null;

    const extrasByEvent = await loadEventResponseExtras(page, {
      participations: this.eventParticipations,
      communities: this.communities,
    });

    return new PaginatedPayload(
      page.map((event) => toEventResponse(event, null, extrasByEvent.get(event.id))),
      { next },
      hasMore,
      limit,
    );
  }

  async listGames(
    query: DiscoverGamesListQueryInput = {},
  ): Promise<PaginatedPayload<GameCardResponse>> {
    const limit = query.limit ?? DISCOVER_LIST_DEFAULT_LIMIT;
    const sort = resolveDiscoverGamesSort(query.sort);
    const cursor = query.cursor !== undefined ? decodeGamesCursor(query.cursor, sort) : undefined;

    const rows = await this.discover.listDiscoverGames({
      limit: limit + 1,
      sort,
      ...(query.genreId !== undefined ? { genreId: query.genreId } : {}),
      ...(query.platformId !== undefined ? { platformId: query.platformId } : {}),
      ...(query.franchiseId !== undefined ? { franchiseId: query.franchiseId } : {}),
      ...(cursor !== undefined ? { cursor } : {}),
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const next = hasMore && last !== undefined ? encodeGamesCursor(sort, last.game) : null;

    return new PaginatedPayload(page.map(toGameCardResponse), { next }, hasMore, limit);
  }

  async listTrending(
    query: DiscoverTrendingQueryInput = {},
  ): Promise<PaginatedPayload<GameCardResponse> | PaginatedPayload<TrendingEntityHit>> {
    const limit = query.limit ?? DISCOVER_LIST_DEFAULT_LIMIT;
    return this.trending.listTrending({
      limit,
      ...(query.window !== undefined ? { window: query.window } : {}),
      ...(query.entity !== undefined ? { entity: query.entity } : {}),
    });
  }

  async listPopular(
    query: DiscoverGamesListQueryInput = {},
  ): Promise<PaginatedPayload<GameCardResponse>> {
    return this.listGames({ ...query, sort: 'popular' });
  }

  async listHiddenGems(
    query: Pick<DiscoverListQueryInput, 'limit'> = {},
  ): Promise<PaginatedPayload<GameCardResponse>> {
    const limit = query.limit ?? DISCOVER_LIST_DEFAULT_LIMIT;
    return this.discoveryScores.listHiddenGems(limit);
  }

  async listRecommended(
    identity: RequestIdentity,
    query: Pick<DiscoverListQueryInput, 'limit'> = {},
  ): Promise<RecommendedGameResponse[]> {
    const limit = query.limit ?? DISCOVER_LIST_DEFAULT_LIMIT;
    const userId = viewerIdOf(identity);
    return this.recommendations.recommendForUser(userId, limit);
  }

  async listBecauseYouPlayed(
    identity: RequestIdentity,
    query: BecauseYouPlayedQueryInput = {},
  ): Promise<BecauseYouPlayedResponse> {
    return this.becauseYouPlayed.build(identity, query);
  }

  async listSimilarGames(
    gameId: string,
    query: Pick<DiscoverListQueryInput, 'limit'> = {},
  ): Promise<SimilarGameResponse[]> {
    const limit = query.limit ?? DISCOVER_LIST_DEFAULT_LIMIT;
    return this.similarity.getSimilarGames(gameId, limit);
  }

  async listSimilarUsers(
    userId: string,
    query: Pick<DiscoverListQueryInput, 'limit'> = {},
  ): Promise<SimilarUserResponse[]> {
    const limit = query.limit ?? DISCOVER_LIST_DEFAULT_LIMIT;
    return this.similarity.getSimilarUsers(userId, limit);
  }

  async listPublicCollections(
    query: Pick<DiscoverListQueryInput, 'limit'> = {},
  ): Promise<PaginatedPayload<CollectionResponse>> {
    const limit = query.limit ?? DISCOVER_LIST_DEFAULT_LIMIT;
    const collections = await this.prisma.collection.findMany({
      where: { visibility: 'public', deletedAt: null },
      include: {
        owner: true,
        entries: { orderBy: { position: 'asc' } },
        _count: { select: { followers: true } },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
      take: Math.max(limit * 3, 60),
    });

    const ranked = [...collections].sort((a, b) => {
      const byFollowers = b._count.followers - a._count.followers;
      if (byFollowers !== 0) {
        return byFollowers;
      }
      const byUpdated = b.updatedAt.getTime() - a.updatedAt.getTime();
      if (byUpdated !== 0) {
        return byUpdated;
      }
      return a.id.localeCompare(b.id);
    });

    const page = ranked.slice(0, limit);
    const gameIds = [...new Set(page.flatMap((row) => row.entries.map((entry) => entry.gameId)))];
    const games =
      gameIds.length === 0
        ? []
        : await this.prisma.game.findMany({ where: { id: { in: gameIds } } });
    const gamesById = new Map(games.map((game) => [game.id, game]));

    const items = page.map((collection) =>
      toCollectionResponse(
        collection,
        collection.owner,
        collection.entries,
        gamesById,
        collection._count.followers,
      ),
    );

    return new PaginatedPayload(items, { next: null }, false, limit);
  }

  private async paginateCommunities(
    query: DiscoverListQueryInput,
    viewerId: string | null,
  ): Promise<PaginatedPayload<CommunityResponse>> {
    const limit = query.limit ?? DISCOVER_LIST_DEFAULT_LIMIT;
    const cursor = query.cursor !== undefined ? decodeCursor(query.cursor) : undefined;

    const rows = await this.discover.listDiscoverCommunities({
      limit: limit + 1,
      ...(cursor !== undefined ? { cursor } : {}),
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const next =
      hasMore && last !== undefined
        ? encodeCursor({ orderedAt: last.updatedAt, id: last.id })
        : null;

    const projected = await Promise.all(page.map((row) => this.projectCommunity(row, viewerId)));
    return new PaginatedPayload(projected, { next }, hasMore, limit);
  }

  private async projectCommunity(
    community: Community,
    viewerId: string | null,
  ): Promise<CommunityResponse> {
    const memberCount = await this.communityMembers.countByCommunity(community.id);
    let viewerMembership = null;
    if (viewerId !== null) {
      const membership = await this.communityMembers.findByCommunityAndUser(community.id, viewerId);
      if (membership) {
        viewerMembership = toCommunityMembershipSummary(membership);
      }
    }
    return toCommunityResponse(community, memberCount, viewerMembership);
  }
}

function viewerIdOf(identity: RequestIdentity): string | null {
  return isAuthenticatedIdentity(identity) ? identity.userId : null;
}

function encodeCursor(cursor: DiscoverListCursor): string {
  const payload = `${cursor.orderedAt.toISOString()}|${cursor.id}`;
  return Buffer.from(payload, 'utf8').toString('base64url');
}

function decodeCursor(raw: string): DiscoverListCursor {
  let decoded: string;
  try {
    decoded = Buffer.from(raw, 'base64url').toString('utf8');
  } catch {
    throw new BadRequestException('Invalid cursor');
  }
  const separator = decoded.indexOf('|');
  if (separator <= 0) {
    throw new BadRequestException('Invalid cursor');
  }
  const orderedAtRaw = decoded.slice(0, separator);
  const id = decoded.slice(separator + 1);
  const orderedAt = new Date(orderedAtRaw);
  if (Number.isNaN(orderedAt.getTime()) || id.length === 0) {
    throw new BadRequestException('Invalid cursor');
  }
  return { orderedAt, id };
}

function resolveDiscoverGamesSort(sort: DiscoverGamesListQueryInput['sort']): DiscoverGamesSort {
  if (sort === 'popular') {
    return 'popular';
  }
  if (sort === 'recent') {
    return 'recent';
  }
  if (sort === 'featured') {
    return 'featured';
  }
  return 'default';
}

function encodeGamesCursor(
  sort: DiscoverGamesSort,
  game: {
    featured: boolean;
    popularity: number;
    releaseDate: Date | null;
    id: string;
  },
): string {
  let payload: string;
  switch (sort) {
    case 'popular':
      payload = `p|${String(game.popularity)}|${game.id}`;
      break;
    case 'recent':
      payload = `r|${game.releaseDate?.toISOString() ?? ''}|${game.id}`;
      break;
    case 'featured':
      payload = `f|${game.featured ? '1' : '0'}|${game.id}`;
      break;
    default:
      payload = `d|${game.featured ? '1' : '0'}|${String(game.popularity)}|${game.releaseDate?.toISOString() ?? ''}|${game.id}`;
      break;
  }
  return Buffer.from(payload, 'utf8').toString('base64url');
}

function decodeGamesCursor(raw: string, sort: DiscoverGamesSort): DiscoverGamesListCursor {
  let decoded: string;
  try {
    decoded = Buffer.from(raw, 'base64url').toString('utf8');
  } catch {
    throw new BadRequestException('Invalid cursor');
  }
  const parts = decoded.split('|');
  const mode = parts[0];
  if (mode === 'p' && sort === 'popular' && parts.length === 3) {
    const popularity = Number(parts[1]);
    const id = parts[2] ?? '';
    if (!Number.isInteger(popularity) || id.length === 0) {
      throw new BadRequestException('Invalid cursor');
    }
    return { mode: 'popular', popularity, id };
  }
  if (mode === 'r' && sort === 'recent' && parts.length === 3) {
    const id = parts[2] ?? '';
    if (id.length === 0) {
      throw new BadRequestException('Invalid cursor');
    }
    const releaseDateRaw = parts[1] ?? '';
    const releaseDate = releaseDateRaw.length === 0 ? null : new Date(releaseDateRaw);
    if (releaseDate !== null && Number.isNaN(releaseDate.getTime())) {
      throw new BadRequestException('Invalid cursor');
    }
    return { mode: 'recent', releaseDate, id };
  }
  if (mode === 'f' && sort === 'featured' && parts.length === 3) {
    const featured = parts[1] === '1';
    const id = parts[2] ?? '';
    if (id.length === 0) {
      throw new BadRequestException('Invalid cursor');
    }
    return { mode: 'featured', featured, id };
  }
  if (mode === 'd' && sort === 'default' && parts.length === 5) {
    const featured = parts[1] === '1';
    const popularity = Number(parts[2]);
    const id = parts[4] ?? '';
    if (!Number.isInteger(popularity) || id.length === 0) {
      throw new BadRequestException('Invalid cursor');
    }
    const releaseDateRaw = parts[3] ?? '';
    const releaseDate = releaseDateRaw.length === 0 ? null : new Date(releaseDateRaw);
    if (releaseDate !== null && Number.isNaN(releaseDate.getTime())) {
      throw new BadRequestException('Invalid cursor');
    }
    return { mode: 'default', featured, popularity, releaseDate, id };
  }
  throw new BadRequestException('Invalid cursor');
}
