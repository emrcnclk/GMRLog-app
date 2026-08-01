import type { TierListResponse } from '@gmrlog/types';
import { Body, Controller, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';

import { TierListIdParamDto, TierListSlotsPutDto } from './dto/tierlist.dto';
import { TierSlotService } from './tier-slot.service';

/**
 * S1 §13.8 — `PUT /tier-lists/{id}/slots` whole-board replace.
 * No POST/PATCH/DELETE slot routes in S1.
 */
@ApiTags('tier-lists')
@ApiBearerAuth('bearer')
@Controller('tier-lists')
@UseGuards(JwtAuthGuard)
export class TierSlotsController {
  constructor(private readonly slotService: TierSlotService) {}

  @Put(':id/slots')
  replaceSlots(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: TierListIdParamDto,
    @Body() body: TierListSlotsPutDto,
  ): Promise<TierListResponse> {
    return this.slotService.replaceSlots(params.id, playerIdOf(identity), body);
  }
}
