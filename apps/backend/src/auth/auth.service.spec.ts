import { JwtService } from '@nestjs/jwt';
import { describe, expect, it } from 'vitest';

import { parseBackendEnv } from '../infrastructure/config/env.schema';
import { AuthService, extractBearerToken } from './auth.service';
import { sessionStateForIdentity } from './interfaces/identity';
import { TokenService } from './jwt/token.service';
import { MemorySessionRepository } from './testing/session-fixture';

function createAuthService(): {
  auth: AuthService;
  tokens: TokenService;
  sessions: MemorySessionRepository;
} {
  const env = parseBackendEnv({});
  const jwt = new JwtService({
    secret: env.JWT_SECRET,
    signOptions: { issuer: env.JWT_ISSUER },
    verifyOptions: { issuer: env.JWT_ISSUER },
  });
  const tokens = new TokenService(jwt, env);
  const sessions = new MemorySessionRepository();
  return { auth: new AuthService(tokens, sessions), tokens, sessions };
}

describe('extractBearerToken', () => {
  it('extracts the token from a bearer header', () => {
    expect(extractBearerToken('Bearer abc.def.ghi')).toBe('abc.def.ghi');
    expect(extractBearerToken('bearer abc')).toBe('abc');
  });

  it('rejects malformed headers', () => {
    expect(extractBearerToken(undefined)).toBeNull();
    expect(extractBearerToken('')).toBeNull();
    expect(extractBearerToken('Basic abc')).toBeNull();
    expect(extractBearerToken('Bearer')).toBeNull();
    expect(extractBearerToken('Bearer a b')).toBeNull();
  });
});

describe('AuthService.resolveIdentity', () => {
  it('resolves a valid access token into an authenticated identity', async () => {
    const { auth, tokens, sessions } = createAuthService();
    const session = sessions.seed('user-1');
    const token = await tokens.signAccessToken('user-1', session.id);
    const identity = await auth.resolveIdentity(`Bearer ${token}`);
    expect(identity).toEqual({ class: 'player', userId: 'user-1', sessionId: session.id });
    expect(sessionStateForIdentity(identity)).toBe('authenticated');
  });

  it('fails closed into guest for missing or invalid credentials', async () => {
    const { auth } = createAuthService();
    expect(await auth.resolveIdentity(undefined)).toEqual({ class: 'guest' });
    expect(await auth.resolveIdentity('Bearer not-a-jwt')).toEqual({ class: 'guest' });
  });

  it('never accepts a refresh token as an access credential', async () => {
    const { auth, tokens } = createAuthService();
    const refresh = await tokens.signRefreshToken('user-1', 'session-1');
    const identity = await auth.resolveIdentity(`Bearer ${refresh}`);
    expect(identity).toEqual({ class: 'guest' });
  });

  // Bug 5. The signature stayed valid for the rest of the token's 15-minute
  // TTL after logout, so signing out — including "log out everywhere" after a
  // device was lost — did not actually end access. The session row is now read
  // on every request.
  describe('Bug 5 — a revoked session ends access immediately', () => {
    it('rejects a token whose session has been revoked', async () => {
      const { auth, tokens, sessions } = createAuthService();
      const session = sessions.seed('user-1');
      const token = await tokens.signAccessToken('user-1', session.id);

      expect(await auth.resolveIdentity(`Bearer ${token}`)).toMatchObject({ class: 'player' });

      await sessions.revoke(session.id);

      expect(await auth.resolveIdentity(`Bearer ${token}`)).toEqual({ class: 'guest' });
    });

    it('rejects a token whose session no longer exists', async () => {
      const { auth, tokens, sessions } = createAuthService();
      const session = sessions.seed('user-1');
      const token = await tokens.signAccessToken('user-1', session.id);
      await sessions.delete(session.id);
      expect(await auth.resolveIdentity(`Bearer ${token}`)).toEqual({ class: 'guest' });
    });

    it('rejects a token whose session has expired', async () => {
      const { auth, tokens, sessions } = createAuthService();
      const session = sessions.seed('user-1');
      sessions.rows.set(session.id, { ...session, expiresAt: new Date(Date.now() - 1000) });
      const token = await tokens.signAccessToken('user-1', session.id);
      expect(await auth.resolveIdentity(`Bearer ${token}`)).toEqual({ class: 'guest' });
    });

    it('rejects a token naming a session that belongs to someone else', async () => {
      const { auth, tokens, sessions } = createAuthService();
      const victim = sessions.seed('user-victim');
      const token = await tokens.signAccessToken('user-attacker', victim.id);
      expect(await auth.resolveIdentity(`Bearer ${token}`)).toEqual({ class: 'guest' });
    });

    it('rejects a token carrying no session claim at all', async () => {
      const { auth, tokens } = createAuthService();
      const token = await tokens.signAccessToken('user-1');
      expect(await auth.resolveIdentity(`Bearer ${token}`)).toEqual({ class: 'guest' });
    });

    it('leaves a second live session working when one is revoked', async () => {
      const { auth, tokens, sessions } = createAuthService();
      const phone = sessions.seed('user-1', 'session-phone');
      const laptop = sessions.seed('user-1', 'session-laptop');
      const phoneToken = await tokens.signAccessToken('user-1', phone.id);
      const laptopToken = await tokens.signAccessToken('user-1', laptop.id);

      await sessions.revoke(phone.id);

      expect(await auth.resolveIdentity(`Bearer ${phoneToken}`)).toEqual({ class: 'guest' });
      expect(await auth.resolveIdentity(`Bearer ${laptopToken}`)).toMatchObject({
        class: 'player',
        userId: 'user-1',
      });
    });
  });
});

describe('TokenService', () => {
  it('round-trips access and refresh payloads with kind discrimination', async () => {
    const { tokens } = createAuthService();
    const access = await tokens.signAccessToken('user-9');
    const refresh = await tokens.signRefreshToken('user-9', 'session-9');

    expect(await tokens.verifyAccessToken(access)).toMatchObject({ sub: 'user-9', kind: 'access' });
    expect(await tokens.verifyRefreshToken(refresh)).toMatchObject({
      sub: 'user-9',
      kind: 'refresh',
      sessionId: 'session-9',
    });
    expect(await tokens.verifyAccessToken(refresh)).toBeNull();
    expect(await tokens.verifyRefreshToken(access)).toBeNull();
  });
});
