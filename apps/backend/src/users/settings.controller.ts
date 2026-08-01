import type { SettingsResponse } from '@gmrlog/types';
import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';

import {
  SettingsAccessibilityPatchDto,
  SettingsAppearancePatchDto,
} from './dto/settings-patch.dto';
import { UsersService } from './users.service';

/**
 * S1 §13.12 — settings sections owned by the user domain. Account · privacy ·
 * notification sections arrive with their own domains (D2.3+).
 */
@ApiTags('users')
@ApiBearerAuth('bearer')
@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getSettings(@CurrentUser() identity: RequestIdentity): Promise<SettingsResponse> {
    return this.usersService.getSettings(playerIdOf(identity));
  }

  @Patch('appearance')
  updateAppearance(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: SettingsAppearancePatchDto,
  ): Promise<SettingsResponse> {
    return this.usersService.updateAppearance(playerIdOf(identity), body);
  }

  @Patch('accessibility')
  updateAccessibility(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: SettingsAccessibilityPatchDto,
  ): Promise<SettingsResponse> {
    return this.usersService.updateAccessibility(playerIdOf(identity), body);
  }
}
