import {
  PrismaCollectionRepository,
  PrismaCommunityMemberRepository,
  PrismaCommunityRepository,
  PrismaEventParticipationRepository,
  PrismaEventRepository,
  PrismaGameRepository,
  PrismaLibraryEntryRepository,
  PrismaPostRepository,
  PrismaReviewRepository,
  PrismaTierListRepository,
  PrismaUserRepository,
} from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { BlocksModule } from '../blocks/blocks.module';
import { FollowsModule } from '../follows/follows.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';

import { GameHubController } from './game-hub.controller';
import { GameHubService } from './game-hub.service';
import {
  GAME_HUB_COLLECTION_REPOSITORY,
  GAME_HUB_COMMUNITY_MEMBER_REPOSITORY,
  GAME_HUB_COMMUNITY_REPOSITORY,
  GAME_HUB_EVENT_PARTICIPATION_REPOSITORY,
  GAME_HUB_EVENT_REPOSITORY,
  GAME_HUB_GAME_REPOSITORY,
  GAME_HUB_LIBRARY_REPOSITORY,
  GAME_HUB_POST_REPOSITORY,
  GAME_HUB_REVIEW_REPOSITORY,
  GAME_HUB_TIER_LIST_REPOSITORY,
  GAME_HUB_USER_REPOSITORY,
} from './game-hub.tokens';

/**
 * Game Hub domain (D3.24 GAME_HUB.md). Controller → GameHubService →
 * `@gmrlog/database` repositories (F6.3). Pure composition facade — no
 * dedicated Game Hub tables, no second source of truth.
 */
@Module({
  imports: [AuthModule, PrismaModule, FollowsModule, BlocksModule],
  controllers: [GameHubController],
  providers: [
    {
      provide: GAME_HUB_GAME_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaGameRepository(prisma),
    },
    {
      provide: GAME_HUB_POST_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaPostRepository(prisma),
    },
    {
      provide: GAME_HUB_REVIEW_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaReviewRepository(prisma),
    },
    {
      provide: GAME_HUB_COLLECTION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCollectionRepository(prisma),
    },
    {
      provide: GAME_HUB_TIER_LIST_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaTierListRepository(prisma),
    },
    {
      provide: GAME_HUB_EVENT_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaEventRepository(prisma),
    },
    {
      provide: GAME_HUB_EVENT_PARTICIPATION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaEventParticipationRepository(prisma),
    },
    {
      provide: GAME_HUB_COMMUNITY_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCommunityRepository(prisma),
    },
    {
      provide: GAME_HUB_COMMUNITY_MEMBER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCommunityMemberRepository(prisma),
    },
    {
      provide: GAME_HUB_LIBRARY_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaLibraryEntryRepository(prisma),
    },
    {
      provide: GAME_HUB_USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    GameHubService,
  ],
  exports: [GameHubService],
})
export class GameHubModule {}
