import type { SessionCredentialResponse } from '@gmrlog/types';
import {
  passwordForgotSchema,
  passwordResetSchema,
  sessionCreateSchema,
  sessionRefreshSchema,
  sessionRegisterSchema,
} from '@gmrlog/validators';
import { Body, Controller, Delete, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Idempotent } from '../infrastructure/http/idempotency.interceptor';
import { RateLimitClass } from '../infrastructure/http/rate-limit.interceptor';
import { ApiZodBody } from '../infrastructure/openapi/swagger.decorators';

import { CurrentUser } from './decorators/current-user.decorator';
import { PasswordForgotDto, PasswordResetDto } from './dto/password.dto';
import { SessionCreateDto, SessionRefreshDto, SessionRegisterDto } from './dto/session.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { isAuthenticatedIdentity, type RequestIdentity } from './interfaces/identity';
import { playerIdOf } from './player-id';
import { SessionsService } from './sessions.service';

/**
 * Session surface (S1 §13.1 — `/sessions`). Login · register · refresh · logout ·
 * password recovery.
 */
@ApiTags('sessions')
@ApiBearerAuth('bearer')
@Controller('sessions')
export class AuthController {
  constructor(private readonly sessions: SessionsService) {}

  @Post()
  @Idempotent()
  @ApiZodBody(sessionCreateSchema)
  login(@Body() body: SessionCreateDto): Promise<SessionCredentialResponse> {
    return this.sessions.login(body);
  }

  @Post('register')
  @Idempotent()
  @ApiZodBody(sessionRegisterSchema)
  register(@Body() body: SessionRegisterDto): Promise<SessionCredentialResponse> {
    return this.sessions.register(body);
  }

  @Post('refresh')
  @ApiZodBody(sessionRefreshSchema)
  refresh(@Body() body: SessionRefreshDto): Promise<SessionCredentialResponse> {
    return this.sessions.refresh(body);
  }

  @Post('password/forgot')
  @RateLimitClass('auth')
  @HttpCode(204)
  @ApiZodBody(passwordForgotSchema)
  async forgotPassword(@Body() body: PasswordForgotDto): Promise<void> {
    await this.sessions.forgotPassword(body);
  }

  @Post('password/reset')
  @RateLimitClass('auth')
  @HttpCode(204)
  @ApiZodBody(passwordResetSchema)
  async resetPassword(@Body() body: PasswordResetDto): Promise<void> {
    await this.sessions.resetPassword(body);
  }

  @Delete('current')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async logoutCurrent(@CurrentUser() identity: RequestIdentity): Promise<void> {
    const userId = playerIdOf(identity);
    const sessionId = isAuthenticatedIdentity(identity) ? identity.sessionId : undefined;
    await this.sessions.logoutCurrent(userId, sessionId);
  }
}
