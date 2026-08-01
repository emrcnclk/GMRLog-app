import {
  PrismaActivityRepository,
  PrismaBlockRepository,
  PrismaCollectionRepository,
  PrismaCommentRepository,
  PrismaGameRepository,
  PrismaPostRepository,
  PrismaReviewRepository,
  PrismaTierListRepository,
  PrismaUserRepository,
} from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { BLOCK_REPOSITORY } from '../blocks/blocks.tokens';
import { CommunitiesModule } from '../communities/communities.module';
import { FollowsModule } from '../follows/follows.module';
import { FriendsModule } from '../friends/friends.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { RedisModule } from '../infrastructure/redis/redis.module';
import { MutesModule } from '../mutes/mutes.module';

import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import {
  ACTIVITY_COLLECTION_REPOSITORY,
  ACTIVITY_COMMENT_REPOSITORY,
  ACTIVITY_GAME_REPOSITORY,
  ACTIVITY_POST_REPOSITORY,
  ACTIVITY_REPOSITORY,
  ACTIVITY_REVIEW_REPOSITORY,
  ACTIVITY_TIER_LIST_REPOSITORY,
  ACTIVITY_USER_REPOSITORY,
} from './activity.tokens';
import { FeedController } from './feed.controller';

/**
 * Activity center + D3.24 Hybrid Feed (+ Redis feed cache).
 */
@Module({
  imports: [
    AuthModule,
    PrismaModule,
    RedisModule,
    FollowsModule,
    CommunitiesModule,
    MutesModule,
    FriendsModule,
  ],
  controllers: [ActivityController, FeedController],
  providers: [
    {
      provide: ACTIVITY_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaActivityRepository(prisma),
    },
    {
      provide: ACTIVITY_POST_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaPostRepository(prisma),
    },
    {
      provide: ACTIVITY_REVIEW_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaReviewRepository(prisma),
    },
    {
      provide: ACTIVITY_COLLECTION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCollectionRepository(prisma),
    },
    {
      provide: ACTIVITY_TIER_LIST_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaTierListRepository(prisma),
    },
    {
      provide: ACTIVITY_COMMENT_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCommentRepository(prisma),
    },
    {
      provide: ACTIVITY_USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    {
      provide: ACTIVITY_GAME_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaGameRepository(prisma),
    },
    {
      provide: BLOCK_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaBlockRepository(prisma),
    },
    ActivityService,
  ],
  exports: [ActivityService],
})
export class ActivityModule {}
