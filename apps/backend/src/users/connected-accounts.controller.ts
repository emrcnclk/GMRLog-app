import type { ConnectedAccountResponse } from '@gmrlog/types';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';

import { UsersService } from './users.service';

/**
 * S1 §13.12 — connected accounts, read only in D2.2. Linking, unlinking and
 * OAuth intents belong to the account-links/integration domain (D2.3+).
 */
@ApiTags('users')
@ApiBearerAuth('bearer')
@Controller('connected-accounts')
@UseGuards(JwtAuthGuard)
export class ConnectedAccountsController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  listConnectedAccounts(
    @CurrentUser() identity: RequestIdentity,
  ): Promise<ConnectedAccountResponse[]> {
    return this.usersService.listConnectedAccounts(playerIdOf(identity));
  }
}
