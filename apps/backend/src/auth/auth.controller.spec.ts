import { describe, expect, it, vi } from 'vitest';

import { AuthController } from './auth.controller';
import { SessionsService } from './sessions.service';

describe('AuthController', () => {
  const sessions = {
    login: vi.fn(),
    register: vi.fn(),
    refresh: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    logoutCurrent: vi.fn(),
  } as unknown as SessionsService;
  const controller = new AuthController(sessions);

  it('delegates session and password flows to SessionsService', async () => {
    sessions.login = vi.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
    await controller.login({ email: 'a@b.com', password: 'password-123456' } as never);
    expect(sessions.login).toHaveBeenCalledOnce();

    await controller.register({} as never);
    await controller.refresh({} as never);
    await controller.forgotPassword({} as never);
    await controller.resetPassword({} as never);
    await controller.logoutCurrent({ class: 'player', userId: 'user-1', sessionId: 's-1' });
    expect(sessions.register).toHaveBeenCalledOnce();
    expect(sessions.refresh).toHaveBeenCalledOnce();
    expect(sessions.forgotPassword).toHaveBeenCalledOnce();
    expect(sessions.resetPassword).toHaveBeenCalledOnce();
    expect(sessions.logoutCurrent).toHaveBeenCalledWith('user-1', 's-1');
  });
});
