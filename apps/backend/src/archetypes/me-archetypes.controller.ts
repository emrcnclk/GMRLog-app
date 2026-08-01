import type { PlayerArchetypeResponse } from '@gmrlog/types';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';

import { ArchetypeEngineService } from './archetype-engine.service';

/**
 * D3.21 — `GET /me/archetypes` with lazy recalculation.
 */
@ApiTags('archetypes')
@ApiBearerAuth('bearer')
@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeArchetypesController {
  constructor(private readonly archetypes: ArchetypeEngineService) {}

  @Get('archetypes')
  async listMine(@CurrentUser() identity: RequestIdentity): Promise<PlayerArchetypeResponse[]> {
    const userId = playerIdOf(identity);
    return this.archetypes.recalculate(userId);
  }
}
