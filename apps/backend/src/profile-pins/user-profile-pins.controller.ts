import type { ProfilePinResponse } from '@gmrlog/types';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { OptionalGuestGuard } from '../auth/guards/optional-guest.guard';

import { ProfilePinSubjectUserIdParamDto } from './dto/profile-pin.dto';
import { ProfilePinsService } from './profile-pins.service';

/**
 * 9.5d — `GET /users/{id}/pins`, the public read side of `/me/pins`. Same
 * `OptionalGuestGuard` pattern as `UserAchievementsController`: any viewer
 * (or none) can see which pins — including equipped badges — a profile
 * shows, no ownership required to read.
 */
@ApiTags('profile-pins')
@ApiBearerAuth('bearer')
@Controller('users')
@UseGuards(OptionalGuestGuard)
export class UserProfilePinsController {
  constructor(private readonly pins: ProfilePinsService) {}

  @Get(':id/pins')
  listForUser(@Param() params: ProfilePinSubjectUserIdParamDto): Promise<ProfilePinResponse[]> {
    return this.pins.listForViewer(params.id);
  }
}
