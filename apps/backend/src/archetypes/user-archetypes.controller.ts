import type { PlayerArchetypeResponse } from '@gmrlog/types';
import { followSubjectUserIdParamSchema } from '@gmrlog/validators';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { OptionalGuestGuard } from '../auth/guards/optional-guest.guard';
import { createZodDto } from '../infrastructure/http/zod-validation.pipe';
import { ProfileVisibilityGuard } from '../profile-visibility/profile-visibility.guard';

import { ArchetypeEngineService } from './archetype-engine.service';

class ArchetypeSubjectUserIdParamDto extends createZodDto(followSubjectUserIdParamSchema) {}

/**
 * D3.21 — `GET /users/{id}/archetypes` (stored badges; no forced recalc for viewers).
 */
@ApiTags('archetypes')
@ApiBearerAuth('bearer')
@Controller('users')
@UseGuards(OptionalGuestGuard)
export class UserArchetypesController {
  constructor(private readonly archetypes: ArchetypeEngineService) {}

  @Get(':id/archetypes')
  @UseGuards(ProfileVisibilityGuard)
  listForUser(@Param() params: ArchetypeSubjectUserIdParamDto): Promise<PlayerArchetypeResponse[]> {
    return this.archetypes.listForUser(params.id);
  }
}
