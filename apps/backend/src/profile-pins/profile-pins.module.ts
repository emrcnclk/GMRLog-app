import {
  PrismaAchievementRepository,
  PrismaCollectionRepository,
  PrismaGameRepository,
  PrismaProfilePinRepository,
  PrismaReviewRepository,
  PrismaUserRepository,
} from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';

import { MeProfilePinsController } from './me-profile-pins.controller';
import { ProfilePinsService } from './profile-pins.service';
import {
  PROFILE_PIN_ACHIEVEMENT_REPOSITORY,
  PROFILE_PIN_COLLECTION_REPOSITORY,
  PROFILE_PIN_GAME_REPOSITORY,
  PROFILE_PIN_REPOSITORY,
  PROFILE_PIN_REVIEW_REPOSITORY,
  PROFILE_PIN_USER_REPOSITORY,
} from './profile-pins.tokens';
import { UserProfilePinsController } from './user-profile-pins.controller';

/**
 * Profile pins domain (D3.21). Controllers → ProfilePinsService → repositories.
 * 9.5d added the `achievement` kind (badge equip) and its public read side.
 */
@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [MeProfilePinsController, UserProfilePinsController],
  providers: [
    {
      provide: PROFILE_PIN_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaProfilePinRepository(prisma),
    },
    {
      provide: PROFILE_PIN_USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    {
      provide: PROFILE_PIN_GAME_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaGameRepository(prisma),
    },
    {
      provide: PROFILE_PIN_REVIEW_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaReviewRepository(prisma),
    },
    {
      provide: PROFILE_PIN_COLLECTION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCollectionRepository(prisma),
    },
    {
      provide: PROFILE_PIN_ACHIEVEMENT_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaAchievementRepository(prisma),
    },
    ProfilePinsService,
  ],
  exports: [ProfilePinsService],
})
export class ProfilePinsModule {}
