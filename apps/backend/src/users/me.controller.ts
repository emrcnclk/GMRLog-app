import type { UserSelfResponse } from '@gmrlog/types';
import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';

import { MePatchDto } from './dto/me-patch.dto';
import { UsersService } from './users.service';

/** S1 §13.3 — Me / profile self ("P" surfaces). Transport only — no business logic. */
@ApiTags('users')
@ApiBearerAuth('bearer')
@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getMe(@CurrentUser() identity: RequestIdentity): Promise<UserSelfResponse> {
    return this.usersService.getMe(playerIdOf(identity));
  }

  @Patch()
  updateMe(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: MePatchDto,
  ): Promise<UserSelfResponse> {
    return this.usersService.updateMe(playerIdOf(identity), body);
  }
}
