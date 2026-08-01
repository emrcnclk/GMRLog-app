import { JwtService } from '@nestjs/jwt';
import { describe, expect, it } from 'vitest';

import { parseBackendEnv } from '../infrastructure/config/env.schema';
import { AuthService, extractBearerToken } from './auth.service';
import { sessionStateForIdentity } from './interfaces/identity';
import { TokenService } from './jwt/token.service';

function createAuthService(): { auth: AuthService; tokens: TokenService } {
  const env = parseBackendEnv({});
  const jwt = new JwtService({
    secret: env.JWT_SECRET,
    signOptions: { issuer: env.JWT_ISSUER },
    verifyOptions: { issuer: env.JWT_ISSUER },
  });
  const tokens = new TokenService(jwt, env);
  return { auth: new AuthService(tokens), tokens };
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
    const { auth, tokens } = createAuthService();
    const token = await tokens.signAccessToken('user-1');
    const identity = await auth.resolveIdentity(`Bearer ${token}`);
    expect(identity).toEqual({ class: 'player', userId: 'user-1' });
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
