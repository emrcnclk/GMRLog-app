import type { DnaMatchResponse } from '@gmrlog/types';
import { followSubjectUserIdParamSchema } from '@gmrlog/validators';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import { createZodDto } from '../infrastructure/http/zod-validation.pipe';

import { DnaMatchService } from './dna-match.service';

class DnaMatchSubjectUserIdParamDto extends createZodDto(followSubjectUserIdParamSchema) {}

/**
 * 5.4 — `GET /users/{id}/dna-match` (`BACKEND_CHANGES.md` §4). Compares the
 * caller against the subject, so it always needs a real viewer.
 */
@ApiTags('discover')
@ApiBearerAuth('bearer')
@Controller('users')
export class DnaMatchController {
  constructor(private readonly dnaMatch: DnaMatchService) {}

  @Get(':id/dna-match')
  @UseGuards(JwtAuthGuard)
  getDnaMatch(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: DnaMatchSubjectUserIdParamDto,
  ): Promise<DnaMatchResponse> {
    return this.dnaMatch.getDnaMatch(playerIdOf(identity), params.id);
  }
}
