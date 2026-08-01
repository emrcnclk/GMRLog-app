import { describe, expect, it } from 'vitest';

import { resolveAuthGate } from './auth-gate-decision';

describe('resolveAuthGate', () => {
  it('waits while bootstrapping', () => {
    expect(
      resolveAuthGate({
        isBootstrapping: true,
        isAuthenticated: false,
        isGuest: false,
        rootSegment: '(app)',
      }),
    ).toEqual({ action: 'wait' });
  });

  it('sends guests from app to auth', () => {
    expect(
      resolveAuthGate({
        isBootstrapping: false,
        isAuthenticated: false,
        isGuest: true,
        rootSegment: '(app)',
      }),
    ).toEqual({ action: 'replace', href: '/(auth)' });
  });

  it('sends authenticated users from auth to app', () => {
    expect(
      resolveAuthGate({
        isBootstrapping: false,
        isAuthenticated: true,
        isGuest: false,
        rootSegment: '(auth)',
      }),
    ).toEqual({ action: 'replace', href: '/(app)/(tabs)/home' });
  });

  it('allows guests on auth and players on app', () => {
    expect(
      resolveAuthGate({
        isBootstrapping: false,
        isAuthenticated: false,
        isGuest: true,
        rootSegment: '(auth)',
      }),
    ).toEqual({ action: 'allow' });

    expect(
      resolveAuthGate({
        isBootstrapping: false,
        isAuthenticated: true,
        isGuest: false,
        rootSegment: '(app)',
      }),
    ).toEqual({ action: 'allow' });
  });
});
