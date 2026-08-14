import type { CommunityRepository, EventParticipationRepository } from '@gmrlog/database';
import type {
  BecauseYouPlayedResponse,
  CollectionResponse,
  CommunityResponse,
  EventResponse,
  GameCardResponse,
  PostResponse,
  ReviewResponse,
} from '@gmrlog/types';
import type { BecauseYouPlayedQueryInput } from '@gmrlog/validators';
import { DISCOVER_LIST_DEFAULT_LIMIT } from '@gmrlog/validators';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { isAuthenticatedIdentity, type RequestIdentity } from '../auth/interfaces/identity';
import { toCollectionResponse } from '../collections/mappers/collection.mapper';
import {
  toCommunityMembershipSummary,
  toCommunityResponse,
} from '../communities/mappers/community.mapper';
import { loadEventResponseExtras, toEventResponse } from '../events/mappers/event.mapper';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { toPostResponse } from '../posts/mappers/post.mapper';
import { toReviewResponse } from '../reviews/mappers/review.mapper';

import {
  DISCOVER_COMMUNITY_REPOSITORY,
  DISCOVER_EVENT_PARTICIPATION_REPOSITORY,
} from './discover.tokens';
import { toGameCardResponse } from './mappers/game-card.mapper';
import { loadDiscoverGameRecords } from './mappers/load-discover-games';
import { RecommendationService } from './recommendation.service';

const REASON_KEY = 'because_you_played' as const;
const SECTION_LIMIT = 8;

/**
 * Because You Played discovery module (D3.24 / BECAUSE_YOU_PLAYED.md).
 * Deterministic pipeline: library seed → recommendation_rules overlap →
 * related reviews · collections · communities · events · guides. No AI.
 */
@Injectable()
export class BecauseYouPlayedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recommendations: RecommendationService,
    @Inject(DISCOVER_COMMUNITY_REPOSITORY) private readonly communities: CommunityRepository,
    @Inject(DISCOVER_EVENT_PARTICIPATION_REPOSITORY)
    private readonly eventParticipations: EventParticipationRepository,
  ) {}

  async build(
    identity: RequestIdentity,
    query: BecauseYouPlayedQueryInput = {},
  ): Promise<BecauseYouPlayedResponse> {
    const viewerId = isAuthenticatedIdentity(identity) ? identity.userId : null;
    if (viewerId === null) {
      throw new BadRequestException('Authentication required for Because You Played');
    }

    const limit = query.limit ?? DISCOVER_LIST_DEFAULT_LIMIT;
    const seed = await this.resolveSeed(viewerId, query.seedGameId);
    if (seed === null) {
      return emptyModule();
    }

    const offset = query.cursor !== undefined ? decodeOffsetCursor(query.cursor) : 0;

    const recommendedRows = await this.recommendations.recommendForUser(
      viewerId,
      limit + offset + 1,
    );
    const relatedGameIds = recommendedRows
      .filter((row) => row.game.id !== seed.id)
      .map((row) => row.game.id);
    const pageIds = relatedGameIds.slice(offset, offset + limit);
    const hasMore = relatedGameIds.length > offset + limit;

    const targetIds = [seed.id, ...pageIds];

    const [recommended, relatedReviews, collections, communities, events, guides] =
      await Promise.all([
        this.loadRecommendedCards(pageIds, recommendedRows),
        this.loadRelatedReviews(targetIds),
        this.loadCollections(targetIds),
        this.loadCommunities(seed, viewerId),
        this.loadEvents(seed.id),
        this.loadGuides(targetIds),
      ]);

    return {
      sourceGameId: seed.id,
      sourceGameTitle: seed.title,
      reasonKey: REASON_KEY,
      recommended,
      relatedReviews,
      collections,
      communities,
      events,
      guides,
      nextCursor: hasMore ? encodeOffsetCursor(offset + limit) : null,
    };
  }

  private async resolveSeed(
    userId: string,
    seedGameId: string | undefined,
  ): Promise<{ id: string; title: string } | null> {
    if (seedGameId !== undefined) {
      const inLibrary = await this.prisma.libraryEntry.findUnique({
        where: { userId_gameId: { userId, gameId: seedGameId } },
        include: { game: { select: { id: true, title: true } } },
      });
      if (inLibrary?.game != null) {
        return inLibrary.game;
      }
      const game = await this.prisma.game.findUnique({
        where: { id: seedGameId },
        select: { id: true, title: true },
      });
      return game;
    }

    const played = await this.prisma.libraryEntry.findFirst({
      where: {
        userId,
        status: { in: ['playing', 'completed', 'owned', 'dropped'] },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      include: { game: { select: { id: true, title: true } } },
    });
    return played?.game ?? null;
  }

  private async loadRecommendedCards(
    pageIds: readonly string[],
    recommendedRows: Awaited<ReturnType<RecommendationService['recommendForUser']>>,
  ): Promise<GameCardResponse[]> {
    const byId = new Map(recommendedRows.map((row) => [row.game.id, row.game]));
    const missing = pageIds.filter((id) => !byId.has(id));
    if (missing.length > 0) {
      const records = await loadDiscoverGameRecords(this.prisma, [...missing]);
      for (const record of records) {
        byId.set(record.game.id, toGameCardResponse(record));
      }
    }
    return pageIds.flatMap((id) => {
      const card = byId.get(id);
      return card !== undefined ? [card] : [];
    });
  }

  private async loadRelatedReviews(gameIds: readonly string[]): Promise<ReviewResponse[]> {
    if (gameIds.length === 0) {
      return [];
    }
    const rows = await this.prisma.review.findMany({
      where: { gameId: { in: [...gameIds] }, deletedAt: null, visibility: 'public' },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: SECTION_LIMIT,
      include: { author: true },
    });
    return rows.map((row) => toReviewResponse(row, row.author));
  }

  private async loadCollections(gameIds: readonly string[]): Promise<CollectionResponse[]> {
    if (gameIds.length === 0) {
      return [];
    }
    const entryRows = await this.prisma.collectionEntry.findMany({
      where: { gameId: { in: [...gameIds] } },
      select: { collectionId: true },
      take: 40,
    });
    const collectionIds = [...new Set(entryRows.map((row) => row.collectionId))].slice(
      0,
      SECTION_LIMIT,
    );
    if (collectionIds.length === 0) {
      return [];
    }
    const collections = await this.prisma.collection.findMany({
      where: { id: { in: collectionIds }, deletedAt: null, visibility: 'public' },
      include: { owner: true },
    });
    return collections.map((collection) =>
      toCollectionResponse(collection, collection.owner, [], new Map(), 0),
    );
  }

  private async loadCommunities(
    seed: { id: string; title: string },
    viewerId: string,
  ): Promise<CommunityResponse[]> {
    const tagCandidates = [seed.id, seed.title.toLowerCase()];
    const communities = await this.prisma.community.findMany({
      where: {
        deletedAt: null,
        visibility: 'public',
        OR: [
          { tags: { hasSome: tagCandidates } },
          { name: { contains: seed.title, mode: 'insensitive' } },
        ],
      },
      take: SECTION_LIMIT,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    const results: CommunityResponse[] = [];
    for (const community of communities) {
      const [memberCount, membership] = await Promise.all([
        this.prisma.communityMember.count({ where: { communityId: community.id } }),
        this.prisma.communityMember.findUnique({
          where: { communityId_userId: { communityId: community.id, userId: viewerId } },
        }),
      ]);
      results.push(
        toCommunityResponse(
          community,
          memberCount,
          membership !== null ? toCommunityMembershipSummary(membership) : null,
        ),
      );
    }
    return results;
  }

  private async loadEvents(seedGameId: string): Promise<EventResponse[]> {
    const events = await this.prisma.event.findMany({
      where: { deletedAt: null, gameId: seedGameId },
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      take: SECTION_LIMIT,
    });
    const extrasByEvent = await loadEventResponseExtras(events, {
      participations: this.eventParticipations,
      communities: this.communities,
    });
    return events.map((event) => toEventResponse(event, null, extrasByEvent.get(event.id)));
  }

  private async loadGuides(gameIds: readonly string[]): Promise<PostResponse[]> {
    if (gameIds.length === 0) {
      return [];
    }
    const posts = await this.prisma.post.findMany({
      where: {
        deletedAt: null,
        visibility: 'public',
        postKind: 'guide',
        gameId: { in: [...gameIds] },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: SECTION_LIMIT,
      include: { author: true },
    });
    return posts.map((post) => toPostResponse(post, post.author));
  }
}

function emptyModule(): BecauseYouPlayedResponse {
  return {
    sourceGameId: '',
    sourceGameTitle: '',
    reasonKey: REASON_KEY,
    recommended: [],
    relatedReviews: [],
    collections: [],
    communities: [],
    events: [],
    guides: [],
    nextCursor: null,
  };
}

function encodeOffsetCursor(offset: number): string {
  return Buffer.from(String(offset), 'utf8').toString('base64url');
}

function decodeOffsetCursor(raw: string): number {
  try {
    const decoded = Buffer.from(raw, 'base64url').toString('utf8');
    const offset = Number(decoded);
    if (!Number.isInteger(offset) || offset < 0) {
      throw new Error('bad');
    }
    return offset;
  } catch {
    throw new BadRequestException('Invalid cursor');
  }
}
