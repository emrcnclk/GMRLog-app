import {
  PrismaCollectionRepository,
  PrismaCommentRepository,
  PrismaNotificationRepository,
  PrismaPostRepository,
  PrismaReactionRepository,
  PrismaReviewRepository,
  PrismaTierListRepository,
  PrismaUserRepository,
} from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { JobsModule } from '../infrastructure/jobs/jobs.module';

import { ReactionsController } from './reactions.controller';
import { ReactionsService } from './reactions.service';
import {
  REACTION_COLLECTION_REPOSITORY,
  REACTION_COMMENT_REPOSITORY,
  REACTION_NOTIFICATION_REPOSITORY,
  REACTION_POST_REPOSITORY,
  REACTION_REPOSITORY,
  REACTION_REVIEW_REPOSITORY,
  REACTION_TIER_LIST_REPOSITORY,
  REACTION_USER_REPOSITORY,
} from './reactions.tokens';

/**
 * Reaction domain (D2.6 / D3.21). Controllers → ReactionsService → `@gmrlog/database`
 * repositories (F6.3). Prisma is consumed only through the repository bindings.
 */
@Module({
  imports: [AuthModule, PrismaModule, JobsModule],
  controllers: [ReactionsController],
  providers: [
    {
      provide: REACTION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaReactionRepository(prisma),
    },
    {
      provide: REACTION_USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    {
      provide: REACTION_POST_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaPostRepository(prisma),
    },
    {
      provide: REACTION_REVIEW_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaReviewRepository(prisma),
    },
    {
      provide: REACTION_COMMENT_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCommentRepository(prisma),
    },
    {
      provide: REACTION_COLLECTION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCollectionRepository(prisma),
    },
    {
      provide: REACTION_TIER_LIST_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaTierListRepository(prisma),
    },
    {
      provide: REACTION_NOTIFICATION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaNotificationRepository(prisma),
    },
    ReactionsService,
  ],
})
export class ReactionsModule {}
