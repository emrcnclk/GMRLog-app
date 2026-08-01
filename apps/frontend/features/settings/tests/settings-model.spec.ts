import { describe, expect, it } from 'vitest';

import {
  defaultSettings,
  mapSettingsError,
  resolveSettingsView,
  settingsRenderOrder,
  SETTINGS_HUB_SECTIONS,
  themeLabel,
  THEME_OPTIONS,
} from '../model/settings-model';

describe('settings-model', () => {
  it('exposes light dark system only', () => {
    expect(THEME_OPTIONS).toEqual(['light', 'dark', 'system']);
  });

  it('labels themes for a11y', () => {
    expect(themeLabel('light')).toBe('Light');
    expect(themeLabel('dark')).toBe('Dark');
    expect(themeLabel('system')).toBe('System');
  });

  it('defaults settings aggregate', () => {
    expect(defaultSettings()).toEqual({
      appearance: { theme: 'system', locale: null },
      accessibility: { reduceMotion: false },
    });
  });

  it('resolves loading when pending without cache', () => {
    expect(
      resolveSettingsView({
        isPending: true,
        isError: false,
        error: null,
        settings: null,
        isRefreshing: false,
      }).status,
    ).toBe('loading');
  });

  it('resolves error when failed without cache', () => {
    const view = resolveSettingsView({
      isPending: false,
      isError: true,
      error: new Error('boom'),
      settings: null,
      isRefreshing: false,
    });
    expect(view.status).toBe('error');
    expect(view.error).toBeInstanceOf(Error);
  });

  it('resolves ready with settings', () => {
    const settings = defaultSettings();
    const view = resolveSettingsView({
      isPending: false,
      isError: false,
      error: null,
      settings,
      isRefreshing: true,
    });
    expect(view.status).toBe('ready');
    expect(view.isRefreshing).toBe(true);
    expect(view.settings?.appearance.theme).toBe('system');
  });

  it('maps offline settings errors', () => {
    const mapped = mapSettingsError(new Error('x'), false);
    expect(mapped.kind).toBe('offline');
  });

  it('keeps hub section render order stable', () => {
    expect(settingsRenderOrder()).toEqual([
      'general',
      'account',
      'integrations',
      'notifications',
      'storage',
      'diagnostics',
      'about',
    ]);
    expect(SETTINGS_HUB_SECTIONS).toHaveLength(7);
  });
});
