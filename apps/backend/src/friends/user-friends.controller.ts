import type {
  FriendRequestResponse,
  PresenceResponse,
  UserPublicResponse,
  UserRelationshipResponse,
} from '@gmrlog/types';
import { friendRequestCreateSchema } from '@gmrlog/validators';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalGuestGuard } from '../auth/guards/optional-guest.guard';
import { isAuthenticatedIdentity, type RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import { Idempotent } from '../infrastructure/http/idempotency.interceptor';
import type { PaginatedPayload } from '../infrastructure/http/paginated-payload';
import { ApiZodBody } from '../infrastructure/openapi/swagger.decorators';

import {
  FriendRequestCreateDto,
  FriendRequestIdParamDto,
  FriendUserIdParamDto,
  FriendsListQueryDto,
} from './dto/friend.dto';
import { FriendsService } from './friends.service';

/**
 * SOCIAL_API — user-scoped friend requests, relationship, mutual, presence.
 * Static `/users/friend-requests*` routes are declared before `:userId` routes.
 */
@ApiTags('friends')
@ApiBearerAuth('bearer')
@Controller('users')
export class UserFriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get('friend-requests')
  @UseGuards(JwtAuthGuard)
  listIncomingRequests(
    @CurrentUser() identity: RequestIdentity,
    @Query() query: FriendsListQueryDto,
  ): Promise<PaginatedPayload<FriendRequestResponse>> {
    return this.friendsService.listIncomingRequests(playerIdOf(identity), query);
  }

  @Post('friend-requests/:requestId/accept')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async acceptFriendRequest(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: FriendRequestIdParamDto,
  ): Promise<void> {
    await this.friendsService.acceptFriendRequest(playerIdOf(identity), params.requestId);
  }

  @Post('friend-requests/:requestId/reject')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async rejectFriendRequest(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: FriendRequestIdParamDto,
  ): Promise<void> {
    await this.friendsService.rejectFriendRequest(playerIdOf(identity), params.requestId);
  }

  @Delete('friend-requests/:requestId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async cancelFriendRequest(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: FriendRequestIdParamDto,
  ): Promise<void> {
    await this.friendsService.cancelFriendRequest(playerIdOf(identity), params.requestId);
  }

  @Post(':userId/friend-request')
  @UseGuards(JwtAuthGuard)
  @Idempotent()
  @ApiZodBody(friendRequestCreateSchema)
  sendFriendRequest(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: FriendUserIdParamDto,
    @Body() body: FriendRequestCreateDto,
  ): Promise<FriendRequestResponse> {
    return this.friendsService.sendFriendRequest(playerIdOf(identity), params.userId, body);
  }

  @Delete(':userId/friend')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async removeFriend(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: FriendUserIdParamDto,
  ): Promise<void> {
    await this.friendsService.removeFriend(playerIdOf(identity), params.userId);
  }

  @Get(':userId/relationship')
  @UseGuards(JwtAuthGuard)
  getRelationship(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: FriendUserIdParamDto,
  ): Promise<UserRelationshipResponse> {
    return this.friendsService.getRelationship(playerIdOf(identity), params.userId);
  }

  @Get(':userId/mutual')
  @UseGuards(JwtAuthGuard)
  listMutualFriends(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: FriendUserIdParamDto,
    @Query() query: FriendsListQueryDto,
  ): Promise<PaginatedPayload<UserPublicResponse>> {
    return this.friendsService.listMutualFriends(playerIdOf(identity), params.userId, query);
  }

  @Get(':userId/friends/mutual')
  @UseGuards(JwtAuthGuard)
  listMutualFriendsAlias(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: FriendUserIdParamDto,
    @Query() query: FriendsListQueryDto,
  ): Promise<PaginatedPayload<UserPublicResponse>> {
    return this.friendsService.listMutualFriends(playerIdOf(identity), params.userId, query);
  }

  @Get(':userId/presence')
  @UseGuards(OptionalGuestGuard)
  getUserPresence(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: FriendUserIdParamDto,
  ): Promise<PresenceResponse> {
    const viewerId = isAuthenticatedIdentity(identity) ? identity.userId : null;
    return this.friendsService.getUserPresence(viewerId, params.userId);
  }
}
