import type {
  EventResponse,
  FeedItemResponse,
  GameHubCollectionSummaryResponse,
  GameHubCommunitySummaryResponse,
  GameHubPlayerResponse,
  GameHubResponse,
  GameHubTierListSummaryResponse,
  PostResponse,
} from '@gmrlog/types';
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalGuestGuard } from '../auth/guards/optional-guest.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import type { PaginatedPayload } from '../infrastructure/http/paginated-payload';

import { GameHubFeedQueryDto, GameHubIdParamDto } from './dto/game-hub.dto';
import { GameHubService } from './game-hub.service';

/**
 * D3.24 Game Hub (GAME_HUB.md) — composition facade transport only.
 * `/games/:id/reviews` and `/games/:id/posts` already exist (ReviewsModule ·
 * PostsModule) and are reused as-is; only the hub-native routes live here.
 */
@ApiTags('game-hub')
@ApiBearerAuth('bearer')
@Controller('games')
@UseGuards(OptionalGuestGuard)
export class GameHubController {
  constructor(private readonly gameHubService: GameHubService) {}

  @Get(':id/hub')
  getHub(
    @Param() params: GameHubIdParamDto,
    @CurrentUser() identity: RequestIdentity,
  ): Promise<GameHubResponse> {
    return this.gameHubService.getHub(params.id, identity);
  }

  @Get(':id/feed')
  getFeed(
    @Param() params: GameHubIdParamDto,
    @CurrentUser() identity: RequestIdentity,
    @Query() query: GameHubFeedQueryDto,
  ): Promise<PaginatedPayload<FeedItemResponse>> {
    return this.gameHubService.getFeed(params.id, identity, query);
  }

  @Get(':id/screenshots')
  listScreenshots(
    @Param() params: GameHubIdParamDto,
    @CurrentUser() identity: RequestIdentity,
  ): Promise<PostResponse[]> {
    return this.gameHubService.listScreenshots(params.id, identity);
  }

  @Get(':id/guides')
  listGuides(
    @Param() params: GameHubIdParamDto,
    @CurrentUser() identity: RequestIdentity,
  ): Promise<PostResponse[]> {
    return this.gameHubService.listGuides(params.id, identity);
  }

  @Get(':id/collections')
  listCollections(@Param() params: GameHubIdParamDto): Promise<GameHubCollectionSummaryResponse[]> {
    return this.gameHubService.listCollections(params.id);
  }

  @Get(':id/tier-lists')
  listTierLists(@Param() params: GameHubIdParamDto): Promise<GameHubTierListSummaryResponse[]> {
    return this.gameHubService.listTierLists(params.id);
  }

  @Get(':id/events')
  listEvents(
    @Param() params: GameHubIdParamDto,
    @CurrentUser() identity: RequestIdentity,
  ): Promise<EventResponse[]> {
    return this.gameHubService.listEvents(params.id, identity);
  }

  @Get(':id/communities')
  listCommunities(@Param() params: GameHubIdParamDto): Promise<GameHubCommunitySummaryResponse[]> {
    return this.gameHubService.listCommunities(params.id);
  }

  @Get(':id/players')
  listPlayers(
    @Param() params: GameHubIdParamDto,
    @CurrentUser() identity: RequestIdentity,
  ): Promise<GameHubPlayerResponse[]> {
    return this.gameHubService.listPlayers(params.id, identity);
  }
}
