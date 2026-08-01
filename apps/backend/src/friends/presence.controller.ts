import type { PresenceResponse } from '@gmrlog/types';
import { presenceUpdateSchema } from '@gmrlog/validators';
import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import { ApiZodBody } from '../infrastructure/openapi/swagger.decorators';

import { PresenceUpdateDto } from './dto/friend.dto';
import { FriendsService } from './friends.service';

/**
 * SOCIAL_API — `GET|PATCH /presence` (my presence stub).
 */
@ApiTags('friends')
@ApiBearerAuth('bearer')
@Controller('presence')
@UseGuards(JwtAuthGuard)
export class PresenceController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  getMyPresence(@CurrentUser() identity: RequestIdentity): Promise<PresenceResponse> {
    return this.friendsService.getMyPresence(playerIdOf(identity));
  }

  @Patch()
  @ApiZodBody(presenceUpdateSchema)
  updateMyPresence(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: PresenceUpdateDto,
  ): Promise<PresenceResponse> {
    return this.friendsService.updateMyPresence(playerIdOf(identity), body);
  }
}
