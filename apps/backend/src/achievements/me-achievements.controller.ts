import type { AchievementResponse } from '@gmrlog/types';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';

import { AchievementsService } from './achievements.service';

/**
 * D3.21 — `GET /me/achievements`.
 * Lazy refresh: recalculates progress before returning the owner's list.
 */
@ApiTags('achievements')
@ApiBearerAuth('bearer')
@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeAchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get('achievements')
  listMine(@CurrentUser() identity: RequestIdentity): Promise<AchievementResponse[]> {
    const userId = playerIdOf(identity);
    return this.achievementsService.listForViewer(userId, userId, { refresh: true });
  }
}
