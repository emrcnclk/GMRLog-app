import type { CreatorProfileResponse } from '@gmrlog/types';
import { followSubjectUserIdParamSchema } from '@gmrlog/validators';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { OptionalGuestGuard } from '../auth/guards/optional-guest.guard';
import { createZodDto } from '../infrastructure/http/zod-validation.pipe';

import { CreatorProfileService } from './creator-profile.service';

class CreatorSubjectUserIdParamDto extends createZodDto(followSubjectUserIdParamSchema) {}

/**
 * D3.24 — `GET /users/{id}/creator` (CREATOR_PROFILE.md additive surface).
 */
@ApiTags('creator')
@ApiBearerAuth('bearer')
@Controller('users')
@UseGuards(OptionalGuestGuard)
export class CreatorProfileController {
  constructor(private readonly creator: CreatorProfileService) {}

  @Get(':id/creator')
  getProfile(@Param() params: CreatorSubjectUserIdParamDto): Promise<CreatorProfileResponse> {
    return this.creator.getProfile(params.id);
  }
}
