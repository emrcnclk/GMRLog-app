import type { BookmarkResponse } from '@gmrlog/types';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import type { PaginatedPayload } from '../infrastructure/http/paginated-payload';

import { BookmarkListQueryDto } from './dto/post.dto';
import { PostsService } from './posts.service';

/**
 * D3.24 SOCIAL_ACTIONS — private, viewer-owned bookmarks list (`GET /bookmarks`).
 * Lives alongside `PostsController` in `PostsModule` since bookmarks are a
 * Post-aggregate edge (`SOCIAL_ACTIONS.md` § Bookmark) — no parallel SoT.
 */
@ApiTags('posts')
@ApiBearerAuth('bearer')
@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  listBookmarks(
    @CurrentUser() identity: RequestIdentity,
    @Query() query: BookmarkListQueryDto,
  ): Promise<PaginatedPayload<BookmarkResponse>> {
    return this.postsService.listBookmarks(playerIdOf(identity), query);
  }
}
