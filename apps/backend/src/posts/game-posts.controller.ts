import type { PostResponse } from '@gmrlog/types';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalGuestGuard } from '../auth/guards/optional-guest.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';

import { GameIdParamDto } from './dto/post.dto';
import { PostsService } from './posts.service';

/**
 * S1 §13.6 — `GET /games/{id}/posts`. Soft-gate readable; visibility filtering
 * lives in the Post domain service.
 */
@ApiTags('posts')
@ApiBearerAuth('bearer')
@Controller('games')
@UseGuards(OptionalGuestGuard)
export class GamePostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get(':id/posts')
  listGamePosts(
    @Param() params: GameIdParamDto,
    @CurrentUser() identity: RequestIdentity,
  ): Promise<PostResponse[]> {
    return this.postsService.listGamePosts(params.id, identity);
  }
}
