import {
  PrismaConnectedAccountRepository,
  PrismaUploadRepository,
  PrismaUserRepository,
  PrismaUserSettingsRepository,
} from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { FollowsModule } from '../follows/follows.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';

import { ConnectedAccountsController } from './connected-accounts.controller';
import { MeProfileThemeController } from './me-profile-theme.controller';
import { MeController } from './me.controller';
import { SettingsController } from './settings.controller';
import { UserProfileThemeController } from './user-profile-theme.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import {
  CONNECTED_ACCOUNT_REPOSITORY,
  UPLOAD_REPOSITORY,
  USER_REPOSITORY,
  USER_SETTINGS_REPOSITORY,
} from './users.tokens';

/**
 * User domain (D2.2). Controllers → UsersService → repositories.
 * Profile Hero lives in ProfileHeroModule (D3.24). Profile Theme (D3.29)
 * reuses UserSettings persistence and FollowsModule's follow-check.
 */
@Module({
  imports: [AuthModule, PrismaModule, FollowsModule],
  controllers: [
    MeController,
    SettingsController,
    ConnectedAccountsController,
    UsersController,
    MeProfileThemeController,
    UserProfileThemeController,
  ],
  providers: [
    {
      provide: USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    {
      provide: USER_SETTINGS_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserSettingsRepository(prisma),
    },
    {
      provide: CONNECTED_ACCOUNT_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaConnectedAccountRepository(prisma),
    },
    {
      provide: UPLOAD_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUploadRepository(prisma),
    },
    UsersService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
