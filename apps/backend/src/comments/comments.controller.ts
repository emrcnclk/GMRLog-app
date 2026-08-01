import type { CommentResponse } from '@gmrlog/types';
import { commentCreateSchema, commentPatchSchema } from '@gmrlog/validators';
import { Body, Controller, Delete, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import { Idempotent } from '../infrastructure/http/idempotency.interceptor';
import { ApiZodBody } from '../infrastructure/openapi/swagger.decorators';

import { CommentsService } from './comments.service';
import { CommentCreateDto, CommentIdParamDto, CommentPatchDto } from './dto/comment.dto';

/**
 * S1 §13.7 — Comments resource writes. Transport only.
 * List reads live on the host resources (`/posts/{id}/comments`, …).
 */
@ApiTags('comments')
@ApiBearerAuth('bearer')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Idempotent()
  @ApiZodBody(commentCreateSchema)
  createComment(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: CommentCreateDto,
  ): Promise<CommentResponse> {
    return this.commentsService.createComment(playerIdOf(identity), body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiZodBody(commentPatchSchema)
  updateComment(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: CommentIdParamDto,
    @Body() body: CommentPatchDto,
  ): Promise<CommentResponse> {
    return this.commentsService.updateComment(params.id, playerIdOf(identity), body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async deleteComment(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: CommentIdParamDto,
  ): Promise<void> {
    await this.commentsService.deleteComment(params.id, playerIdOf(identity));
  }
}
