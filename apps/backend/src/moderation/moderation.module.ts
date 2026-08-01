import {
  PrismaAdminActionRepository,
  PrismaCommentRepository,
  PrismaCommunityRepository,
  PrismaEventRepository,
  PrismaMessageRepository,
  PrismaModerationCaseRepository,
  PrismaPostRepository,
  PrismaReportRepository,
  PrismaReviewRepository,
  PrismaUserRepository,
} from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';

import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import {
  ADMIN_ACTION_REPOSITORY,
  MODERATION_CASE_REPOSITORY,
  MODERATION_COMMENT_REPOSITORY,
  MODERATION_COMMUNITY_REPOSITORY,
  MODERATION_EVENT_REPOSITORY,
  MODERATION_MESSAGE_REPOSITORY,
  MODERATION_POST_REPOSITORY,
  MODERATION_REVIEW_REPOSITORY,
  MODERATION_USER_REPOSITORY,
  REPORT_REPOSITORY,
} from './moderation.tokens';

/**
 * Moderation domain (D2.19). Controllers → ModerationService →
 * `@gmrlog/database` repositories (F6.3). Player report create only.
 */
@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ModerationController],
  providers: [
    {
      provide: REPORT_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaReportRepository(prisma),
    },
    {
      provide: MODERATION_CASE_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaModerationCaseRepository(prisma),
    },
    {
      provide: ADMIN_ACTION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaAdminActionRepository(prisma),
    },
    {
      provide: MODERATION_USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    {
      provide: MODERATION_POST_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaPostRepository(prisma),
    },
    {
      provide: MODERATION_REVIEW_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaReviewRepository(prisma),
    },
    {
      provide: MODERATION_COMMENT_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCommentRepository(prisma),
    },
    {
      provide: MODERATION_COMMUNITY_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCommunityRepository(prisma),
    },
    {
      provide: MODERATION_EVENT_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaEventRepository(prisma),
    },
    {
      provide: MODERATION_MESSAGE_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaMessageRepository(prisma),
    },
    ModerationService,
  ],
})
export class ModerationModule {}
