import type { ReviewResponse } from '@gmrlog/types';
import { reviewCreateSchema } from '@gmrlog/validators';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalGuestGuard } from '../auth/guards/optional-guest.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import { Idempotent } from '../infrastructure/http/idempotency.interceptor';
import { ApiZodBody } from '../infrastructure/openapi/swagger.decorators';

import { ReviewCreateDto, ReviewIdParamDto, ReviewPatchDto } from './dto/review.dto';
import { ReviewsService } from './reviews.service';

/**
 * S1 §13.7 — Reviews resource. Transport only — no business logic.
 * Comments / reactions endpoints are intentionally omitted (D2.4 forbidden).
 */
@ApiTags('reviews')
@ApiBearerAuth('bearer')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':id')
  @UseGuards(OptionalGuestGuard)
  getReview(
    @Param() params: ReviewIdParamDto,
    @CurrentUser() identity: RequestIdentity,
  ): Promise<ReviewResponse> {
    return this.reviewsService.getReview(params.id, identity);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Idempotent()
  @ApiZodBody(reviewCreateSchema)
  createReview(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: ReviewCreateDto,
  ): Promise<ReviewResponse> {
    return this.reviewsService.createReview(playerIdOf(identity), body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateReview(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: ReviewIdParamDto,
    @Body() body: ReviewPatchDto,
  ): Promise<ReviewResponse> {
    return this.reviewsService.updateReview(params.id, playerIdOf(identity), body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async deleteReview(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: ReviewIdParamDto,
  ): Promise<void> {
    await this.reviewsService.deleteReview(params.id, playerIdOf(identity));
  }
}
