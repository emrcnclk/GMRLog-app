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
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalGuestGuard } from '../auth/guards/optional-guest.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import type { PaginatedPayload } from '../infrastructure/http/paginated-payload';

import { DiscoverService } from './discover.service';
import {
  BecauseYouPlayedQueryDto,
  DiscoverEntityIdParamDto,
  DiscoverGamesListQueryDto,
  DiscoverLimitQueryDto,
  DiscoverListQueryDto,
  DiscoverTrendingQueryDto,
} from './dto/discover.dto';
import type { TrendingEntityHit } from './trending.service';

/**
 * S1 §13.5 + D3.22 + D3.24 — Discover resource. Transport only.
 */
@ApiTags('discover')
@ApiBearerAuth('bearer')
@Controller('discover')
@UseGuards(OptionalGuestGuard)
export class DiscoverController {
  constructor(private readonly discoverService: DiscoverService) {}

  @Get()
  getHub(): DiscoverHubResponse {
    return this.discoverService.getHub();
  }

  @Get('trending')
  listTrending(
    @Query() query: DiscoverTrendingQueryDto,
  ): Promise<PaginatedPayload<GameCardResponse> | PaginatedPayload<TrendingEntityHit>> {
    return this.discoverService.listTrending(query);
  }

  @Get('popular')
  listPopular(
    @Query() query: DiscoverGamesListQueryDto,
  ): Promise<PaginatedPayload<GameCardResponse>> {
    return this.discoverService.listPopular(query);
  }

  @Get('hidden-gems')
  listHiddenGems(
    @Query() query: DiscoverLimitQueryDto,
  ): Promise<PaginatedPayload<GameCardResponse>> {
    return this.discoverService.listHiddenGems(query);
  }

  @Get('recommended')
  listRecommended(
    @CurrentUser() identity: RequestIdentity,
    @Query() query: DiscoverLimitQueryDto,
  ): Promise<RecommendedGameResponse[]> {
    return this.discoverService.listRecommended(identity, query);
  }

  @Get('because-you-played')
  listBecauseYouPlayed(
    @CurrentUser() identity: RequestIdentity,
    @Query() query: BecauseYouPlayedQueryDto,
  ): Promise<BecauseYouPlayedResponse> {
    return this.discoverService.listBecauseYouPlayed(identity, query);
  }

  @Get('collections')
  listCollections(
    @Query() query: DiscoverLimitQueryDto,
  ): Promise<PaginatedPayload<CollectionResponse>> {
    return this.discoverService.listPublicCollections(query);
  }

  @Get('similar-games/:id')
  listSimilarGames(
    @Param() params: DiscoverEntityIdParamDto,
    @Query() query: DiscoverLimitQueryDto,
  ): Promise<SimilarGameResponse[]> {
    return this.discoverService.listSimilarGames(params.id, query);
  }

  @Get('similar-users/:id')
  listSimilarUsers(
    @Param() params: DiscoverEntityIdParamDto,
    @Query() query: DiscoverLimitQueryDto,
  ): Promise<SimilarUserResponse[]> {
    return this.discoverService.listSimilarUsers(params.id, query);
  }

  @Get('games')
  listGames(
    @Query() query: DiscoverGamesListQueryDto,
  ): Promise<PaginatedPayload<GameCardResponse>> {
    return this.discoverService.listGames(query);
  }

  @Get('communities')
  listCommunities(
    @CurrentUser() identity: RequestIdentity,
    @Query() query: DiscoverListQueryDto,
  ): Promise<PaginatedPayload<CommunityResponse>> {
    return this.discoverService.listCommunities(identity, query);
  }

  @Get('events')
  listEvents(@Query() query: DiscoverListQueryDto): Promise<PaginatedPayload<EventResponse>> {
    return this.discoverService.listEvents(query);
  }
}
