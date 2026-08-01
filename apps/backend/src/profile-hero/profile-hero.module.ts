import {
  PrismaLibraryEntryRepository,
  PrismaPlayerMetricsRepository,
  PrismaProfilePinRepository,
  PrismaUserArchetypeRepository,
  PrismaUserReputationRepository,
  PrismaUserRepository,
} from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { CreatorModule } from '../creator/creator.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';

import { ProfileHeroController } from './profile-hero.controller';
import { ProfileHeroService } from './profile-hero.service';
import {
  PROFILE_HERO_ARCHETYPE_REPOSITORY,
  PROFILE_HERO_LIBRARY_REPOSITORY,
  PROFILE_HERO_METRICS_REPOSITORY,
  PROFILE_HERO_PIN_REPOSITORY,
  PROFILE_HERO_REPUTATION_REPOSITORY,
  PROFILE_HERO_USER_REPOSITORY,
} from './profile-hero.tokens';

/**
 * Profile Hero domain (D3.24 / PROFILE_V2.md).
 */
@Module({
  imports: [AuthModule, PrismaModule, CreatorModule],
  controllers: [ProfileHeroController],
  providers: [
    {
      provide: PROFILE_HERO_USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    {
      provide: PROFILE_HERO_METRICS_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaPlayerMetricsRepository(prisma),
    },
    {
      provide: PROFILE_HERO_LIBRARY_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaLibraryEntryRepository(prisma),
    },
    {
      provide: PROFILE_HERO_PIN_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaProfilePinRepository(prisma),
    },
    {
      provide: PROFILE_HERO_ARCHETYPE_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserArchetypeRepository(prisma),
    },
    {
      provide: PROFILE_HERO_REPUTATION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserReputationRepository(prisma),
    },
    ProfileHeroService,
  ],
  exports: [ProfileHeroService],
})
export class ProfileHeroModule {}
