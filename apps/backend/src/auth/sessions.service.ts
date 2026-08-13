import { randomUUID } from 'node:crypto';

import type {
  AuthCredentialRepository,
  SessionRepository,
  UserRepository,
  UserSettingsRepository,
} from '@gmrlog/database';
import type {
  OAuthProviderKind,
  SessionCredentialResponse,
  SignInMethodsResponse,
} from '@gmrlog/types';
import type {
  SessionCreateInput,
  SessionRefreshInput,
  SessionRegisterInput,
  PasswordForgotInput,
  PasswordResetInput,
  SetPasswordInput,
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
import { countUsableSignInMethods } from './sign-in-methods';

/**
 * Task 4.6 — shape-valid but unattached to any real credential, so
 * `verifyPassword` always does genuine scrypt work and never matches. Used
 * only to normalize login timing when no real `secretHash` exists to check
 * against (see `SessionsService.login`).
 */
const DUMMY_SECRET_HASH = `${'a'.repeat(32)}:${'b'.repeat(128)}`;

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

    // Task 4.6 — unknown email, wrong password, and an oauth-only account
    // (a `type=password` credential with `secretHash: null`, planted purely
    // as an email claim placeholder) already throw the identical message and
    // status below; that alone isn't enough if the three take different
    // amounts of wall-clock time to fail. Run the same scrypt work on every
    // attempt — against the real hash when one exists, against a fixed dummy
    // hash otherwise — so timing can't become a second oracle for account
    // existence next to the message that's deliberately the same for all three.
    const suppliedPassword = typeof input.password === 'string' ? input.password : '';
    const valid = await verifyPassword(
      suppliedPassword,
      credential?.secretHash ?? DUMMY_SECRET_HASH,
    );
    if (credential?.secretHash == null || !valid) {
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

  /**
   * Task 4.7 — the Settings connect/disconnect surface's read model. Counts
   * the same way the disconnect guard does (`countUsableSignInMethods`), so
   * the UI and the guard it's disabling a button in front of can't disagree
   * about how many usable methods a player has left.
   */
  async signInMethods(userId: string): Promise<SignInMethodsResponse> {
    const credentials = await this.credentials.listByUserId(userId);
    const password = credentials.find((row) => row.type === 'password') ?? null;
    const connected = new Set<OAuthProviderKind>();
    for (const row of credentials) {
      if (row.type === 'oauth' && row.provider !== null) {
        connected.add(row.provider);
      }
    }

    return {
      password: { usable: password?.secretHash != null },
      google: { connected: connected.has('google') },
      discord: { connected: connected.has('discord') },
      usableCount: countUsableSignInMethods(credentials),
    };
  }

  /**
   * Task 4.7's escape hatch (OAUTH.md §5: "Prompt them to set a password
   * first"). Either fills in the `secretHash: null` email-claim placeholder
   * an OAuth signup already planted (`OAuthService` rule 4), or — for an
   * account that never got one (an unverified-email OAuth signup) — creates
   * a fresh `type=password` row from a supplied email. Never revokes the
   * caller's own session the way `resetPassword` does: that revocation
   * defends the "someone else has the reset link" scenario, which doesn't
   * apply to an already-authenticated player adding a password to their own
   * account.
   */
  async setPassword(userId: string, input: SetPasswordInput): Promise<void> {
    const existing = await this.credentials.findPasswordByUserId(userId);
    if (existing !== null && existing.secretHash !== null) {
      throw new ConflictException({
        code: 'PASSWORD_ALREADY_SET',
        message: 'A password is already set for this account.',
      });
    }

    const secretHash = await hashPassword(input.password);

    if (existing !== null) {
      await this.credentials.updateSecretHash(existing.id, secretHash);
      return;
    }

    if (input.email === undefined) {
      throw new BadRequestException({
        code: 'EMAIL_REQUIRED',
        message: 'An email is required to set a password.',
      });
    }

    const email = normalizeEmail(input.email);
    const taken = await this.credentials.findByTypeAndProviderRef('password', email);
    if (taken !== null) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_REGISTERED',
        message: 'Email is already registered.',
      });
    }

    try {
      await this.credentials.create({
        user: { connect: { id: userId } },
        type: 'password',
        providerRef: email,
        secretHash,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException({
          code: 'EMAIL_ALREADY_REGISTERED',
          message: 'Email is already registered.',
        });
      }
      throw error;
    }
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

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}
