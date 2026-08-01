import { PrismaPlayerMetricsRepository, PrismaUserRepository } from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { ArchetypesModule } from '../archetypes/archetypes.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';

import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { STATISTICS_METRICS_REPOSITORY, STATISTICS_USER_REPOSITORY } from './statistics.tokens';

/**
 * Statistics domain (D3.21). Controllers → StatisticsService → metrics repository.
 */
@Module({
  imports: [AuthModule, PrismaModule, ArchetypesModule],
  controllers: [StatisticsController],
  providers: [
    {
      provide: STATISTICS_METRICS_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaPlayerMetricsRepository(prisma),
    },
    {
      provide: STATISTICS_USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    StatisticsService,
  ],
  exports: [StatisticsService],
})
export class StatisticsModule {}
