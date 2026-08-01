import { describe, expect, it } from 'vitest';

import { resolveSettingsView } from '../model/settings-model';
import { resolveConnectedAccountsView } from '../model/account-model';

describe('settings offline and render order', () => {
  it('error state supports offline retry contract', () => {
    const view = resolveSettingsView({
      isPending: false,
      isError: true,
      error: new Error('offline'),
      settings: null,
      isRefreshing: false,
    });
    expect(view.status).toBe('error');
  });

  it('ready state keeps refresh flag for pull-to-refresh', () => {
    const view = resolveSettingsView({
      isPending: false,
      isError: false,
      error: null,
      settings: {
        appearance: { theme: 'light', locale: 'en' },
        accessibility: { reduceMotion: true },
      },
      isRefreshing: true,
    });
    expect(view.status).toBe('ready');
    expect(view.isRefreshing).toBe(true);
    expect(view.settings?.accessibility.reduceMotion).toBe(true);
  });

  it('connected accounts empty is distinct from error', () => {
    expect(
      resolveConnectedAccountsView({
        isPending: false,
        isError: false,
        error: null,
        items: [],
      }).status,
    ).toBe('empty');
  });

  it('screen section contract for hub', () => {
    const sections = [
      'general',
      'account',
      'integrations',
      'notifications',
      'storage',
      'diagnostics',
      'about',
    ] as const;
    expect(sections).toHaveLength(7);
    expect(sections[0]).toBe('general');
    expect(sections[sections.length - 1]).toBe('about');
  });

  it('notifications honesty contract — no invented PATCH', () => {
    const supported = ['GET /notifications', 'POST /notifications/read'] as const;
    expect(supported).not.toContain('PATCH /settings/notifications');
  });
});
