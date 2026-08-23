import {
  PrismaAuthCredentialRepository,
  PrismaSessionRepository,
  PrismaUserConsentRepository,
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
import { AccountDeletionModule } from '../legal/account-deletion.module';
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
import { REGISTRATION_TRANSACTION, type RegistrationTransaction } from './registration-transaction';
import { SessionsService } from './sessions.service';

/**
 * Authentication foundation + session credential flow (D1.4 / D3.18 / D3.19).
 * Identity attachment, token abstractions, guards, and S1 `/sessions` routes.
 */
@Module({
  imports: [
    LegalConsentModule,
    AccountDeletionModule,
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
    {
      // 12.4 — the four writes a registration makes, in one transaction. The
      // repositories are rebuilt against `tx` rather than reusing the
      // singletons above: those are bound to the pooled client and would
      // commit outside the transaction they were meant to be part of.
      provide: REGISTRATION_TRANSACTION,
      inject: [PrismaService],
      useFactory:
        (prisma: PrismaService): RegistrationTransaction =>
        (fn) =>
          prisma.$transaction((tx) =>
            fn({
              users: new PrismaUserRepository(tx),
              credentials: new PrismaAuthCredentialRepository(tx),
              settings: new PrismaUserSettingsRepository(tx),
              consents: new PrismaUserConsentRepository(tx),
            }),
          ),
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
