import type { ProfileHeroResponse } from '@gmrlog/types';
import { followSubjectUserIdParamSchema } from '@gmrlog/validators';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { OptionalGuestGuard } from '../auth/guards/optional-guest.guard';
import { createZodDto } from '../infrastructure/http/zod-validation.pipe';
import { ProfileVisibilityGuard } from '../profile-visibility/profile-visibility.guard';

import { ProfileHeroService } from './profile-hero.service';

class ProfileHeroSubjectUserIdParamDto extends createZodDto(followSubjectUserIdParamSchema) {}

/**
 * D3.24 — `GET /users/{id}/hero` (PROFILE_V2.md). First glance = player character.
 */
@ApiTags('profiles')
@ApiBearerAuth('bearer')
@Controller('users')
@UseGuards(OptionalGuestGuard)
export class ProfileHeroController {
  constructor(private readonly profileHero: ProfileHeroService) {}

  @Get(':id/hero')
  @UseGuards(ProfileVisibilityGuard)
  getHero(@Param() params: ProfileHeroSubjectUserIdParamDto): Promise<ProfileHeroResponse> {
    return this.profileHero.getHero(params.id);
  }
}
