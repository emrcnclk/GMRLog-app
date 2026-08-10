import {
  PrismaCommentRepository,
  PrismaCommunityActivityRepository,
  PrismaCommunityMemberBadgeRepository,
  PrismaCommunityMemberRepository,
  PrismaCommunityPinRepository,
  PrismaCommunityRepository,
  PrismaCommunityWikiRepository,
  PrismaEventParticipationRepository,
  PrismaEventRepository,
  PrismaFriendshipRepository,
  PrismaNotificationRepository,
  PrismaPostRepository,
  PrismaUserRepository,
} from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { FollowsModule } from '../follows/follows.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { RedisModule } from '../infrastructure/redis/redis.module';

import { CommunitiesController } from './communities.controller';
import { CommunitiesService } from './communities.service';
import {
  COMMUNITY_ACTIVITY_REPOSITORY,
  COMMUNITY_BADGE_REPOSITORY,
  COMMUNITY_COMMENT_REPOSITORY,
  COMMUNITY_EVENT_PARTICIPATION_REPOSITORY,
  COMMUNITY_EVENT_REPOSITORY,
  COMMUNITY_FRIENDSHIP_REPOSITORY,
  COMMUNITY_MEMBER_REPOSITORY,
  COMMUNITY_NOTIFICATION_REPOSITORY,
  COMMUNITY_PIN_REPOSITORY,
  COMMUNITY_POST_REPOSITORY,
  COMMUNITY_REPOSITORY,
  COMMUNITY_USER_REPOSITORY,
  COMMUNITY_WIKI_REPOSITORY,
} from './communities.tokens';

/**
 * Community domain (D2.12 · D3.24). Controllers → CommunitiesService →
 * `@gmrlog/database` repositories (F6.3).
 */
@Module({
  imports: [AuthModule, PrismaModule, FollowsModule, RedisModule],
  controllers: [CommunitiesController],
  providers: [
    {
      provide: COMMUNITY_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCommunityRepository(prisma),
    },
    {
      provide: COMMUNITY_MEMBER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCommunityMemberRepository(prisma),
    },
    {
      provide: COMMUNITY_FRIENDSHIP_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaFriendshipRepository(prisma),
    },
    {
      provide: COMMUNITY_USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    {
      provide: COMMUNITY_ACTIVITY_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCommunityActivityRepository(prisma),
    },
    {
      provide: COMMUNITY_WIKI_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCommunityWikiRepository(prisma),
    },
    {
      provide: COMMUNITY_PIN_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCommunityPinRepository(prisma),
    },
    {
      provide: COMMUNITY_BADGE_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCommunityMemberBadgeRepository(prisma),
    },
    {
      provide: COMMUNITY_POST_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaPostRepository(prisma),
    },
    {
      provide: COMMUNITY_NOTIFICATION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaNotificationRepository(prisma),
    },
    {
      provide: COMMUNITY_COMMENT_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCommentRepository(prisma),
    },
    {
      provide: COMMUNITY_EVENT_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaEventRepository(prisma),
    },
    {
      provide: COMMUNITY_EVENT_PARTICIPATION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaEventParticipationRepository(prisma),
    },
    CommunitiesService,
  ],
  exports: [COMMUNITY_REPOSITORY, COMMUNITY_MEMBER_REPOSITORY, CommunitiesService],
})
export class CommunitiesModule {}
