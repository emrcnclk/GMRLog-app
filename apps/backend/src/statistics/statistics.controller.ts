import type { StatisticsHistoryResponse, UserStatisticsResponse } from '@gmrlog/types';
import { opaqueIdSchema, statisticsQuerySchema } from '@gmrlog/validators';
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalGuestGuard } from '../auth/guards/optional-guest.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import { createZodDto } from '../infrastructure/http/zod-validation.pipe';

import { StatisticsService } from './statistics.service';

class StatisticsQueryDto extends createZodDto(statisticsQuerySchema) {}
class UserIdParamDto extends createZodDto(z.object({ id: opaqueIdSchema }).strict()) {}

@ApiTags('statistics')
@Controller()
export class StatisticsController {
  constructor(private readonly statistics: StatisticsService) {}

  @Get('me/statistics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  meStats(
    @CurrentUser() identity: RequestIdentity,
    @Query() query: StatisticsQueryDto,
  ): Promise<UserStatisticsResponse> {
    return this.statistics.build(playerIdOf(identity), query.period ?? 'lifetime', {
      refreshArchetypes: true,
    });
  }

  @Get('me/statistics/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  meHistory(
    @CurrentUser() identity: RequestIdentity,
    @Query() query: StatisticsQueryDto,
  ): Promise<StatisticsHistoryResponse> {
    const period =
      query.period === 'lifetime' || query.period === undefined ? 'monthly' : query.period;
    return this.statistics.history(playerIdOf(identity), period);
  }

  @Get('users/:id/statistics')
  @UseGuards(OptionalGuestGuard)
  @ApiBearerAuth('bearer')
  userStats(
    @Param() params: UserIdParamDto,
    @Query() query: StatisticsQueryDto,
  ): Promise<UserStatisticsResponse> {
    return this.statistics.build(params.id, query.period ?? 'lifetime');
  }
}
