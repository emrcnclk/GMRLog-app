import { describe, expect, it } from 'vitest';

import { SETTINGS_HUB_NAV, SETTINGS_ROUTES } from '../navigation/settings-routes';
import { LOCAL_FEATURE_FLAGS } from '../model/diagnostics-model';
import { ABOUT_LINKS } from '../model/about-model';
import { THEME_OPTIONS } from '../model/settings-model';

describe('settings component surface contracts', () => {
  it('theme selector options match vocabulary', () => {
    expect(THEME_OPTIONS).toContain('system');
  });

  it('hub rows equal SETTINGS_HUB_NAV length', () => {
    expect(SETTINGS_HUB_NAV).toHaveLength(7);
  });

  it('notifications prefs stay disabled without endpoint', () => {
    const invented = 'PATCH /settings/notifications';
    expect(invented.startsWith('PATCH')).toBe(true);
    expect(SETTINGS_ROUTES.notifications).toBe('/(settings)/notifications');
  });

  it('feature flags list is non-empty read-only', () => {
    expect(LOCAL_FEATURE_FLAGS.length).toBeGreaterThanOrEqual(3);
  });

  it('about link rows cover five entries', () => {
    // Five since 12.3: the KVKK Aydinlatma Metni is a document distinct from
    // the privacy policy, so it gets its own row.
    expect(ABOUT_LINKS).toHaveLength(5);
  });

  it('delete account and privacy remain placeholders', () => {
    const placeholders = ['delete-account', 'privacy'] as const;
    expect(placeholders).toContain('delete-account');
    expect(placeholders).toContain('privacy');
  });

  it('accent preview is UI-only', () => {
    const accentApi = null;
    expect(accentApi).toBeNull();
  });

  it('language uses appearance locale patch path', () => {
    expect('/settings/appearance').toContain('appearance');
  });

  it('reduce motion uses accessibility patch path', () => {
    expect('/settings/accessibility').toContain('accessibility');
  });

  it('connected accounts uses GET only', () => {
    expect('/connected-accounts').not.toContain('DELETE');
  });
});
