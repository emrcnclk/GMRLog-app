import { describe, expect, it } from 'vitest';

import { resolveAuthGate } from '../navigation/auth-gate-decision';

import {
  AUTH_PROTECTED_ROOT_SEGMENTS,
  DEEP_LINK_SCHEME,
  KNOWN_STUB_ROUTES,
  TAB_ROUTES,
  isProtectedRootSegment,
  resolveDeepLinkFamily,
} from './navigation-audit';

describe('D3.16 navigation smoke', () => {
  it('protects app settings and modals for guests', () => {
    for (const segment of AUTH_PROTECTED_ROOT_SEGMENTS) {
      expect(
        resolveAuthGate({
          isBootstrapping: false,
          isAuthenticated: false,
          isGuest: true,
          rootSegment: segment,
        }),
      ).toEqual({ action: 'replace', href: '/(auth)' });
      expect(isProtectedRootSegment(segment)).toBe(true);
    }
  });

  it('redirects authenticated users away from auth after login', () => {
    expect(
      resolveAuthGate({
        isBootstrapping: false,
        isAuthenticated: true,
        isGuest: false,
        rootSegment: '(auth)',
      }),
    ).toEqual({ action: 'replace', href: '/(app)/(tabs)/home' });
  });

  it('keeps five primary tabs', () => {
    expect(TAB_ROUTES).toHaveLength(5);
    expect(TAB_ROUTES[0]).toBe('/(app)/(tabs)/home');
  });

  it('documents known stub routes without inventing product screens', () => {
    expect(KNOWN_STUB_ROUTES).toContain('/(app)/user/[id]');
    expect(KNOWN_STUB_ROUTES).toContain('+not-found');
  });
});

describe('D3.16 deep link verification', () => {
  it('recognizes custom scheme', () => {
    const result = resolveDeepLinkFamily(`${DEEP_LINK_SCHEME}://home`);
    expect(result.isAppScheme).toBe(true);
    expect(result.scheme).toBe(DEEP_LINK_SCHEME);
  });

  it('recognizes universal hosts from app.config', () => {
    expect(resolveDeepLinkFamily('https://gmrlog.com/discover').isUniversalLink).toBe(true);
    expect(resolveDeepLinkFamily('https://www.gmrlog.com/profile').isUniversalLink).toBe(true);
    expect(resolveDeepLinkFamily('https://evil.example/home').isUniversalLink).toBe(false);
  });

  it('rejects malformed urls safely', () => {
    expect(resolveDeepLinkFamily('not a url').isAppScheme).toBe(false);
  });
});
