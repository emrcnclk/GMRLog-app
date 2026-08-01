import type { MuteResponse } from '@gmrlog/types';
import { muteCreateSchema } from '@gmrlog/validators';
import { Body, Controller, Delete, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import { Idempotent } from '../infrastructure/http/idempotency.interceptor';
import { ApiZodBody } from '../infrastructure/openapi/swagger.decorators';

import { MuteCreateDto, MuteUserIdParamDto } from './dto/mute.dto';
import { MutesService } from './mutes.service';

@ApiTags('mutes')
@ApiBearerAuth('bearer')
@Controller()
export class MutesController {
  constructor(private readonly mutesService: MutesService) {}

  @Post('mutes')
  @UseGuards(JwtAuthGuard)
  @Idempotent()
  @ApiZodBody(muteCreateSchema)
  muteUser(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: MuteCreateDto,
  ): Promise<MuteResponse> {
    return this.mutesService.muteUser(playerIdOf(identity), body);
  }

  @Delete('mutes/:userId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async unmuteUser(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: MuteUserIdParamDto,
  ): Promise<void> {
    await this.mutesService.unmuteUser(playerIdOf(identity), params.userId);
  }

  @Post('users/:userId/mute')
  @UseGuards(JwtAuthGuard)
  @Idempotent()
  muteViaUser(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: MuteUserIdParamDto,
  ): Promise<MuteResponse> {
    return this.mutesService.muteUser(playerIdOf(identity), { userId: params.userId });
  }

  @Delete('users/:userId/mute')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async unmuteViaUser(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: MuteUserIdParamDto,
  ): Promise<void> {
    await this.mutesService.unmuteUser(playerIdOf(identity), params.userId);
  }
}
