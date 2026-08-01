import type { UserReputationResponse } from '@gmrlog/types';
import { followSubjectUserIdParamSchema } from '@gmrlog/validators';
import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalGuestGuard } from '../auth/guards/optional-guest.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import { createZodDto } from '../infrastructure/http/zod-validation.pipe';

import { ReputationEngineService } from './reputation-engine.service';
class ReputationSubjectUserIdParamDto extends createZodDto(followSubjectUserIdParamSchema) {}
/**
 * D3.24 — reputation read + recompute (REPUTATION.md).
 * Deterministic badges only — never purchasable / never manual grant.
 */

@ApiTags('reputation')
@ApiBearerAuth('bearer')
@Controller('users')
export class UserReputationController {
  constructor(private readonly reputation: ReputationEngineService) {}
  @Get(':id/reputation')
  @UseGuards(OptionalGuestGuard)
  listForUser(@Param() params: ReputationSubjectUserIdParamDto): Promise<UserReputationResponse[]> {
    return this.reputation.listForUser(params.id);
  }
  /**
   * Self-only recompute (after key actions or explicit refresh).
   * Also safe to call from internal write-path hooks.
   */
  @Post(':id/reputation/recompute')
  @UseGuards(JwtAuthGuard)
  recompute(
    @Param() params: ReputationSubjectUserIdParamDto,
    @CurrentUser() identity: RequestIdentity,
  ): Promise<UserReputationResponse[]> {
    const actorId = playerIdOf(identity);
    if (actorId !== params.id) {
      // Fail closed: only the subject may force a recompute for themselves.
      return this.reputation.listForUser(params.id);
    }
    return this.reputation.recalculate(params.id);
  }
}
