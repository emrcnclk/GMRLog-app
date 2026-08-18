import type { AchievementResponse } from '@gmrlog/types';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalGuestGuard } from '../auth/guards/optional-guest.guard';
import { isAuthenticatedIdentity, type RequestIdentity } from '../auth/interfaces/identity';
import { ProfileVisibilityGuard } from '../profile-visibility/profile-visibility.guard';

import { AchievementsService } from './achievements.service';
import { AchievementSubjectUserIdParamDto } from './dto/achievement.dto';

/**
 * D3.21 — `GET /users/{id}/achievements` (no lazy refresh for viewers).
 */
@ApiTags('achievements')
@ApiBearerAuth('bearer')
@Controller('users')
@UseGuards(OptionalGuestGuard)
export class UserAchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get(':id/achievements')
  @UseGuards(ProfileVisibilityGuard)
  listForUser(
    @Param() params: AchievementSubjectUserIdParamDto,
    @CurrentUser() identity: RequestIdentity,
  ): Promise<AchievementResponse[]> {
    const viewerId = isAuthenticatedIdentity(identity) ? identity.userId : null;
    return this.achievementsService.listForViewer(params.id, viewerId, { refresh: false });
  }
}
