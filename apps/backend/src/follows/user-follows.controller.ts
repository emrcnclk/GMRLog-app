import type { UserPublicResponse } from '@gmrlog/types';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { OptionalGuestGuard } from '../auth/guards/optional-guest.guard';

import { FollowSubjectUserIdParamDto } from './dto/follow.dto';
import { FollowsService } from './follows.service';

/**
 * S1 §13.4 — `GET /users/{id}/followers` and `GET /users/{id}/following`.
 * Soft-gate readable (P|G).
 */
@ApiTags('follows')
@ApiBearerAuth('bearer')
@Controller('users')
@UseGuards(OptionalGuestGuard)
export class UserFollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Get(':id/followers')
  listFollowers(@Param() params: FollowSubjectUserIdParamDto): Promise<UserPublicResponse[]> {
    return this.followsService.listFollowers(params.id);
  }

  @Get(':id/following')
  listFollowing(@Param() params: FollowSubjectUserIdParamDto): Promise<UserPublicResponse[]> {
    return this.followsService.listFollowing(params.id);
  }
}
