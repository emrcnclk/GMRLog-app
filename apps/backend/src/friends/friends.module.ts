import {
  PrismaActivityRepository,
  PrismaBlockRepository,
  PrismaFollowRepository,
  PrismaFriendshipRepository,
  PrismaNotificationRepository,
  PrismaPresenceRepository,
  PrismaUserRepository,
} from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AchievementsModule } from '../achievements/achievements.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';

import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import {
  FRIENDS_ACTIVITY_REPOSITORY,
  FRIENDS_BLOCK_REPOSITORY,
  FRIENDS_FOLLOW_REPOSITORY,
  FRIENDS_NOTIFICATION_REPOSITORY,
  FRIENDS_USER_REPOSITORY,
  FRIENDSHIP_REPOSITORY,
  PRESENCE_REPOSITORY,
} from './friends.tokens';
import { PresenceController } from './presence.controller';
import { UserFriendsController } from './user-friends.controller';

/**
 * Friends + presence domain (D3.21 / SOCIAL_API).
 * Controllers → FriendsService → `@gmrlog/database` repositories (F6.3).
 */
@Module({
  imports: [AuthModule, PrismaModule, AchievementsModule],
  controllers: [FriendsController, UserFriendsController, PresenceController],
  providers: [
    {
      provide: FRIENDSHIP_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaFriendshipRepository(prisma),
    },
    {
      provide: PRESENCE_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaPresenceRepository(prisma),
    },
    {
      provide: FRIENDS_USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    {
      provide: FRIENDS_BLOCK_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaBlockRepository(prisma),
    },
    {
      provide: FRIENDS_FOLLOW_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaFollowRepository(prisma),
    },
    {
      provide: FRIENDS_NOTIFICATION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaNotificationRepository(prisma),
    },
    {
      provide: FRIENDS_ACTIVITY_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaActivityRepository(prisma),
    },
    FriendsService,
  ],
  exports: [FRIENDSHIP_REPOSITORY, PRESENCE_REPOSITORY, FriendsService],
})
export class FriendsModule {}
