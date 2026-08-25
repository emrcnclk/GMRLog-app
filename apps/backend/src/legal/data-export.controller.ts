import type { DataExportResponse } from '@gmrlog/types';
import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import { RateLimitClass } from '../infrastructure/http/rate-limit.interceptor';

import { DataExportService } from './data-export.service';

/**
 * 12.5 — the self-serve export `privacy-policy.en.ts` §7 has promised since
 * 12.1 and, until now, routed to a human instead. `RateLimitClass('export')`
 * pins the class RATE_LIMITING.md already specifies (1 per 24h, user scope)
 * rather than falling through `resolveClass`'s method-based default, which
 * would land this on `write`'s 180/minute — far too loose for a query that
 * fans out across a player's entire account.
 */
@ApiTags('legal')
@ApiBearerAuth('bearer')
@Controller('me')
@UseGuards(JwtAuthGuard)
export class DataExportController {
  constructor(private readonly dataExport: DataExportService) {}

  @Post('export')
  @RateLimitClass('export')
  @ApiOperation({
    summary: "This player's data, in a portable machine-readable format",
    description:
      'GDPR Art. 15/20, KVKK Art. 11. Covers the categories the Privacy Policy names: account, gaming activity, social, technical, optional. Limited to once per 24 hours.',
  })
  @ApiOkResponse({ description: 'Enveloped data export' })
  requestExport(@CurrentUser() identity: RequestIdentity): Promise<DataExportResponse> {
    return this.dataExport.buildExport(playerIdOf(identity));
  }
}
