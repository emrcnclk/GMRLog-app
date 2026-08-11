import type { ProfileThemeResponse } from '@gmrlog/types';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalGuestGuard } from '../auth/guards/optional-guest.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';

import { ProfileThemeUserIdParamDto } from './dto/profile-theme.dto';
import { UsersService } from './users.service';

/**
 * D3.29 — `GET /users/{id}/profile-theme` public projection (docs/07_SOCIAL/
 * PROFILE_CUSTOMIZATION.md "Backend follow-ups"). Visitors never see
 * `profileVisibility` itself, only its enforcement.
 */
@ApiTags('users')
@ApiBearerAuth('bearer')
@Controller('users')
@UseGuards(OptionalGuestGuard)
export class UserProfileThemeController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id/profile-theme')
  getProfileTheme(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: ProfileThemeUserIdParamDto,
  ): Promise<ProfileThemeResponse> {
    return this.usersService.getPublicProfileTheme(params.id, identity);
  }
}
