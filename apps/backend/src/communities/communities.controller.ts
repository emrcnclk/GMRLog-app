import type {
  ActivityItemResponse,
  CommunityLeaderboardResponse,
  CommunityMemberBadgeResponse,
  CommunityMemberResponse,
  CommunityPinResponse,
  CommunityResponse,
  CommunityWikiPageResponse,
  EventResponse,
  FeedItemResponse,
} from '@gmrlog/types';
import { communityPinCreateSchema, communityWikiUpsertSchema } from '@gmrlog/validators';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ActivityQueryDto } from '../activity/dto/activity.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalGuestGuard } from '../auth/guards/optional-guest.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import type { PaginatedPayload } from '../infrastructure/http/paginated-payload';
import { ApiZodBody } from '../infrastructure/openapi/swagger.decorators';

import { CommunitiesService } from './communities.service';
import {
  CommunityCreateDto,
  CommunityEventsQueryDto,
  CommunityFeedQueryDto,
  CommunityIdParamDto,
  CommunityLeaderboardQueryDto,
  CommunityListQueryDto,
  CommunityMemberRolePatchDto,
  CommunityMemberUserParamDto,
  CommunityPatchDto,
  CommunityPinCreateDto,
  CommunityPinIdParamDto,
  CommunityWikiPageParamDto,
  CommunityWikiUpsertDto,
} from './dto/community.dto';

/**
 * S1 §13.10 + S1.1 + D3.24 Communities 2.0 — transport only.
 */
@ApiTags('communities')
@ApiBearerAuth('bearer')
@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Get()
  @UseGuards(OptionalGuestGuard)
  listCommunities(
    @CurrentUser() identity: RequestIdentity,
    @Query() query: CommunityListQueryDto,
  ): Promise<PaginatedPayload<CommunityResponse>> {
    return this.communitiesService.listCommunities(identity, query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createCommunity(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: CommunityCreateDto,
  ): Promise<CommunityResponse> {
    return this.communitiesService.createCommunity(playerIdOf(identity), body);
  }

  @Get(':id/members')
  @UseGuards(OptionalGuestGuard)
  listMembers(
    @Param() params: CommunityIdParamDto,
    @CurrentUser() identity: RequestIdentity,
  ): Promise<CommunityMemberResponse[]> {
    return this.communitiesService.listMembers(params.id, identity);
  }

  @Get(':id/leaderboard')
  @UseGuards(OptionalGuestGuard)
  getLeaderboard(
    @Param() params: CommunityIdParamDto,
    @CurrentUser() identity: RequestIdentity,
    @Query() query: CommunityLeaderboardQueryDto,
  ): Promise<CommunityLeaderboardResponse> {
    return this.communitiesService.getLeaderboard(params.id, identity, query);
  }

  @Get(':id/badges')
  @UseGuards(OptionalGuestGuard)
  listBadges(
    @Param() params: CommunityIdParamDto,
    @CurrentUser() identity: RequestIdentity,
  ): Promise<CommunityMemberBadgeResponse[]> {
    return this.communitiesService.listBadges(params.id, identity);
  }

  @Patch(':id/members/:userId')
  @UseGuards(JwtAuthGuard)
  patchMemberRole(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: CommunityMemberUserParamDto,
    @Body() body: CommunityMemberRolePatchDto,
  ): Promise<CommunityMemberResponse> {
    return this.communitiesService.updateMemberRole(
      params.id,
      playerIdOf(identity),
      params.userId,
      body,
    );
  }

  @Get(':id/feed')
  @UseGuards(OptionalGuestGuard)
  listFeed(
    @Param() params: CommunityIdParamDto,
    @CurrentUser() identity: RequestIdentity,
    @Query() query: CommunityFeedQueryDto,
  ): Promise<PaginatedPayload<FeedItemResponse>> {
    return this.communitiesService.listFeed(params.id, identity, query);
  }

  @Get(':id/activity')
  @UseGuards(OptionalGuestGuard)
  listActivity(
    @Param() params: CommunityIdParamDto,
    @CurrentUser() identity: RequestIdentity,
    @Query() query: ActivityQueryDto,
  ): Promise<PaginatedPayload<ActivityItemResponse>> {
    return this.communitiesService.listActivity(params.id, identity, query);
  }

  @Get(':id/events')
  @UseGuards(OptionalGuestGuard)
  listEvents(
    @Param() params: CommunityIdParamDto,
    @CurrentUser() identity: RequestIdentity,
    @Query() query: CommunityEventsQueryDto,
  ): Promise<PaginatedPayload<EventResponse>> {
    return this.communitiesService.listEvents(params.id, identity, query);
  }

  @Get(':id/wiki')
  @UseGuards(OptionalGuestGuard)
  listWiki(
    @Param() params: CommunityIdParamDto,
    @CurrentUser() identity: RequestIdentity,
  ): Promise<CommunityWikiPageResponse[]> {
    return this.communitiesService.listWikiPages(params.id, identity);
  }

  @Get(':id/wiki/:slug')
  @UseGuards(OptionalGuestGuard)
  getWikiPage(
    @Param() params: CommunityWikiPageParamDto,
    @CurrentUser() identity: RequestIdentity,
  ): Promise<CommunityWikiPageResponse> {
    return this.communitiesService.getWikiPage(params.id, params.slug, identity);
  }

  @Put(':id/wiki/:slug')
  @UseGuards(JwtAuthGuard)
  @ApiZodBody(communityWikiUpsertSchema)
  upsertWikiPage(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: CommunityWikiPageParamDto,
    @Body() body: CommunityWikiUpsertDto,
  ): Promise<CommunityWikiPageResponse> {
    return this.communitiesService.upsertWikiPage(
      params.id,
      params.slug,
      playerIdOf(identity),
      body,
    );
  }

  @Get(':id/pins')
  @UseGuards(OptionalGuestGuard)
  listPins(
    @Param() params: CommunityIdParamDto,
    @CurrentUser() identity: RequestIdentity,
  ): Promise<CommunityPinResponse[]> {
    return this.communitiesService.listPins(params.id, identity);
  }

  @Post(':id/pins')
  @UseGuards(JwtAuthGuard)
  @ApiZodBody(communityPinCreateSchema)
  createPin(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: CommunityIdParamDto,
    @Body() body: CommunityPinCreateDto,
  ): Promise<CommunityPinResponse> {
    return this.communitiesService.createPin(params.id, playerIdOf(identity), body);
  }

  @Delete(':id/pins/:pinId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async deletePin(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: CommunityPinIdParamDto,
  ): Promise<void> {
    await this.communitiesService.deletePin(params.id, params.pinId, playerIdOf(identity));
  }

  @Post(':id/membership')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async joinCommunity(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: CommunityIdParamDto,
  ): Promise<void> {
    await this.communitiesService.joinCommunity(params.id, playerIdOf(identity));
  }

  @Delete(':id/membership')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async leaveCommunity(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: CommunityIdParamDto,
  ): Promise<void> {
    await this.communitiesService.leaveCommunity(params.id, playerIdOf(identity));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateCommunity(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: CommunityIdParamDto,
    @Body() body: CommunityPatchDto,
  ): Promise<CommunityResponse> {
    return this.communitiesService.updateCommunity(params.id, playerIdOf(identity), body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async deleteCommunity(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: CommunityIdParamDto,
  ): Promise<void> {
    await this.communitiesService.deleteCommunity(params.id, playerIdOf(identity));
  }

  @Get(':id')
  @UseGuards(OptionalGuestGuard)
  getCommunity(
    @Param() params: CommunityIdParamDto,
    @CurrentUser() identity: RequestIdentity,
  ): Promise<CommunityResponse> {
    return this.communitiesService.getCommunity(params.id, identity);
  }
}
