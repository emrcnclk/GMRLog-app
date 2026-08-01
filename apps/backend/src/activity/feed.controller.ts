import type { FeedItemResponse } from '@gmrlog/types';
import { reviewFeedQuerySchema } from '@gmrlog/validators';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import type { PaginatedPayload } from '../infrastructure/http/paginated-payload';
import { createZodDto } from '../infrastructure/http/zod-validation.pipe';

import { ActivityService } from './activity.service';
import { FeedQueryDto } from './dto/activity.dto';

class ReviewFeedQueryDto extends createZodDto(reviewFeedQuerySchema) {}

/**
 * S1 §13.5 — Home feed (+ D3.24 filters · review slices). Transport only.
 */
@ApiTags('feed')
@ApiBearerAuth('bearer')
@Controller('feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  listHomeFeed(
    @CurrentUser() identity: RequestIdentity,
    @Query() query: FeedQueryDto,
  ): Promise<PaginatedPayload<FeedItemResponse>> {
    return this.activityService.listHomeFeed(playerIdOf(identity), query);
  }

  @Get('following')
  listFollowing(
    @CurrentUser() identity: RequestIdentity,
    @Query() query: FeedQueryDto,
  ): Promise<PaginatedPayload<FeedItemResponse>> {
    return this.activityService.listHomeFeed(
      playerIdOf(identity),
      Object.assign({}, query, { filter: 'following' as const }),
    );
  }

  @Get('discover')
  listDiscover(
    @CurrentUser() identity: RequestIdentity,
    @Query() query: FeedQueryDto,
  ): Promise<PaginatedPayload<FeedItemResponse>> {
    return this.activityService.listDiscoverFeed(playerIdOf(identity), query);
  }

  @Get('reviews')
  listReviews(
    @CurrentUser() identity: RequestIdentity,
    @Query() query: ReviewFeedQueryDto,
  ): Promise<PaginatedPayload<FeedItemResponse>> {
    return this.activityService.listReviewFeed(playerIdOf(identity), query);
  }
}
