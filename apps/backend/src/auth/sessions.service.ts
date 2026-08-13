import { randomUUID } from 'node:crypto';

import type {
  AuthCredentialRepository,
  SessionRepository,
  UserRepository,
  UserSettingsRepository,
} from '@gmrlog/database';
import type { SessionCredentialResponse } from '@gmrlog/types';
import type {
  SessionCreateInput,
  SessionRefreshInput,
  SessionRegisterInput,
  PasswordForgotInput,
  PasswordResetInput,
} from '@gmrlog/validators';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { ENV } from '../infrastructure/config/config.module';
import type { BackendEnv } from '../infrastructure/config/env.schema';
import { EMAIL_PORT, type EmailPort } from '../infrastructure/email/email.port';

import {
  AUTH_CREDENTIAL_REPOSITORY,
  AUTH_USER_REPOSITORY,
  AUTH_USER_SETTINGS_REPOSITORY,
  SESSION_REPOSITORY,
} from './auth.tokens';
import { TokenService } from './jwt/token.service';
import { hashPassword, verifyPassword } from './password';
import { PasswordResetStore } from './password-reset.store';

/**
 * Session credential flow (S1 §13.1 — `/sessions`). Login · register · refresh ·
 * logout · password recovery.
 */
@Injectable()
export class SessionsService {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    @Inject(AUTH_CREDENTIAL_REPOSITORY)
    private readonly credentials: AuthCredentialRepository,
    @Inject(AUTH_USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(AUTH_USER_SETTINGS_REPOSITORY)
    private readonly settings: UserSettingsRepository,
    private readonly tokens: TokenService,
    @Inject(ENV) private readonly env: BackendEnv,
    private readonly passwordResetStore: PasswordResetStore,
    @Inject(EMAIL_PORT) private readonly email: EmailPort,
  ) {}

  async login(input: SessionCreateInput): Promise<SessionCredentialResponse> {
    const email = normalizeEmail(input.email);
    const credential = await this.credentials.findByTypeAndProviderRef('password', email);
    if (credential?.secretHash == null) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await verifyPassword(input.password, credential.secretHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const user = await this.users.findById(credential.userId);
    if (user == null || user.deletedAt != null) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueCredentialPair(user.id);
  }

  async register(input: SessionRegisterInput): Promise<SessionCredentialResponse> {
    const email = normalizeEmail(input.email);
    const handle = input.handle;

    const existingHandle = await this.users.findByHandle(handle);
    if (existingHandle != null) {
      throw new ConflictException('Handle is already in use');
    }

    const existingCredential = await this.credentials.findByTypeAndProviderRef('password', email);
    if (existingCredential != null) {
      throw new ConflictException('Email is already registered');
    }

    const secretHash = await hashPassword(input.password);
    const user = await this.users.create({
      handle,
      displayName: input.displayName,
    });

    await this.credentials.create({
      user: { connect: { id: user.id } },
      type: 'password',
      providerRef: email,
      secretHash,
    });

    await this.settings.upsertByUser(user.id, {});

    return this.issueCredentialPair(user.id);
  }

  async refresh(input: SessionRefreshInput): Promise<SessionCredentialResponse> {
    const payload = await this.tokens.verifyRefreshToken(input.refreshToken);
    if (payload === null) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.sessionId == null) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.sessions.findById(payload.sessionId);
    if (
      session?.userId !== payload.sub ||
      session.revokedAt != null ||
      session.expiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.sessions.revoke(session.id);
    return this.issueCredentialPair(payload.sub);
  }

  async logoutCurrent(userId: string, sessionId?: string): Promise<void> {
    if (sessionId != null) {
      const session = await this.sessions.findById(sessionId);
      if (session?.userId === userId && session.revokedAt == null) {
        await this.sessions.revoke(session.id);
      }
      return;
    }

    const rows = await this.sessions.listByUser(userId);
    for (const row of rows) {
      if (row.revokedAt == null) {
        await this.sessions.revoke(row.id);
      }
    }
  }

  /** Always completes silently — no email enumeration (S1). */
  async forgotPassword(input: PasswordForgotInput): Promise<void> {
    const email = normalizeEmail(input.email);
    const credential = await this.credentials.findByTypeAndProviderRef('password', email);
    if (credential == null) {
      return;
    }

    const user = await this.users.findById(credential.userId);
    if (user == null || user.deletedAt != null) {
      return;
    }

    const token = randomUUID();
    await this.passwordResetStore.put(token, user.id);
    const resetUrl = `${this.env.PASSWORD_RESET_URL_BASE}?token=${encodeURIComponent(token)}`;
    await this.email.send({
      to: email,
      subject: 'Reset your GMRLOG password',
      text: `Use this link to reset your password: ${resetUrl}`,
    });
  }

  async resetPassword(input: PasswordResetInput): Promise<void> {
    const userId = await this.passwordResetStore.getUserId(input.token);
    if (userId == null) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const credential = await this.credentials.findPasswordByUserId(userId);
    if (credential == null) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const secretHash = await hashPassword(input.password);
    await this.credentials.updateSecretHash(credential.id, secretHash);
    await this.passwordResetStore.delete(input.token);
    await this.logoutCurrent(userId);
  }

  /** Shared token-issuance step — also used by `OAuthController` once a user resolves. */
  async issueCredentialPair(userId: string): Promise<SessionCredentialResponse> {
    const expiresAt = new Date(Date.now() + this.env.JWT_REFRESH_TTL_SECONDS * 1000);
    const session = await this.sessions.create({
      user: { connect: { id: userId } },
      expiresAt,
    });

    const [accessToken, refreshToken] = await Promise.all([
      this.tokens.signAccessToken(userId, session.id),
      this.tokens.signRefreshToken(userId, session.id),
    ]);

    return { accessToken, refreshToken };
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
