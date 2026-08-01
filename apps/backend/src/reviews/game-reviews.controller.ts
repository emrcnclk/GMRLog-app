import type { ReviewResponse } from '@gmrlog/types';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalGuestGuard } from '../auth/guards/optional-guest.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';

import { GameIdParamDto } from './dto/review.dto';
import { ReviewsService } from './reviews.service';

/**
 * S1 §13.6 — `GET /games/{id}/reviews`. Soft-gate readable; visibility filtering
 * lives in the Review domain service.
 */
@ApiTags('reviews')
@ApiBearerAuth('bearer')
@Controller('games')
@UseGuards(OptionalGuestGuard)
export class GameReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':id/reviews')
  listGameReviews(
    @Param() params: GameIdParamDto,
    @CurrentUser() identity: RequestIdentity,
  ): Promise<ReviewResponse[]> {
    return this.reviewsService.listGameReviews(params.id, identity);
  }
}
