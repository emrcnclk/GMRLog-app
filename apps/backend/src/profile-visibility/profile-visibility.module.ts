import { PrismaFollowRepository, PrismaUserSettingsRepository } from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';

import { ProfileVisibilityGuard } from './profile-visibility.guard';
import { ProfileVisibilityService } from './profile-visibility.service';
import {
  PROFILE_VISIBILITY_FOLLOW_REPOSITORY,
  PROFILE_VISIBILITY_SETTINGS_REPOSITORY,
} from './profile-visibility.tokens';

/**
 * Bug 8 — one home for the `profileVisibility` rule, imported by every domain
 * that serves a public profile surface.
 */
@Module({
  imports: [AuthModule, PrismaModule],
  providers: [
    {
      provide: PROFILE_VISIBILITY_SETTINGS_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserSettingsRepository(prisma),
    },
    {
      provide: PROFILE_VISIBILITY_FOLLOW_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaFollowRepository(prisma),
    },
    ProfileVisibilityService,
    ProfileVisibilityGuard,
  ],
  exports: [ProfileVisibilityService, ProfileVisibilityGuard],
})
export class ProfileVisibilityModule {}
