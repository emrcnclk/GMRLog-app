import { LEGAL_DOCUMENT_IDS } from '@gmrlog/types';

import { resolveLegalDocument } from '../legal/documents';
import { LegalConsentService } from '../legal/legal-consent.service';
import { createFakeUserConsentRepository } from '../legal/testing/fake-repositories';
import type {
  AuthCredential,
  AuthCredentialRepository,
  Session,
  SessionRepository,
  User,
  UserRepository,
  UserSettings,
  UserSettingsRepository,
  UserSettingsUpsertData,
} from '@gmrlog/database';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it } from 'vitest';

import { NoopEmailService } from '../infrastructure/email/noop-email.service';
import { parseBackendEnv } from '../infrastructure/config/env.schema';
import { MemoryPasswordResetStore } from './password-reset.store';
import { TokenService } from './jwt/token.service';
import { hashPassword, verifyPassword } from './password';
import { SessionsService } from './sessions.service';

function makeUser(overrides: Partial<User> = {}): User {
  const now = new Date();
  return {
    id: 'user-1',
    handle: 'player_one',
    displayName: 'Player One',
    bio: null,
    avatarKey: null,
    bannerKey: null,
    avatarBlurhash: null,
    avatarVariants: null,
    bannerBlurhash: null,
    bannerVariants: null,
    privacyId: null,
    firstName: null,
    lastName: null,
    birthDate: null,
    countryCode: null,
    creatorFeatured: false,
    accountKind: 'individual',
    cardNumber: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

function makeSession(overrides: Partial<Session> = {}): Session {
  const now = new Date();
  return {
    id: 'session-1',
    userId: 'user-1',
    expiresAt: new Date(now.getTime() + 86_400_000),
    revokedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeCredential(overrides: Partial<AuthCredential> = {}): AuthCredential {
  const now = new Date();
  return {
    id: 'cred-1',
    userId: 'user-1',
    type: 'password',
    provider: null,
    providerRef: 'player@example.com',
    secretHash: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

interface FakeSessionRepository extends SessionRepository {
  rows: Map<string, Session>;
}

function createFakeSessionRepository(seed: Session[] = []): FakeSessionRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));
  let seq = 0;
  return {
    rows,
    async create(data) {
      seq += 1;
      const id = `session-${seq}`;
      const userId =
        typeof data.user === 'object' && data.user !== null && 'connect' in data.user
          ? (data.user.connect?.id ?? 'user-1')
          : 'user-1';
      const expiresAt =
        data.expiresAt instanceof Date ? data.expiresAt : new Date(String(data.expiresAt));
      const now = new Date();
      const row = makeSession({ id, userId, expiresAt, createdAt: now, updatedAt: now });
      rows.set(id, row);
      return row;
    },
    async findById(id) {
      return rows.get(id) ?? null;
    },
    async listByUser(userId) {
      return [...rows.values()].filter((row) => row.userId === userId);
    },
    async revoke(id) {
      const existing = rows.get(id);
      if (!existing) {
        throw new Error(`session ${id} not found`);
      }
      const updated = { ...existing, revokedAt: new Date(), updatedAt: new Date() };
      rows.set(id, updated);
      return updated;
    },
    // Mirrors the conditional UPDATE: the check and the write happen with no
    // await between them, so concurrent callers serialise the way the row lock
    // makes them serialise in Postgres.
    // eslint-disable-next-line @typescript-eslint/require-await
    async revokeIfActive(id) {
      const existing = rows.get(id);
      if (!existing || existing.revokedAt != null) {
        return false;
      }
      rows.set(id, { ...existing, revokedAt: new Date(), updatedAt: new Date() });
      return true;
    },
    async delete(id) {
      const existing = rows.get(id);
      if (!existing) {
        throw new Error(`session ${id} not found`);
      }
      rows.delete(id);
      return existing;
    },
    async revokeExpiredBefore() {
      return 0;
    },
    async deleteRevokedOrExpiredBefore() {
      return 0;
    },
  };
}

interface FakeAuthCredentialRepository extends AuthCredentialRepository {
  rows: AuthCredential[];
  findPasswordByUserId(userId: string): Promise<AuthCredential | null>;
  listByUserId(userId: string): Promise<AuthCredential[]>;
  updateSecretHash(id: string, secretHash: string): Promise<AuthCredential>;
}

function createFakeAuthCredentialRepository(
  seed: AuthCredential[] = [],
): FakeAuthCredentialRepository {
  const rows = [...seed];
  let seq = 0;
  return {
    rows,
    async findByTypeAndProviderRef(type, providerRef) {
      return rows.find((row) => row.type === type && row.providerRef === providerRef) ?? null;
    },
    async create(data) {
      seq += 1;
      const userId =
        typeof data.user === 'object' && data.user !== null && 'connect' in data.user
          ? (data.user.connect?.id ?? 'user-1')
          : 'user-1';
      const row = makeCredential({
        id: `cred-${seq}`,
        userId,
        type: data.type,
        provider: (data.provider as AuthCredential['provider']) ?? null,
        providerRef: data.providerRef ?? null,
        secretHash: data.secretHash ?? null,
      });
      rows.push(row);
      return row;
    },
    async findPasswordByUserId(userId) {
      return rows.find((row) => row.userId === userId && row.type === 'password') ?? null;
    },
    async listByUserId(userId) {
      return rows.filter((row) => row.userId === userId);
    },
    async updateSecretHash(id, secretHash) {
      const index = rows.findIndex((row) => row.id === id);
      if (index < 0) {
        throw new Error(`credential ${id} not found`);
      }
      const updated = { ...rows[index]!, secretHash, updatedAt: new Date() };
      rows[index] = updated;
      return updated;
    },
  };
}

interface FakeUserRepository extends UserRepository {
  rows: Map<string, User>;
}

function createFakeUserRepository(seed: User[] = []): FakeUserRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));
  let seq = 0;
  return {
    rows,
    async create(data) {
      seq += 1;
      const id = `user-${seq}`;
      const row = makeUser({
        id,
        handle: String(data.handle),
        displayName: String(data.displayName),
      });
      rows.set(id, row);
      return row;
    },
    async findById(id) {
      return rows.get(id) ?? null;
    },
    async findManyByIds(ids) {
      return ids.flatMap((id) => {
        const row = rows.get(id);
        return row ? [row] : [];
      });
    },
    async findByHandle(handle) {
      return [...rows.values()].find((row) => row.handle === handle) ?? null;
    },
    async update(id, data) {
      const existing = rows.get(id);
      if (!existing) {
        throw new Error(`user ${id} not found`);
      }
      const updated = {
        ...existing,
        ...(data.handle !== undefined ? { handle: String(data.handle) } : {}),
        ...(data.displayName !== undefined ? { displayName: String(data.displayName) } : {}),
        updatedAt: new Date(),
      };
      rows.set(id, updated);
      return updated;
    },
    async softDelete(id) {
      return this.update(id, { deletedAt: new Date() });
    },
    async delete(id) {
      const existing = rows.get(id);
      if (!existing) {
        throw new Error(`user ${id} not found`);
      }
      rows.delete(id);
      return existing;
    },
  };
}

interface FakeUserSettingsRepository extends UserSettingsRepository {
  rows: Map<string, UserSettings>;
}

function createFakeUserSettingsRepository(): FakeUserSettingsRepository {
  const rows = new Map<string, UserSettings>();
  return {
    rows,
    async findByUser(userId) {
      return rows.get(userId) ?? null;
    },
    async upsertByUser(userId: string, data: UserSettingsUpsertData) {
      const existing = rows.get(userId);
      const now = new Date();
      const next: UserSettings = {
        id: existing?.id ?? `settings-${userId}`,
        userId,
        locale: data.locale === undefined ? (existing?.locale ?? null) : data.locale,
        theme: data.theme === undefined ? (existing?.theme ?? null) : data.theme,
        reduceMotion:
          data.reduceMotion === undefined ? (existing?.reduceMotion ?? false) : data.reduceMotion,
        profileVisibility: existing?.profileVisibility ?? 'public',
        accent: existing?.accent ?? 'neutral',
        cardStyle: existing?.cardStyle ?? 'elevated',
        bannerStyle: existing?.bannerStyle ?? 'artwork',
        favoritePlatform: existing?.favoritePlatform ?? null,
        consoleGeneration: existing?.consoleGeneration ?? null,
        widgetOrder: existing?.widgetOrder ?? [],
        pinnedWidgets: existing?.pinnedWidgets ?? [],
        hiddenWidgets: existing?.hiddenWidgets ?? [],
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      rows.set(userId, next);
      return next;
    },
  };
}

/**
 * 12.4 — the register flow now records consent, so the spec has to supply it.
 * Built from the live registry rather than hardcoded so a version bump does not
 * silently turn these into stale-submission tests.
 *
 * 12.4a — every document, not only the ones requiring acceptance: a notice that
 * was not shown has not been given.
 */
function currentShownDocuments() {
  return LEGAL_DOCUMENT_IDS.map((documentId) => {
    const document = resolveLegalDocument(documentId, 'en');
    if (document === null) {
      throw new Error(`missing legal document: ${documentId}`);
    }
    return { documentId, version: document.version, locale: 'en' as const };
  });
}

describe('SessionsService', () => {
  let sessions: FakeSessionRepository;
  let credentials: FakeAuthCredentialRepository;
  let users: FakeUserRepository;
  let settings: FakeUserSettingsRepository;
  let tokens: TokenService;
  let passwordResetStore: MemoryPasswordResetStore;
  let email: NoopEmailService;
  let service: SessionsService;
  const env = parseBackendEnv({});

  beforeEach(() => {
    sessions = createFakeSessionRepository();
    credentials = createFakeAuthCredentialRepository();
    users = createFakeUserRepository();
    settings = createFakeUserSettingsRepository();
    passwordResetStore = new MemoryPasswordResetStore();
    email = new NoopEmailService();
    const jwt = new JwtService({
      secret: env.JWT_SECRET,
      signOptions: { issuer: env.JWT_ISSUER },
      verifyOptions: { issuer: env.JWT_ISSUER },
    });
    tokens = new TokenService(jwt, env);
    service = new SessionsService(
      sessions,
      credentials,
      users,
      settings,
      tokens,
      env,
      passwordResetStore as never,
      email,
      new LegalConsentService(createFakeUserConsentRepository()),
    );
  });

  it('rejects login when credentials are wrong', async () => {
    const secretHash = await hashPassword('correct-password-12');
    users.rows.set('user-1', makeUser());
    credentials.rows.push(
      makeCredential({ secretHash, providerRef: 'player@example.com', userId: 'user-1' }),
    );

    await expect(
      service.login({ email: 'player@example.com', password: 'wrong-password-99' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    await expect(
      service.login({ email: 'missing@example.com', password: 'anything-long-1' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('never authenticates a null-hash credential, regardless of the password supplied', async () => {
    // OAuth-only accounts (4.2) plant a `type=password` credential with
    // `secretHash: null` purely as an email claim placeholder — it must never
    // double as a login method. This locks that `credential?.secretHash ==
    // null` guard in `login` as a regression: any weakening of it (a falsy
    // check that a `''` hash would also satisfy, a loose `==` against the
    // supplied password, a "no hash means skip the check" branch) is an
    // account takeover on precisely the accounts the placeholder defends.
    users.rows.set('user-1', makeUser());
    credentials.rows.push(
      makeCredential({
        secretHash: null,
        providerRef: 'oauth-only@example.com',
        userId: 'user-1',
      }),
    );

    const attempts = [
      '',
      'password',
      'null',
      'undefined',
      null as unknown as string,
      undefined as unknown as string,
    ];
    for (const password of attempts) {
      await expect(
        service.login({ email: 'oauth-only@example.com', password }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    }
  });

  it('registers a user and returns SessionCredentialResponse shape', async () => {
    const result = await service.register({
      email: 'New@Example.com',
      password: 'secure-password-12',
      displayName: 'New Player',
      handle: 'new_player',
      // 12.4c — a birth date comfortably past the 13-year floor, and a real
      // country code. Both are required now.
      birthDate: '1995-06-15',
      countryCode: 'TR',
      locale: 'en' as const,
      shownLegalDocuments: currentShownDocuments(),
      termsAccepted: true,
    });

    expect(result).toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });

    const created = [...users.rows.values()][0];
    expect(created?.handle).toBe('new_player');
    expect(created?.displayName).toBe('New Player');

    expect(credentials.rows).toHaveLength(1);
    expect(credentials.rows[0]?.providerRef).toBe('new@example.com');
    expect(credentials.rows[0]?.secretHash).toEqual(expect.any(String));
    expect(settings.rows.has(created!.id)).toBe(true);
    expect(sessions.rows.size).toBe(1);

    const access = await tokens.verifyAccessToken(result.accessToken);
    expect(access).toMatchObject({ sub: created!.id, kind: 'access' });
    expect(access?.sessionId).toEqual(expect.any(String));
  });

  it('rejects refresh when sessionId is missing from the refresh token', async () => {
    const refreshToken = await tokens.signRefreshToken('user-1');

    await expect(service.refresh({ refreshToken })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects register when handle is taken', async () => {
    users.rows.set('user-1', makeUser({ handle: 'taken_handle' }));

    await expect(
      service.register({
        email: 'other@example.com',
        password: 'secure-password-12',
        displayName: 'Other',
        handle: 'taken_handle',
        // 12.4c — a birth date comfortably past the 13-year floor, and a real
        // country code. Both are required now.
        birthDate: '1995-06-15',
        countryCode: 'TR',
        locale: 'en' as const,
        shownLegalDocuments: currentShownDocuments(),
        termsAccepted: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('sends reset email for known accounts and stays silent for unknown emails', async () => {
    const secretHash = await hashPassword('correct-password-12');
    users.rows.set('user-1', makeUser());
    credentials.rows.push(
      makeCredential({ secretHash, providerRef: 'player@example.com', userId: 'user-1' }),
    );

    await service.forgotPassword({ email: 'player@example.com' });
    expect(email.sent).toHaveLength(1);
    expect(email.sent[0]?.to).toBe('player@example.com');

    email.sent.length = 0;
    await service.forgotPassword({ email: 'missing@example.com' });
    expect(email.sent).toHaveLength(0);
  });

  it('resets password and revokes sessions when token is valid', async () => {
    const oldHash = await hashPassword('old-password-12xx');
    users.rows.set('user-1', makeUser());
    credentials.rows.push(
      makeCredential({
        id: 'cred-1',
        secretHash: oldHash,
        providerRef: 'player@example.com',
        userId: 'user-1',
      }),
    );
    sessions.rows.set('session-1', makeSession({ id: 'session-1', userId: 'user-1' }));
    await passwordResetStore.put('reset-token', 'user-1');

    await service.resetPassword({ token: 'reset-token', password: 'new-password-12ab' });

    const updated = credentials.rows[0];
    expect(updated?.secretHash).not.toBe(oldHash);
    expect(await verifyPassword('new-password-12ab', updated!.secretHash!)).toBe(true);
    expect(sessions.rows.get('session-1')?.revokedAt).not.toBeNull();
    expect(await passwordResetStore.getUserId('reset-token')).toBeNull();
  });

  it('rejects reset when token is invalid', async () => {
    await expect(
      service.resetPassword({ token: 'bad-token', password: 'new-password-12ab' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // Bug 7. The token used to be read at the top of `resetPassword` and deleted
  // at the bottom, with a deliberately slow password hash in between — so the
  // window in which two requests could both hold the same live token was as
  // wide as a hash. Both would set a password and the last writer would own the
  // account. The token is now claimed by a single GETDEL before any of that.
  it('lets only one of two concurrent resets with the same token succeed', async () => {
    const oldHash = await hashPassword('old-password-12xx');
    users.rows.set('user-1', makeUser());
    credentials.rows.push(
      makeCredential({
        id: 'cred-1',
        secretHash: oldHash,
        providerRef: 'player@example.com',
        userId: 'user-1',
      }),
    );
    await passwordResetStore.put('reset-token', 'user-1');

    const results = await Promise.allSettled([
      service.resetPassword({ token: 'reset-token', password: 'attacker-password-1' }),
      service.resetPassword({ token: 'reset-token', password: 'victim-password-12' }),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(BadRequestException);

    // Exactly one of the two passwords is live — never both, never a mix.
    const stored = credentials.rows[0]?.secretHash;
    const matches = await Promise.all([
      verifyPassword('attacker-password-1', stored!),
      verifyPassword('victim-password-12', stored!),
    ]);
    expect(matches.filter(Boolean)).toHaveLength(1);
  });

  it('spends the reset token even when the reset then fails', async () => {
    // No password credential for this user, so the reset fails after the token
    // is claimed. Burning it is the deliberate trade: putting it back would
    // reopen the window above, and the user can request another.
    users.rows.set('user-nopass', makeUser({ id: 'user-nopass' }));
    await passwordResetStore.put('lonely-token', 'user-nopass');

    await expect(
      service.resetPassword({ token: 'lonely-token', password: 'new-password-12ab' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(await passwordResetStore.getUserId('lonely-token')).toBeNull();
  });

  it('issues credentials on successful login and refresh', async () => {
    const secretHash = await hashPassword('correct-password-12');
    users.rows.set('user-1', makeUser());
    credentials.rows.push(
      makeCredential({ secretHash, providerRef: 'player@example.com', userId: 'user-1' }),
    );

    const login = await service.login({
      email: 'player@example.com',
      password: 'correct-password-12',
    });
    expect(login.accessToken).toEqual(expect.any(String));

    const refresh = await service.refresh({ refreshToken: login.refreshToken });
    expect(refresh.accessToken).toEqual(expect.any(String));
    expect([...sessions.rows.values()].some((row) => row.revokedAt != null)).toBe(true);
  });

  // Bug 6. A refresh token is single-use: presenting it rotates the session.
  // The check ("is this session still active?") and the write ("revoke it")
  // used to be two statements, so two requests carrying the same token could
  // both pass the check and both mint a credential pair — one refresh token
  // becoming two live sessions, which is exactly what an attacker replaying a
  // stolen token wants. The consume is now a single conditional UPDATE.
  it('lets only one of two concurrent refreshes with the same token succeed', async () => {
    const secretHash = await hashPassword('correct-password-12');
    users.rows.set('user-1', makeUser());
    credentials.rows.push(
      makeCredential({ secretHash, providerRef: 'player@example.com', userId: 'user-1' }),
    );

    const login = await service.login({
      email: 'player@example.com',
      password: 'correct-password-12',
    });

    const results = await Promise.allSettled([
      service.refresh({ refreshToken: login.refreshToken }),
      service.refresh({ refreshToken: login.refreshToken }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(UnauthorizedException);

    // One rotation, so exactly one new session joins the consumed original.
    expect(sessions.rows.size).toBe(2);
    const active = [...sessions.rows.values()].filter((row) => row.revokedAt == null);
    expect(active).toHaveLength(1);
  });

  it('rejects a refresh token that has already been consumed', async () => {
    const secretHash = await hashPassword('correct-password-12');
    users.rows.set('user-1', makeUser());
    credentials.rows.push(
      makeCredential({ secretHash, providerRef: 'player@example.com', userId: 'user-1' }),
    );

    const login = await service.login({
      email: 'player@example.com',
      password: 'correct-password-12',
    });

    await service.refresh({ refreshToken: login.refreshToken });
    await expect(service.refresh({ refreshToken: login.refreshToken })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('logs out the current session or all active sessions', async () => {
    sessions.rows.set('session-1', makeSession({ id: 'session-1', userId: 'user-1' }));
    sessions.rows.set('session-2', makeSession({ id: 'session-2', userId: 'user-1' }));

    await service.logoutCurrent('user-1', 'session-1');
    expect(sessions.rows.get('session-1')?.revokedAt).not.toBeNull();
    expect(sessions.rows.get('session-2')?.revokedAt).toBeNull();

    await service.logoutCurrent('user-1');
    expect(sessions.rows.get('session-2')?.revokedAt).not.toBeNull();
  });

  it('rejects register when email is already registered', async () => {
    credentials.rows.push(makeCredential({ providerRef: 'taken@example.com' }));
    await expect(
      service.register({
        email: 'taken@example.com',
        password: 'secure-password-12',
        displayName: 'Other',
        handle: 'other_handle',
        // 12.4c — a birth date comfortably past the 13-year floor, and a real
        // country code. Both are required now.
        birthDate: '1995-06-15',
        countryCode: 'TR',
        locale: 'en' as const,
        shownLegalDocuments: currentShownDocuments(),
        termsAccepted: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  describe('signInMethods', () => {
    it('counts a real password as usable and a null-hash placeholder as not', async () => {
      credentials.rows.push(
        makeCredential({
          id: 'cred-placeholder',
          userId: 'user-1',
          type: 'password',
          secretHash: null,
        }),
      );

      const result = await service.signInMethods('user-1');

      expect(result).toEqual({
        password: { usable: false },
        google: { connected: false },
        discord: { connected: false },
        usableCount: 0,
      });
    });

    it('reports connected providers and a total matching the disconnect guard', async () => {
      credentials.rows.push(
        makeCredential({
          id: 'cred-password',
          userId: 'user-1',
          type: 'password',
          secretHash: 'hashed',
        }),
        makeCredential({
          id: 'cred-google',
          userId: 'user-1',
          type: 'oauth',
          provider: 'google',
          providerRef: 'google:sub-1',
        }),
      );

      const result = await service.signInMethods('user-1');

      expect(result).toEqual({
        password: { usable: true },
        google: { connected: true },
        discord: { connected: false },
        usableCount: 2,
      });
    });
  });

  describe('setPassword', () => {
    it('fills in an existing null-hash placeholder without requiring an email', async () => {
      credentials.rows.push(
        makeCredential({
          id: 'cred-placeholder',
          userId: 'user-1',
          type: 'password',
          providerRef: 'player@example.com',
          secretHash: null,
        }),
      );

      await service.setPassword('user-1', { password: 'new-secure-pass-1' });

      const updated = credentials.rows.find((row) => row.id === 'cred-placeholder');
      expect(updated?.secretHash).not.toBeNull();
      const valid = await verifyPassword('new-secure-pass-1', updated?.secretHash ?? '');
      expect(valid).toBe(true);
    });

    it('rejects when a real password is already set', async () => {
      credentials.rows.push(
        makeCredential({
          id: 'cred-password',
          userId: 'user-1',
          type: 'password',
          secretHash: 'already-hashed',
        }),
      );

      await expect(
        service.setPassword('user-1', { password: 'new-secure-pass-1' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('requires an email when the caller has no password credential at all', async () => {
      await expect(
        service.setPassword('user-1', { password: 'new-secure-pass-1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates a new password credential from a supplied email', async () => {
      await service.setPassword('user-1', {
        email: 'fresh@example.com',
        password: 'new-secure-pass-1',
      });

      const created = credentials.rows.find(
        (row) => row.type === 'password' && row.providerRef === 'fresh@example.com',
      );
      expect(created?.userId).toBe('user-1');
      expect(created?.secretHash).not.toBeNull();
    });

    it('rejects a supplied email already registered to a password account', async () => {
      credentials.rows.push(
        makeCredential({
          id: 'cred-other',
          userId: 'user-2',
          type: 'password',
          providerRef: 'taken@example.com',
          secretHash: 'hashed',
        }),
      );

      await expect(
        service.setPassword('user-1', {
          email: 'taken@example.com',
          password: 'new-secure-pass-1',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
