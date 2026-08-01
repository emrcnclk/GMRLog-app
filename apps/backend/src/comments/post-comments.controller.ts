import type { CommentResponse } from '@gmrlog/types';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { OptionalGuestGuard } from '../auth/guards/optional-guest.guard';

import { CommentsService } from './comments.service';
import { CommentHostIdParamDto } from './dto/comment.dto';

/**
 * S1 §13.7 — `GET /posts/{id}/comments`. Soft-gate readable. Flat list ordered
 * by creation time (replies included via `parentCommentId` — no tree build).
 */
@ApiTags('comments')
@ApiBearerAuth('bearer')
@Controller('posts')
@UseGuards(OptionalGuestGuard)
export class PostCommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get(':id/comments')
  listPostComments(@Param() params: CommentHostIdParamDto): Promise<CommentResponse[]> {
    return this.commentsService.listByHost('post', params.id);
  }
}
