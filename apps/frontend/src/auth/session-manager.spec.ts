import { describe, expect, it } from 'vitest';

import { createInMemorySecureStorage } from '../../lib/storage/secure-storage';
import { SessionManager } from './session-manager';
import { isAccessTokenExpired } from './jwt';

describe('SessionManager (D3.2)', () => {
  it('hydrates tokens without claiming authenticated', async () => {
    const storage = createInMemorySecureStorage();
    const first = new SessionManager(storage);
    await first.persistTokens({ accessToken: 'a', refreshToken: 'r' });

    const second = new SessionManager(storage);
    const material = await second.hydrate();
    expect(material).toEqual({ accessToken: 'a', refreshToken: 'r' });
    expect(second.getState()).toBe('unknown');
  });

  it('markAuthenticated activates after bootstrap success', async () => {
    const manager = new SessionManager(createInMemorySecureStorage());
    await manager.persistTokens({ accessToken: 'a', refreshToken: 'r' });
    manager.markAuthenticated();
    expect(manager.getState()).toBe('authenticated');
  });
});

describe('isAccessTokenExpired', () => {
  it('treats unreadable tokens as expired', () => {
    expect(isAccessTokenExpired('not-a-jwt')).toBe(true);
  });

  it('reads exp from payload', () => {
    const header = Buffer.from('{}').toString('base64url');
    const future = Buffer.from(
      JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 600 }),
    ).toString('base64url');
    const past = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 10 })).toString(
      'base64url',
    );
    expect(isAccessTokenExpired(`${header}.${future}.x`)).toBe(false);
    expect(isAccessTokenExpired(`${header}.${past}.x`)).toBe(true);
  });
});
