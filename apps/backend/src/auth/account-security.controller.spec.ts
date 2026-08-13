import { describe, expect, it, vi } from 'vitest';

import { AccountSecurityController } from './account-security.controller';
import type { AuthenticatedIdentity } from './interfaces/identity';

const CALLER: AuthenticatedIdentity = { class: 'player', userId: 'user-1' };

describe('AccountSecurityController', () => {
  it('scopes sign-in-methods to the authenticated caller', async () => {
    const sessions = {
      signInMethods: vi.fn(async () => ({
        password: { usable: true },
        google: { connected: false },
        discord: { connected: false },
        usableCount: 1,
      })),
    };
    const controller = new AccountSecurityController(sessions as never);

    const result = await controller.signInMethods(CALLER);

    expect(sessions.signInMethods).toHaveBeenCalledWith('user-1');
    expect(result.usableCount).toBe(1);
  });

  it('delegates password creation to the authenticated caller', async () => {
    const sessions = { setPassword: vi.fn(async () => undefined) };
    const controller = new AccountSecurityController(sessions as never);

    await controller.setPassword(CALLER, { password: 'new-secure-pass-1' } as never);

    expect(sessions.setPassword).toHaveBeenCalledWith('user-1', {
      password: 'new-secure-pass-1',
    });
  });
});
