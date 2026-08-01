import {
  PrismaCommunityMemberRepository,
  PrismaCommunityRepository,
  PrismaGameRepository,
  PrismaNotificationRepository,
  PrismaPollRepository,
  PrismaPollVoteRepository,
  PrismaPostBookmarkRepository,
  PrismaPostRepository,
  PrismaRepostRepository,
  PrismaUserRepository,
} from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { CommunitiesModule } from '../communities/communities.module';
import { FollowsModule } from '../follows/follows.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { JobsModule } from '../infrastructure/jobs/jobs.module';
import { RedisModule } from '../infrastructure/redis/redis.module';

import { BookmarksController } from './bookmarks.controller';
import { GamePostsController } from './game-posts.controller';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import {
  POST_BOOKMARK_REPOSITORY,
  POST_COMMUNITY_MEMBER_REPOSITORY,
  POST_COMMUNITY_REPOSITORY,
  POST_GAME_REPOSITORY,
  POST_NOTIFICATION_REPOSITORY,
  POST_POLL_REPOSITORY,
  POST_POLL_VOTE_REPOSITORY,
  POST_REPOSITORY,
  POST_REPOST_REPOSITORY,
  POST_USER_REPOSITORY,
} from './posts.tokens';

/**
 * Post domain (D2.7 · D3.18 · D3.24). Controllers → PostsService → `@gmrlog/database`
 * repositories (F6.3). Prisma is consumed only through the repository bindings.
 */
@Module({
  imports: [AuthModule, PrismaModule, FollowsModule, JobsModule, RedisModule, CommunitiesModule],
  controllers: [PostsController, GamePostsController, BookmarksController],
  providers: [
    {
      provide: POST_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaPostRepository(prisma),
    },
    {
      provide: POST_GAME_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaGameRepository(prisma),
    },
    {
      provide: POST_USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    {
      provide: POST_COMMUNITY_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCommunityRepository(prisma),
    },
    {
      provide: POST_COMMUNITY_MEMBER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCommunityMemberRepository(prisma),
    },
    {
      provide: POST_REPOST_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaRepostRepository(prisma),
    },
    {
      provide: POST_POLL_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaPollRepository(prisma),
    },
    {
      provide: POST_POLL_VOTE_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaPollVoteRepository(prisma),
    },
    {
      provide: POST_BOOKMARK_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaPostBookmarkRepository(prisma),
    },
    {
      provide: POST_NOTIFICATION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaNotificationRepository(prisma),
    },
    PostsService,
  ],
  exports: [POST_REPOSITORY, PostsService],
})
export class PostsModule {}
