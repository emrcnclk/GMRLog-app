import type { ActivityItemResponse, FriendshipResponse, OnlineFriendResponse } from '@gmrlog/types';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import type { PaginatedPayload } from '../infrastructure/http/paginated-payload';

import {
  FriendsActivityQueryDto,
  FriendsListQueryDto,
  FriendsSearchQueryDto,
} from './dto/friend.dto';
import { FriendsService } from './friends.service';

/**
 * SOCIAL_API — `/friends` lists, search, online, activity.
 */
@ApiTags('friends')
@ApiBearerAuth('bearer')
@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  listFriends(
    @CurrentUser() identity: RequestIdentity,
    @Query() query: FriendsListQueryDto,
  ): Promise<PaginatedPayload<FriendshipResponse>> {
    return this.friendsService.listFriends(playerIdOf(identity), query);
  }

  @Get('search')
  searchFriends(
    @CurrentUser() identity: RequestIdentity,
    @Query() query: FriendsSearchQueryDto,
  ): Promise<PaginatedPayload<FriendshipResponse>> {
    return this.friendsService.searchFriends(playerIdOf(identity), query);
  }

  @Get('online')
  listOnlineFriends(@CurrentUser() identity: RequestIdentity): Promise<OnlineFriendResponse[]> {
    return this.friendsService.listOnlineFriends(playerIdOf(identity));
  }

  @Get('activity')
  listFriendActivity(
    @CurrentUser() identity: RequestIdentity,
    @Query() query: FriendsActivityQueryDto,
  ): Promise<PaginatedPayload<ActivityItemResponse>> {
    return this.friendsService.listFriendActivity(playerIdOf(identity), query);
  }
}
