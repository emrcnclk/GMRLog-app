import {
  PrismaFriendshipRepository,
  PrismaGameLogRepository,
  PrismaGameRepository,
  PrismaLibraryEntryRepository,
  PrismaNotificationRepository,
} from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AchievementsModule } from '../achievements/achievements.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { JobsModule } from '../infrastructure/jobs/jobs.module';

import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import {
  GAME_LOG_REPOSITORY,
  GAME_REPOSITORY,
  LIBRARY_ENTRY_REPOSITORY,
  LIBRARY_FRIENDSHIP_REPOSITORY,
  LIBRARY_NOTIFICATION_REPOSITORY,
} from './library.tokens';

/**
 * Library domain (D2.3 / D3.21). Controllers → LibraryService → `@gmrlog/database`
 * repositories (F6.3). Prisma is consumed only through the repository bindings.
 */
@Module({
  imports: [AuthModule, PrismaModule, JobsModule, AchievementsModule],
  controllers: [LibraryController],
  providers: [
    {
      provide: LIBRARY_ENTRY_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaLibraryEntryRepository(prisma),
    },
    {
      provide: GAME_LOG_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaGameLogRepository(prisma),
    },
    {
      provide: GAME_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaGameRepository(prisma),
    },
    {
      provide: LIBRARY_FRIENDSHIP_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaFriendshipRepository(prisma),
    },
    {
      provide: LIBRARY_NOTIFICATION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaNotificationRepository(prisma),
    },
    LibraryService,
  ],
})
export class LibraryModule {}
