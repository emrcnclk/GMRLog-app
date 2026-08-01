import {
  PrismaAchievementRepository,
  PrismaActivityRepository,
  PrismaNotificationRepository,
  PrismaPlayerMetricsRepository,
  PrismaUserRepository,
} from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { ArchetypesModule } from '../archetypes/archetypes.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';

import { AchievementsCatalogController } from './achievements-catalog.controller';
import { AchievementsBootstrapService } from './achievements.bootstrap';
import { UserAchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import {
  ACHIEVEMENT_ACTIVITY_REPOSITORY,
  ACHIEVEMENT_METRICS_REPOSITORY,
  ACHIEVEMENT_NOTIFICATION_REPOSITORY,
  ACHIEVEMENT_REPOSITORY,
  ACHIEVEMENT_USER_REPOSITORY,
} from './achievements.tokens';
import { MeAchievementsController } from './me-achievements.controller';

/**
 * Achievements domain (D3.21). Controllers → AchievementsService → repositories.
 * Exports AchievementsService for friends accept / library upsert hooks.
 */
@Module({
  imports: [AuthModule, PrismaModule, ArchetypesModule],
  controllers: [
    MeAchievementsController,
    UserAchievementsController,
    AchievementsCatalogController,
  ],
  providers: [
    {
      provide: ACHIEVEMENT_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaAchievementRepository(prisma),
    },
    {
      provide: ACHIEVEMENT_METRICS_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaPlayerMetricsRepository(prisma),
    },
    {
      provide: ACHIEVEMENT_USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    {
      provide: ACHIEVEMENT_NOTIFICATION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaNotificationRepository(prisma),
    },
    {
      provide: ACHIEVEMENT_ACTIVITY_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaActivityRepository(prisma),
    },
    AchievementsService,
    AchievementsBootstrapService,
  ],
  exports: [AchievementsService],
})
export class AchievementsModule {}
