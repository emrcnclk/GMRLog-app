import {
  PrismaGameRepository,
  PrismaReviewRepository,
  PrismaUserRepository,
} from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { FollowsModule } from '../follows/follows.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { JobsModule } from '../infrastructure/jobs/jobs.module';

import { GameReviewsController } from './game-reviews.controller';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import {
  REVIEW_GAME_REPOSITORY,
  REVIEW_REPOSITORY,
  REVIEW_USER_REPOSITORY,
} from './reviews.tokens';

/**
 * Review domain (D2.4). Controllers → ReviewsService → `@gmrlog/database`
 * repositories (F6.3). Prisma is consumed only through the repository bindings.
 */
@Module({
  imports: [AuthModule, PrismaModule, FollowsModule, JobsModule],
  controllers: [ReviewsController, GameReviewsController],
  providers: [
    {
      provide: REVIEW_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaReviewRepository(prisma),
    },
    {
      provide: REVIEW_GAME_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaGameRepository(prisma),
    },
    {
      provide: REVIEW_USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    ReviewsService,
  ],
})
export class ReviewsModule {}
