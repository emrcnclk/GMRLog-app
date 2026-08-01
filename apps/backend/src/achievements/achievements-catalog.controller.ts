import type { AchievementResponse } from '@gmrlog/types';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalGuestGuard } from '../auth/guards/optional-guest.guard';
import { isAuthenticatedIdentity, type RequestIdentity } from '../auth/interfaces/identity';

import { AchievementsService } from './achievements.service';
import { AchievementIdParamDto } from './dto/achievement.dto';

/**
 * D3.21 — `GET /achievements/{id}` (definition + viewer progress when authenticated).
 */
@ApiTags('achievements')
@ApiBearerAuth('bearer')
@Controller('achievements')
@UseGuards(OptionalGuestGuard)
export class AchievementsCatalogController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get(':id')
  getById(
    @Param() params: AchievementIdParamDto,
    @CurrentUser() identity: RequestIdentity,
  ): Promise<AchievementResponse> {
    const viewerId = isAuthenticatedIdentity(identity) ? identity.userId : null;
    return this.achievementsService.getById(params.id, viewerId);
  }
}
