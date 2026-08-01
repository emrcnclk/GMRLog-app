import {
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
  PROFILE_PIN_COLLECTION_REPOSITORY,
  PROFILE_PIN_GAME_REPOSITORY,
  PROFILE_PIN_REPOSITORY,
  PROFILE_PIN_REVIEW_REPOSITORY,
  PROFILE_PIN_USER_REPOSITORY,
} from './profile-pins.tokens';

/**
 * Profile pins domain (D3.21). Controllers → ProfilePinsService → repositories.
 */
@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [MeProfilePinsController],
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
    ProfilePinsService,
  ],
  exports: [ProfilePinsService],
})
export class ProfilePinsModule {}
