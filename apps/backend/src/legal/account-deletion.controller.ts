import type { AccountDeletionStatusResponse } from '@gmrlog/types';
import { Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import { RateLimitClass } from '../infrastructure/http/rate-limit.interceptor';

import { AccountDeletionService } from './account-deletion.service';

/**
 * 12.6 — the self-serve deletion `privacy-policy.en.ts` §7 has promised since
 * 12.1 and, until now, routed to a human instead. Mounted under `/me`
 * alongside `/me/export` and `/me/legal-consents`, the other two self-serve
 * rights surfaces.
 */
@ApiTags('legal')
@ApiBearerAuth('bearer')
@Controller('me/account/deletion')
@UseGuards(JwtAuthGuard)
export class AccountDeletionController {
  constructor(private readonly accountDeletion: AccountDeletionService) {}

  @Get()
  @ApiOperation({
    summary: 'Whether a deletion request is pending, and when it takes effect',
  })
  @ApiOkResponse({ description: 'Enveloped deletion status' })
  getStatus(@CurrentUser() identity: RequestIdentity): Promise<AccountDeletionStatusResponse> {
    return this.accountDeletion.getStatus(playerIdOf(identity));
  }

  @Post()
  @RateLimitClass('deletion')
  @ApiOperation({
    summary: 'Start the 30-day deletion grace period',
    description:
      'Cancellable any time before it takes effect (DELETE this same route). Once the 30 days pass the account is permanently erased on next login. Limited to once per 24 hours.',
  })
  @ApiOkResponse({ description: 'Enveloped deletion status' })
  requestDeletion(
    @CurrentUser() identity: RequestIdentity,
  ): Promise<AccountDeletionStatusResponse> {
    return this.accountDeletion.requestDeletion(playerIdOf(identity));
  }

  @Delete()
  @ApiOperation({ summary: 'Cancel a pending deletion request' })
  @ApiOkResponse({ description: 'Enveloped deletion status' })
  cancelDeletion(@CurrentUser() identity: RequestIdentity): Promise<AccountDeletionStatusResponse> {
    return this.accountDeletion.cancelDeletion(playerIdOf(identity));
  }
}
