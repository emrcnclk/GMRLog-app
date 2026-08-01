import type { ActivityItemResponse } from '@gmrlog/types';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import type { PaginatedPayload } from '../infrastructure/http/paginated-payload';

import { ActivityService } from './activity.service';
import { ActivityQueryDto } from './dto/activity.dto';

/**
 * S1 §13.11 — Activity center resource. Transport only.
 * Auth: P (player only — no guest access).
 */
@ApiTags('activity')
@ApiBearerAuth('bearer')
@Controller('activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  listActivity(
    @CurrentUser() identity: RequestIdentity,
    @Query() query: ActivityQueryDto,
  ): Promise<PaginatedPayload<ActivityItemResponse>> {
    return this.activityService.listActivity(playerIdOf(identity), query);
  }
}
