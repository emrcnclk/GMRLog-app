import type { CommentResponse } from '@gmrlog/types';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { OptionalGuestGuard } from '../auth/guards/optional-guest.guard';

import { CommentsService } from './comments.service';
import { CommentHostIdParamDto } from './dto/comment.dto';

/**
 * S1-style host list — `GET /collections/{id}/comments` (D3.21 additive).
 */
@ApiTags('comments')
@ApiBearerAuth('bearer')
@Controller('collections')
@UseGuards(OptionalGuestGuard)
export class CollectionCommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get(':id/comments')
  listCollectionComments(@Param() params: CommentHostIdParamDto): Promise<CommentResponse[]> {
    return this.commentsService.listByHost('collection', params.id);
  }
}
