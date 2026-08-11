import type { ProfileThemeResponse } from '@gmrlog/types';
import { profileThemePatchSchema } from '@gmrlog/validators';
import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import { ApiZodBody } from '../infrastructure/openapi/swagger.decorators';

import { ProfileThemePatchDto } from './dto/profile-theme.dto';
import { UsersService } from './users.service';

/**
 * D3.29 — `GET|PATCH /me/profile-theme` (docs/07_SOCIAL/PROFILE_CUSTOMIZATION.md
 * "Backend follow-ups"). Promotes the previously device-local profile
 * customization to server sync.
 */
@ApiTags('users')
@ApiBearerAuth('bearer')
@Controller('me/profile-theme')
@UseGuards(JwtAuthGuard)
export class MeProfileThemeController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getProfileTheme(@CurrentUser() identity: RequestIdentity): Promise<ProfileThemeResponse> {
    return this.usersService.getProfileTheme(playerIdOf(identity));
  }

  @Patch()
  @ApiZodBody(profileThemePatchSchema)
  updateProfileTheme(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: ProfileThemePatchDto,
  ): Promise<ProfileThemeResponse> {
    return this.usersService.updateProfileTheme(playerIdOf(identity), body);
  }
}
