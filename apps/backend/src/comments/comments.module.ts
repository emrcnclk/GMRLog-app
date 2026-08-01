import {
  PrismaCollectionRepository,
  PrismaCommentRepository,
  PrismaNotificationRepository,
  PrismaPostRepository,
  PrismaReviewRepository,
  PrismaTierListRepository,
  PrismaUserRepository,
} from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { JobsModule } from '../infrastructure/jobs/jobs.module';

import { CollectionCommentsController } from './collection-comments.controller';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import {
  COMMENT_COLLECTION_REPOSITORY,
  COMMENT_NOTIFICATION_REPOSITORY,
  COMMENT_POST_REPOSITORY,
  COMMENT_REPOSITORY,
  COMMENT_REVIEW_REPOSITORY,
  COMMENT_TIER_LIST_REPOSITORY,
  COMMENT_USER_REPOSITORY,
} from './comments.tokens';
import { PostCommentsController } from './post-comments.controller';
import { ReviewCommentsController } from './review-comments.controller';
import { TierListCommentsController } from './tier-list-comments.controller';

/**
 * Comment domain (D2.5 / D3.21). Controllers → CommentsService → `@gmrlog/database`
 * repositories (F6.3). Prisma is consumed only through the repository bindings.
 */
@Module({
  imports: [AuthModule, PrismaModule, JobsModule],
  controllers: [
    CommentsController,
    PostCommentsController,
    ReviewCommentsController,
    CollectionCommentsController,
    TierListCommentsController,
  ],
  providers: [
    {
      provide: COMMENT_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCommentRepository(prisma),
    },
    {
      provide: COMMENT_USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    {
      provide: COMMENT_POST_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaPostRepository(prisma),
    },
    {
      provide: COMMENT_REVIEW_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaReviewRepository(prisma),
    },
    {
      provide: COMMENT_COLLECTION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCollectionRepository(prisma),
    },
    {
      provide: COMMENT_TIER_LIST_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaTierListRepository(prisma),
    },
    {
      provide: COMMENT_NOTIFICATION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaNotificationRepository(prisma),
    },
    CommentsService,
  ],
})
export class CommentsModule {}
