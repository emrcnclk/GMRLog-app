import type { LegalConsentStateResponse } from '@gmrlog/types';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';

import { LegalConsentRecordDto } from './dto/legal-consent.dto';
import { LegalLocaleQueryDto } from './dto/legal.dto';
import { LegalConsentService } from './legal-consent.service';

/**
 * 12.4 — a player's own consent record.
 *
 * Unlike `/legal`, this surface is authenticated: it is the player's own
 * evidence, and it is the one place they can see what they agreed to and take
 * it back. Mounted under `/me` alongside the other self routes.
 */
@ApiTags('legal')
@ApiBearerAuth('bearer')
@Controller('me/legal-consents')
@UseGuards(JwtAuthGuard)
export class LegalConsentController {
  constructor(private readonly consents: LegalConsentService) {}

  @Get()
  @ApiOperation({
    summary: "This player's consent record and what is still outstanding",
    description:
      'Returns every decision on record, the required documents whose current version has no decision, and whether every required document is accepted. A declined version is answered, not outstanding.',
  })
  @ApiOkResponse({ description: 'Enveloped consent state' })
  getState(
    @CurrentUser() identity: RequestIdentity,
    @Query() query: LegalLocaleQueryDto,
  ): Promise<LegalConsentStateResponse> {
    return this.consents.getState(playerIdOf(identity), query.locale);
  }

  @Post()
  @ApiOperation({
    summary: 'Record decisions about the current version of one or more documents',
    description:
      'Accepts, declines or withdraws. A decision against a superseded version is refused rather than silently mapped onto the current one.',
  })
  @ApiOkResponse({ description: 'Enveloped consent state after recording' })
  record(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: LegalConsentRecordDto,
  ): Promise<LegalConsentStateResponse> {
    return this.consents.recordDecisions(playerIdOf(identity), body.decisions);
  }
}
