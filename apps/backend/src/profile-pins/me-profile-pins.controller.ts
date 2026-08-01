import type { ProfilePinResponse } from '@gmrlog/types';
import { profilePinUpsertSchema } from '@gmrlog/validators';
import { Body, Controller, Delete, Get, HttpCode, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import { ApiZodBody } from '../infrastructure/openapi/swagger.decorators';

import { ProfilePinDeleteDto, ProfilePinUpsertDto } from './dto/profile-pin.dto';
import { ProfilePinsService } from './profile-pins.service';

/**
 * D3.21 — `GET|PUT|DELETE /me/pins`.
 */
@ApiTags('profile-pins')
@ApiBearerAuth('bearer')
@Controller('me/pins')
@UseGuards(JwtAuthGuard)
export class MeProfilePinsController {
  constructor(private readonly pins: ProfilePinsService) {}

  @Get()
  listMine(@CurrentUser() identity: RequestIdentity): Promise<ProfilePinResponse[]> {
    return this.pins.listMine(playerIdOf(identity));
  }

  @Put()
  @ApiZodBody(profilePinUpsertSchema)
  upsert(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: ProfilePinUpsertDto,
  ): Promise<ProfilePinResponse> {
    return this.pins.upsert(playerIdOf(identity), body);
  }

  @Delete()
  @HttpCode(204)
  async remove(
    @CurrentUser() identity: RequestIdentity,
    @Query() query: ProfilePinDeleteDto,
  ): Promise<void> {
    await this.pins.delete(playerIdOf(identity), query);
  }
}
