import type { UserPublicResponse } from '@gmrlog/types';
import { followSubjectUserIdParamSchema } from '@gmrlog/validators';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { OptionalGuestGuard } from '../auth/guards/optional-guest.guard';
import { createZodDto } from '../infrastructure/http/zod-validation.pipe';
import { ProfileVisibilityGuard } from '../profile-visibility/profile-visibility.guard';

import { UsersService } from './users.service';

class UserPublicParamDto extends createZodDto(followSubjectUserIdParamSchema) {}

/** S1 §13.3 — public profile card ("P|G" soft-gate read), 3b.2d. */
@ApiTags('users')
@ApiBearerAuth('bearer')
@Controller('users')
@UseGuards(OptionalGuestGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @UseGuards(ProfileVisibilityGuard)
  getPublicUser(@Param() params: UserPublicParamDto): Promise<UserPublicResponse> {
    return this.usersService.getPublicUser(params.id);
  }
}
