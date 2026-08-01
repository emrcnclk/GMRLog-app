import {
  PrismaPlayerMetricsRepository,
  PrismaUserArchetypeRepository,
  PrismaUserRepository,
} from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';

import { ArchetypeEngineService } from './archetype-engine.service';
import {
  ARCHETYPE_METRICS_REPOSITORY,
  ARCHETYPE_REPOSITORY,
  ARCHETYPE_USER_REPOSITORY,
} from './archetypes.tokens';
import { MeArchetypesController } from './me-archetypes.controller';
import { UserArchetypesController } from './user-archetypes.controller';

/**
 * Player archetypes domain (D3.21). Controllers → ArchetypeEngineService →
 * `@gmrlog/database` repositories.
 */
@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [MeArchetypesController, UserArchetypesController],
  providers: [
    {
      provide: ARCHETYPE_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserArchetypeRepository(prisma),
    },
    {
      provide: ARCHETYPE_METRICS_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaPlayerMetricsRepository(prisma),
    },
    {
      provide: ARCHETYPE_USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    ArchetypeEngineService,
  ],
  exports: [ArchetypeEngineService],
})
export class ArchetypesModule {}
