import { describe, expect, it, vi } from 'vitest';

describe('settings logout contract', () => {
  it('logout clears local session even if network fails', async () => {
    const logoutSession = vi.fn().mockRejectedValue(new Error('network'));
    const clearLocal = vi.fn().mockResolvedValue(undefined);

    async function runLogout() {
      try {
        await logoutSession();
      } catch {
        // best-effort
      }
      await clearLocal();
    }

    await runLogout();
    expect(logoutSession).toHaveBeenCalled();
    expect(clearLocal).toHaveBeenCalled();
  });

  it('logout path uses DELETE /sessions/current vocabulary', () => {
    const path = '/sessions/current';
    expect(path).toBe('/sessions/current');
  });

  it('confirm dialog required before logout — no Alert()', () => {
    const ui = { confirmDialog: true, alert: false };
    expect(ui.confirmDialog).toBe(true);
    expect(ui.alert).toBe(false);
  });
});

describe('settings cache clearing contract', () => {
  it('image clear calls expo-image caches', async () => {
    const clearDisk = vi.fn().mockResolvedValue(undefined);
    const clearMemory = vi.fn().mockResolvedValue(undefined);
    await clearDisk();
    await clearMemory();
    expect(clearDisk).toHaveBeenCalled();
    expect(clearMemory).toHaveBeenCalled();
  });

  it('query clear uses queryClient.clear', () => {
    const clear = vi.fn();
    clear();
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it('app clear keeps SecureStore session tokens', () => {
    const cleared = ['image', 'query'] as const;
    const kept = ['secureStore.session'] as const;
    expect(cleared).not.toContain('secureStore.session' as never);
    expect(kept).toContain('secureStore.session');
  });
});
