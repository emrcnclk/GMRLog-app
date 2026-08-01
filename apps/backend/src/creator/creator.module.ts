import {
  PrismaFollowRepository,
  PrismaGameRepository,
  PrismaUserRepository,
} from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { ReputationModule } from '../reputation/reputation.module';

import { CreatorEligibilityService } from './creator-eligibility.service';
import { CreatorProfileController } from './creator-profile.controller';
import { CreatorProfileService } from './creator-profile.service';
import {
  CREATOR_FOLLOW_REPOSITORY,
  CREATOR_GAME_REPOSITORY,
  CREATOR_USER_REPOSITORY,
} from './creator.tokens';

/**
 * Creator Profile domain (D3.24 / CREATOR_PROFILE.md). Controllers →
 * CreatorProfileService → `@gmrlog/database` repositories + ReputationEngineService.
 */
@Module({
  imports: [AuthModule, PrismaModule, ReputationModule],
  controllers: [CreatorProfileController],
  providers: [
    {
      provide: CREATOR_USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    {
      provide: CREATOR_GAME_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaGameRepository(prisma),
    },
    {
      provide: CREATOR_FOLLOW_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaFollowRepository(prisma),
    },
    CreatorEligibilityService,
    CreatorProfileService,
  ],
  exports: [CreatorEligibilityService, CreatorProfileService],
})
export class CreatorModule {}
