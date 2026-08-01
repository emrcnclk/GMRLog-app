import type { ReactionResponse } from '@gmrlog/types';
import { reactionCreateSchema } from '@gmrlog/validators';
import { Body, Controller, Delete, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import { Idempotent } from '../infrastructure/http/idempotency.interceptor';
import { ApiZodBody } from '../infrastructure/openapi/swagger.decorators';

import { ReactionCreateDto, ReactionIdParamDto } from './dto/reaction.dto';
import { ReactionsService } from './reactions.service';

/**
 * S1 §13.7 — Reactions resource. Transport only.
 * Guests may not react; authenticated players only.
 */
@ApiTags('reactions')
@ApiBearerAuth('bearer')
@Controller('reactions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Idempotent()
  @ApiZodBody(reactionCreateSchema)
  createReaction(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: ReactionCreateDto,
  ): Promise<ReactionResponse> {
    return this.reactionsService.createReaction(playerIdOf(identity), body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async deleteReaction(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: ReactionIdParamDto,
  ): Promise<void> {
    await this.reactionsService.deleteReaction(params.id, playerIdOf(identity));
  }
}
