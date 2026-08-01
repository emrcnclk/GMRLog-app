import {
  PrismaNotificationRepository,
  PrismaQuoteRepository,
  PrismaUserRepository,
} from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { BlocksModule } from '../blocks/blocks.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { JobsModule } from '../infrastructure/jobs/jobs.module';
import { PostsModule } from '../posts/posts.module';

import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import {
  QUOTE_NOTIFICATION_REPOSITORY,
  QUOTE_REPOSITORY,
  QUOTE_USER_REPOSITORY,
} from './quotes.tokens';

@Module({
  imports: [AuthModule, PrismaModule, JobsModule, BlocksModule, PostsModule],
  controllers: [QuotesController],
  providers: [
    {
      provide: QUOTE_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaQuoteRepository(prisma),
    },
    {
      provide: QUOTE_USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    {
      provide: QUOTE_NOTIFICATION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaNotificationRepository(prisma),
    },
    QuotesService,
  ],
  exports: [QuotesService],
})
export class QuotesModule {}
