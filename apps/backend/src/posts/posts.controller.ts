import type { BookmarkResponse, PollResponse, PostResponse, RepostResponse } from '@gmrlog/types';
import { pollVoteSchema, postCreateSchema } from '@gmrlog/validators';
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
import { isAuthenticatedIdentity, type RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import { Idempotent } from '../infrastructure/http/idempotency.interceptor';
import { ApiZodBody } from '../infrastructure/openapi/swagger.decorators';

import { PollVoteDto, PostCreateDto, PostIdParamDto, PostPatchDto } from './dto/post.dto';
import { PostsService } from './posts.service';

/**
 * S1 §13.7 — Posts resource. Transport only.
 * Game-scoped list lives on `GET /games/{id}/posts` (S1 §13.6).
 * There is no flat `GET /posts` in S1.
 * D3.24 SOCIAL_ACTIONS adds repost · pin · bookmark · poll vote on the same
 * post-scoped path; `GET /bookmarks` (flat, viewer-owned) lives on `BookmarksController`.
 */
@ApiTags('posts')
@ApiBearerAuth('bearer')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get(':id')
  @UseGuards(OptionalGuestGuard)
  getPost(
    @Param() params: PostIdParamDto,
    @CurrentUser() identity: RequestIdentity,
  ): Promise<PostResponse> {
    return this.postsService.getPost(params.id, identity);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Idempotent()
  @ApiZodBody(postCreateSchema)
  createPost(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: PostCreateDto,
  ): Promise<PostResponse> {
    return this.postsService.createPost(playerIdOf(identity), body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updatePost(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: PostIdParamDto,
    @Body() body: PostPatchDto,
  ): Promise<PostResponse> {
    return this.postsService.updatePost(params.id, playerIdOf(identity), body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async deletePost(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: PostIdParamDto,
  ): Promise<void> {
    await this.postsService.deletePost(params.id, playerIdOf(identity));
  }

  /** D3.24 SOCIAL_ACTIONS — amplify without body. Notifies original author (`repost`, ON). */
  @Post(':id/repost')
  @UseGuards(JwtAuthGuard)
  @Idempotent()
  repost(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: PostIdParamDto,
  ): Promise<RepostResponse> {
    return this.postsService.repostPost(playerIdOf(identity), params.id);
  }

  /** Un-repost — soft-delete only (audit trail preserved). */
  @Delete(':id/repost')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async undoRepost(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: PostIdParamDto,
  ): Promise<void> {
    await this.postsService.undoRepost(playerIdOf(identity), params.id);
  }

  /** D3.24 SOCIAL_ACTIONS — 1 pinned post per author; clears any previously pinned post. */
  @Post(':id/pin')
  @UseGuards(JwtAuthGuard)
  @Idempotent()
  pin(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: PostIdParamDto,
  ): Promise<PostResponse> {
    return this.postsService.pinPost(playerIdOf(identity), params.id);
  }

  @Delete(':id/pin')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async unpin(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: PostIdParamDto,
  ): Promise<void> {
    await this.postsService.unpinPost(playerIdOf(identity), params.id);
  }

  /** D3.24 SOCIAL_ACTIONS — private save. Never notifies the author (default OFF). */
  @Post(':id/bookmark')
  @UseGuards(JwtAuthGuard)
  @Idempotent()
  bookmark(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: PostIdParamDto,
  ): Promise<BookmarkResponse> {
    return this.postsService.bookmarkPost(playerIdOf(identity), params.id);
  }

  @Delete(':id/bookmark')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async unbookmark(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: PostIdParamDto,
  ): Promise<void> {
    await this.postsService.unbookmarkPost(playerIdOf(identity), params.id);
  }

  /** D3.24 Composer++ — one vote per user; rejected once `endsAt` has elapsed. */
  @Post(':id/poll/vote')
  @UseGuards(JwtAuthGuard)
  @Idempotent()
  @ApiZodBody(pollVoteSchema)
  votePoll(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: PostIdParamDto,
    @Body() body: PollVoteDto,
  ): Promise<PollResponse> {
    return this.postsService.votePoll(playerIdOf(identity), params.id, body.optionIndex);
  }

  /** D3.24 Composer++ — author closes an open poll early. */
  @Post(':id/poll/close')
  @UseGuards(JwtAuthGuard)
  @Idempotent()
  closePoll(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: PostIdParamDto,
  ): Promise<PollResponse> {
    return this.postsService.closePoll(playerIdOf(identity), params.id);
  }

  /** D3.24 — aggregated poll results (post visibility). */
  @Get(':id/poll')
  @UseGuards(OptionalGuestGuard)
  getPoll(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: PostIdParamDto,
  ): Promise<PollResponse> {
    return this.postsService.getPoll(
      isAuthenticatedIdentity(identity) ? identity.userId : null,
      params.id,
    );
  }
}
