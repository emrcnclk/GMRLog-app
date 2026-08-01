import type { CommentResponse } from '@gmrlog/types';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { OptionalGuestGuard } from '../auth/guards/optional-guest.guard';

import { CommentsService } from './comments.service';
import { CommentHostIdParamDto } from './dto/comment.dto';

/**
 * S1-style host list — `GET /tier-lists/{id}/comments` (D3.21 additive).
 */
@ApiTags('comments')
@ApiBearerAuth('bearer')
@Controller('tier-lists')
@UseGuards(OptionalGuestGuard)
export class TierListCommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get(':id/comments')
  listTierListComments(@Param() params: CommentHostIdParamDto): Promise<CommentResponse[]> {
    return this.commentsService.listByHost('tier_list', params.id);
  }
}
