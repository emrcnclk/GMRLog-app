import type { FollowResponse } from '@gmrlog/types';
import { followCreateSchema } from '@gmrlog/validators';
import { Body, Controller, Delete, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import { Idempotent } from '../infrastructure/http/idempotency.interceptor';
import { ApiZodBody } from '../infrastructure/openapi/swagger.decorators';

import { FollowCreateDto, FollowUserIdParamDto } from './dto/follow.dto';
import { FollowsService } from './follows.service';

/**
 * S1 §13.4 — Follow mutations. Transport only.
 * Lists live on `/users/{id}/followers|following` and `/me/followers|following`.
 */
@ApiTags('follows')
@ApiBearerAuth('bearer')
@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Idempotent()
  @ApiZodBody(followCreateSchema)
  followUser(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: FollowCreateDto,
  ): Promise<FollowResponse> {
    return this.followsService.followUser(playerIdOf(identity), body);
  }

  @Delete(':userId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async unfollowUser(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: FollowUserIdParamDto,
  ): Promise<void> {
    await this.followsService.unfollowUser(playerIdOf(identity), params.userId);
  }
}
