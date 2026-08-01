import type { UploadGrantResponse, UploadResponse } from '@gmrlog/types';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import { RateLimitClass } from '../infrastructure/http/rate-limit.interceptor';

import { UploadConfirmDto, UploadGrantDto } from './dto/uploads.dto';
import { UploadsService } from './uploads.service';

/**
 * S1 §13.14 / §16 — Uploads resource. Transport only.
 * Auth: P (player only). No multipart body — grant then confirm.
 */
@ApiTags('uploads')
@ApiBearerAuth('bearer')
@Controller('uploads')
@UseGuards(JwtAuthGuard)
@RateLimitClass('upload')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('grants')
  createGrant(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: UploadGrantDto,
  ): Promise<UploadGrantResponse> {
    return this.uploadsService.createGrant(playerIdOf(identity), body);
  }

  @Post('confirmations')
  confirmUpload(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: UploadConfirmDto,
  ): Promise<UploadResponse> {
    return this.uploadsService.confirmUpload(playerIdOf(identity), body);
  }
}
