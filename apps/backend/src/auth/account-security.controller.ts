import type { SignInMethodsResponse } from '@gmrlog/types';
import { setPasswordSchema } from '@gmrlog/validators';
import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { RateLimitClass } from '../infrastructure/http/rate-limit.interceptor';
import { createZodDto } from '../infrastructure/http/zod-validation.pipe';
import { ApiZodBody } from '../infrastructure/openapi/swagger.decorators';

import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { RequestIdentity } from './interfaces/identity';
import { playerIdOf } from './player-id';
import { SessionsService } from './sessions.service';

class SetPasswordDto extends createZodDto(setPasswordSchema) {}

/**
 * Task 4.7 — the account-level half of the Settings connect/disconnect
 * surface (OAUTH.md §5). `GET /auth/sign-in-methods` is the read model the
 * screen renders and the guard checks agree on; `POST /auth/password` is the
 * escape hatch the guard's rejection copy points to ("Set a password or
 * connect another provider first"). Kept separate from `OAuthController`:
 * neither route is provider-scoped the way `/auth/oauth/:provider/*` is.
 */
@ApiTags('auth')
@ApiBearerAuth('bearer')
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AccountSecurityController {
  constructor(private readonly sessions: SessionsService) {}

  @Get('sign-in-methods')
  signInMethods(@CurrentUser() identity: RequestIdentity): Promise<SignInMethodsResponse> {
    return this.sessions.signInMethods(playerIdOf(identity));
  }

  @Post('password')
  @HttpCode(204)
  @RateLimitClass('auth')
  @ApiZodBody(setPasswordSchema)
  async setPassword(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: SetPasswordDto,
  ): Promise<void> {
    await this.sessions.setPassword(playerIdOf(identity), body);
  }
}
