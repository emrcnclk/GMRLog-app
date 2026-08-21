import {
  PrismaAuthCredentialRepository,
  PrismaSessionRepository,
  PrismaUserRepository,
  PrismaUserSettingsRepository,
} from '@gmrlog/database';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ENV } from '../infrastructure/config/config.module';
import type { BackendEnv } from '../infrastructure/config/env.schema';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { EmailModule } from '../infrastructure/email/email.module';
import { RedisModule } from '../infrastructure/redis/redis.module';
import { LegalConsentModule } from '../legal/legal-consent.module';

import { AccountSecurityController } from './account-security.controller';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  AUTH_CREDENTIAL_REPOSITORY,
  AUTH_USER_REPOSITORY,
  AUTH_USER_SETTINGS_REPOSITORY,
  SESSION_REPOSITORY,
} from './auth.tokens';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OptionalGuestGuard } from './guards/optional-guest.guard';
import { TokenService } from './jwt/token.service';
import { OAuthStateStore } from './oauth/oauth-state.store';
import { OAuthController } from './oauth/oauth.controller';
import { OAuthService } from './oauth/oauth.service';
import { DiscordOAuthProvider } from './oauth/providers/discord.provider';
import { GoogleOAuthProvider } from './oauth/providers/google.provider';
import { SteamOpenIdProvider } from './oauth/providers/steam-openid.provider';
import { SteamConnectStateStore } from './oauth/steam-connect-state.store';
import { PasswordResetStore } from './password-reset.store';
import { SessionsService } from './sessions.service';

/**
 * Authentication foundation + session credential flow (D1.4 / D3.18 / D3.19).
 * Identity attachment, token abstractions, guards, and S1 `/sessions` routes.
 */
@Module({
  imports: [
    LegalConsentModule,
    PrismaModule,
    RedisModule,
    EmailModule,
    JwtModule.registerAsync({
      inject: [ENV],
      useFactory: (env: BackendEnv) => ({
        secret: env.JWT_SECRET,
        signOptions: { issuer: env.JWT_ISSUER },
        verifyOptions: { issuer: env.JWT_ISSUER },
      }),
    }),
  ],
  controllers: [AuthController, OAuthController, AccountSecurityController],
  providers: [
    TokenService,
    AuthService,
    SessionsService,
    OAuthService,
    OAuthStateStore,
    SteamConnectStateStore,
    PasswordResetStore,
    JwtAuthGuard,
    OptionalGuestGuard,
    {
      provide: GoogleOAuthProvider,
      inject: [ENV],
      useFactory: (env: BackendEnv) =>
        new GoogleOAuthProvider({
          clientId: env.GOOGLE_OAUTH_CLIENT_ID,
          clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
        }),
    },
    {
      provide: DiscordOAuthProvider,
      inject: [ENV],
      useFactory: (env: BackendEnv) =>
        new DiscordOAuthProvider({
          clientId: env.DISCORD_OAUTH_CLIENT_ID,
          clientSecret: env.DISCORD_OAUTH_CLIENT_SECRET,
        }),
    },
    {
      provide: SteamOpenIdProvider,
      inject: [ENV],
      useFactory: (env: BackendEnv) =>
        new SteamOpenIdProvider({
          realm: env.STEAM_OPENID_REALM,
        }),
    },
    {
      provide: SESSION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaSessionRepository(prisma),
    },
    {
      provide: AUTH_CREDENTIAL_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaAuthCredentialRepository(prisma),
    },
    {
      provide: AUTH_USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    {
      provide: AUTH_USER_SETTINGS_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserSettingsRepository(prisma),
    },
  ],
  exports: [
    TokenService,
    AuthService,
    JwtAuthGuard,
    OptionalGuestGuard,
    SteamOpenIdProvider,
    SteamConnectStateStore,
  ],
})
export class AuthModule {}
