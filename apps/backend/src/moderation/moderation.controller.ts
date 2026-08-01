import type { ReportResponse } from '@gmrlog/types';
import { reportCreateSchema } from '@gmrlog/validators';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import { Idempotent } from '../infrastructure/http/idempotency.interceptor';
import { ApiZodBody } from '../infrastructure/openapi/swagger.decorators';

import { ReportCreateDto } from './dto/moderation.dto';
import { ModerationService } from './moderation.service';

/**
 * S1 §13.13 — Reports resource (player). Transport only.
 * Staff moderation queue routes are deferred (staff auth foundation).
 */
@ApiTags('reports')
@ApiBearerAuth('bearer')
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post()
  @Idempotent()
  @ApiZodBody(reportCreateSchema)
  createReport(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: ReportCreateDto,
  ): Promise<ReportResponse> {
    return this.moderationService.createReport(playerIdOf(identity), body);
  }
}
