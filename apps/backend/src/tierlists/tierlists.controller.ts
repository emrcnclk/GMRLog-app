import type { TierListResponse } from '@gmrlog/types';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalGuestGuard } from '../auth/guards/optional-guest.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';

import { TierListCreateDto, TierListIdParamDto, TierListPatchDto } from './dto/tierlist.dto';
import { TierListsService } from './tierlists.service';

/**
 * S1 §13.8 — Tier lists resource. Transport only.
 * Board replace lives on TierSlotsController (`PUT .../slots`).
 */
@ApiTags('tier-lists')
@ApiBearerAuth('bearer')
@Controller('tier-lists')
export class TierListsController {
  constructor(private readonly tierListsService: TierListsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  listTierLists(@CurrentUser() identity: RequestIdentity): Promise<TierListResponse[]> {
    return this.tierListsService.listOwn(playerIdOf(identity));
  }

  @Get(':id')
  @UseGuards(OptionalGuestGuard)
  getTierList(
    @Param() params: TierListIdParamDto,
    @CurrentUser() identity: RequestIdentity,
  ): Promise<TierListResponse> {
    return this.tierListsService.getTierList(params.id, identity);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createTierList(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: TierListCreateDto,
  ): Promise<TierListResponse> {
    return this.tierListsService.createTierList(playerIdOf(identity), body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateTierList(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: TierListIdParamDto,
    @Body() body: TierListPatchDto,
  ): Promise<TierListResponse> {
    return this.tierListsService.updateTierList(params.id, playerIdOf(identity), body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async deleteTierList(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: TierListIdParamDto,
  ): Promise<void> {
    await this.tierListsService.deleteTierList(params.id, playerIdOf(identity));
  }
}
