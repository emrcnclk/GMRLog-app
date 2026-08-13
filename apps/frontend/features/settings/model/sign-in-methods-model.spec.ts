import type { SignInMethodsResponse } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import { canDisconnect } from './sign-in-methods-model';

function methods(overrides: Partial<SignInMethodsResponse> = {}): SignInMethodsResponse {
  return {
    password: { usable: false },
    google: { connected: false },
    discord: { connected: false },
    usableCount: 0,
    ...overrides,
  };
}

describe('canDisconnect', () => {
  it('is false for a provider that is not connected', () => {
    expect(canDisconnect(methods({ usableCount: 2 }), 'google')).toBe(false);
  });

  it('is false when the provider is the only usable method', () => {
    const m = methods({ google: { connected: true }, usableCount: 1 });
    expect(canDisconnect(m, 'google')).toBe(false);
  });

  it('is true when another usable method remains', () => {
    const m = methods({
      google: { connected: true },
      password: { usable: true },
      usableCount: 2,
    });
    expect(canDisconnect(m, 'google')).toBe(true);
  });
});
