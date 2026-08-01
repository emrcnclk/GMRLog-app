import type { UserPublicResponse } from '@gmrlog/types';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';

import { FollowsService } from './follows.service';

/**
 * S1 §13.3 — `GET /me/followers` and `GET /me/following`.
 */
@ApiTags('follows')
@ApiBearerAuth('bearer')
@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeFollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Get('followers')
  listMyFollowers(@CurrentUser() identity: RequestIdentity): Promise<UserPublicResponse[]> {
    return this.followsService.listFollowers(playerIdOf(identity));
  }

  @Get('following')
  listMyFollowing(@CurrentUser() identity: RequestIdentity): Promise<UserPublicResponse[]> {
    return this.followsService.listFollowing(playerIdOf(identity));
  }
}
