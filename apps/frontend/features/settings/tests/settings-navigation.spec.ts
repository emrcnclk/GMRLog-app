import { describe, expect, it } from 'vitest';

import {
  GENERAL_SUBNAV,
  SETTINGS_HUB_NAV,
  SETTINGS_ROUTES,
  settingsHref,
} from '../navigation/settings-routes';

describe('settings navigation', () => {
  it('defines hub and nested routes', () => {
    expect(SETTINGS_ROUTES.hub).toBe('/(settings)');
    expect(SETTINGS_ROUTES.general).toBe('/(settings)/general');
    expect(SETTINGS_ROUTES.appearance).toBe('/(settings)/appearance');
    expect(SETTINGS_ROUTES.accessibility).toBe('/(settings)/accessibility');
    expect(SETTINGS_ROUTES.account).toBe('/(settings)/account');
    expect(SETTINGS_ROUTES.integrations).toBe('/(settings)/integrations');
    expect(SETTINGS_ROUTES.notifications).toBe('/(settings)/notifications');
    expect(SETTINGS_ROUTES.storage).toBe('/(settings)/storage');
    expect(SETTINGS_ROUTES.diagnostics).toBe('/(settings)/diagnostics');
    expect(SETTINGS_ROUTES.about).toBe('/(settings)/about');
  });

  it('hub nav covers all top-level sections', () => {
    expect(SETTINGS_HUB_NAV.map((item) => item.key)).toEqual([
      'general',
      'account',
      'integrations',
      'notifications',
      'storage',
      'diagnostics',
      'about',
    ]);
  });

  it('general subnav points to appearance and accessibility', () => {
    expect(GENERAL_SUBNAV.map((item) => item.key)).toEqual(['appearance', 'accessibility']);
  });

  it('settingsHref resolves keys', () => {
    expect(settingsHref('storage')).toBe('/(settings)/storage');
    expect(settingsHref('about')).toBe('/(settings)/about');
  });

  it('every hub nav href matches SETTINGS_ROUTES', () => {
    for (const item of SETTINGS_HUB_NAV) {
      expect(item.href).toBe(SETTINGS_ROUTES[item.key]);
    }
  });
});
